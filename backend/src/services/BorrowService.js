const mongoose = require("mongoose");

const Borrow = require("../models/Borrow");
const BorrowDetail = require("../models/BorrowDetail");
const Book = require("../models/Book");
const Reader = require("../models/Reader");

// =========================
// Tạo phiếu mượn
// =========================
const createBorrow = async (data, employeeId) => {
  const { reader, dueDate, books } = data;

  if (!mongoose.isValidObjectId(reader)) {
    throw new Error("Độc giả không hợp lệ");
  }

  const readerExist = await Reader.findById(reader);

  if (!readerExist) {
    throw new Error("Không tìm thấy độc giả");
  }

  if (!readerExist.status) {
    throw new Error("Độc giả đã bị khóa");
  }

  if (!dueDate) {
    throw new Error("Vui lòng chọn hạn trả sách");
  }

  const parsedDueDate = new Date(dueDate);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  parsedDueDate.setHours(0, 0, 0, 0);

  if (Number.isNaN(parsedDueDate.getTime()) || parsedDueDate <= today) {
    throw new Error("Hạn trả phải lớn hơn ngày hiện tại");
  }

  if (!Array.isArray(books) || books.length === 0) {
    throw new Error("Danh sách sách không được để trống");
  }

  const normalizedBooks = books.map((item) => ({
    book: item.book,
    quantity: Number(item.quantity),
  }));

  for (const item of normalizedBooks) {
    if (!mongoose.isValidObjectId(item.book)) {
      throw new Error("Mã sách không hợp lệ");
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error("Số lượng mượn phải là số nguyên lớn hơn 0");
    }
  }

  // Không cho phép cùng một sách xuất hiện nhiều lần
  const bookIds = normalizedBooks.map((item) => item.book.toString());

  const uniqueBookIds = new Set(bookIds);

  if (uniqueBookIds.size !== bookIds.length) {
    throw new Error("Một quyển sách không được xuất hiện nhiều lần");
  }

  // Kiểm tra toàn bộ sách trước khi tạo phiếu
  const existingBooks = await Book.find({
    _id: {
      $in: bookIds,
    },
  });

  if (existingBooks.length !== normalizedBooks.length) {
    throw new Error("Có sách không tồn tại trong hệ thống");
  }

  const bookMap = new Map(
    existingBooks.map((book) => [book._id.toString(), book]),
  );

  for (const item of normalizedBooks) {
    const book = bookMap.get(item.book.toString());

    if (!book.status) {
      throw new Error(`Sách "${book.title}" đã ngừng hoạt động`);
    }

    if (book.available < item.quantity) {
      throw new Error(`Sách "${book.title}" chỉ còn ${book.available} quyển`);
    }
  }

  let borrow = null;
  const decreasedBooks = [];

  try {
    borrow = await Borrow.create({
      reader,
      employee: employeeId,
      dueDate: parsedDueDate,
    });

    /*
     * Giảm số lượng bằng điều kiện available >= quantity
     * để hạn chế trường hợp hai nhân viên mượn đồng thời.
     */
    for (const item of normalizedBooks) {
      const result = await Book.updateOne(
        {
          _id: item.book,
          status: true,
          available: {
            $gte: item.quantity,
          },
        },
        {
          $inc: {
            available: -item.quantity,
          },
        },
      );

      if (result.modifiedCount !== 1) {
        const book = bookMap.get(item.book.toString());

        throw new Error(
          `Sách "${book?.title || "không xác định"}" không còn đủ số lượng`,
        );
      }

      decreasedBooks.push(item);
    }

    const details = normalizedBooks.map((item) => ({
      borrow: borrow._id,
      book: item.book,
      quantity: item.quantity,
    }));

    await BorrowDetail.insertMany(details);

    return await Borrow.findById(borrow._id)
      .populate("reader")
      .populate("employee");
  } catch (error) {
    // Hoàn lại số lượng sách nếu quá trình tạo phiếu bị lỗi
    for (const item of decreasedBooks) {
      await Book.updateOne(
        {
          _id: item.book,
        },
        {
          $inc: {
            available: item.quantity,
          },
        },
      );
    }

    if (borrow) {
      await BorrowDetail.deleteMany({
        borrow: borrow._id,
      });

      await Borrow.findByIdAndDelete(borrow._id);
    }

    throw error;
  }
};

// =========================
// Danh sách phiếu mượn
// =========================
const getAllBorrows = async (query) => {
  let {
    page = 1,
    limit = 10,
    status,
    reader,
    employee,
    fromDate,
    toDate,
    sort,
  } = query;

  page = Math.max(Number(page) || 1, 1);
  limit = Math.max(Number(limit) || 10, 1);

  const filter = {};

  if (status && ["borrowing", "returned"].includes(status)) {
    filter.status = status;
  }

  if (reader && mongoose.isValidObjectId(reader)) {
    filter.reader = reader;
  }

  if (employee && mongoose.isValidObjectId(employee)) {
    filter.employee = employee;
  }

  if (fromDate || toDate) {
    filter.borrowDate = {};

    if (fromDate) {
      const startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);

      filter.borrowDate.$gte = startDate;
    }

    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);

      filter.borrowDate.$lte = endDate;
    }
  }

  let sortOption = {
    createdAt: -1,
  };

  if (sort === "borrowDate") {
    sortOption = {
      borrowDate: -1,
    };
  }

  if (sort === "returnDate") {
    sortOption = {
      returnDate: -1,
    };
  }

  if (sort === "dueDate") {
    sortOption = {
      dueDate: 1,
    };
  }

  const total = await Borrow.countDocuments(filter);

  const borrows = await Borrow.find(filter)
    .populate("reader")
    .populate("employee", "-password")
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    borrows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// =========================
// Chi tiết phiếu mượn
// =========================
const getBorrowById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã phiếu mượn không hợp lệ");
  }

  const borrow = await Borrow.findById(id)
    .populate("reader")
    .populate("employee", "-password");

  if (!borrow) {
    throw new Error("Không tìm thấy phiếu mượn");
  }

  const details = await BorrowDetail.find({
    borrow: id,
  }).populate({
    path: "book",
    populate: {
      path: "publisher",
    },
  });

  return {
    borrow,
    details,
  };
};

// =========================
// Trả sách
// =========================
const returnBorrow = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã phiếu mượn không hợp lệ");
  }

  const borrow = await Borrow.findById(id);

  if (!borrow) {
    throw new Error("Không tìm thấy phiếu mượn");
  }

  if (borrow.status === "returned") {
    throw new Error("Phiếu mượn đã được trả");
  }

  const details = await BorrowDetail.find({
    borrow: borrow._id,
  });

  if (details.length === 0) {
    throw new Error("Phiếu mượn không có thông tin sách");
  }

  for (const item of details) {
    await Book.updateOne(
      {
        _id: item.book,
      },
      {
        $inc: {
          available: item.quantity,
        },
      },
    );
  }

  borrow.status = "returned";
  borrow.returnDate = new Date();

  await borrow.save();

  return await Borrow.findById(borrow._id)
    .populate("reader")
    .populate("employee", "-password");
};

module.exports = {
  createBorrow,
  getAllBorrows,
  getBorrowById,
  returnBorrow,
};
