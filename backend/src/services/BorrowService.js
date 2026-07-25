const mongoose = require("mongoose");

const Borrow = require("../models/Borrow");
const BorrowDetail = require("../models/BorrowDetail");
const Book = require("../models/Book");
const Reader = require("../models/Reader");
const generateCode = require("../utils/generateCode");

const generateBorrowCode = async () => {
  const lastBorrow = await Borrow.findOne({
    borrowCode: /^PM\d+$/,
  })
    .sort({
      borrowCode: -1,
    })
    .select("borrowCode")
    .lean();

  let nextNumber = 1;

  if (lastBorrow?.borrowCode) {
    const currentNumber = Number(lastBorrow.borrowCode.replace("PM", ""));

    if (Number.isInteger(currentNumber)) {
      nextNumber = currentNumber + 1;
    }
  }

  return `PM${String(nextNumber).padStart(4, "0")}`;
};

// =========================
// Tạo phiếu mượn
// =========================
const createBorrow = async (data = {}, employeeId) => {
  const readerId = data.readerId || data.reader;

  const rawItems = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.books)
      ? data.books
      : [];

  if (!readerId) {
    throw new Error("Vui lòng chọn độc giả");
  }

  if (!employeeId) {
    throw new Error("Không xác định được nhân viên lập phiếu");
  }

  if (rawItems.length === 0) {
    throw new Error("Danh sách sách không được để trống");
  }

  if (!data.borrowDate) {
    throw new Error("Vui lòng chọn ngày mượn");
  }

  if (!data.dueDate) {
    throw new Error("Vui lòng chọn hạn trả");
  }

  const borrowDate = new Date(data.borrowDate);

  const dueDate = new Date(data.dueDate);

  if (Number.isNaN(borrowDate.getTime()) || Number.isNaN(dueDate.getTime())) {
    throw new Error("Ngày mượn hoặc hạn trả không hợp lệ");
  }

  if (dueDate < borrowDate) {
    throw new Error("Hạn trả không được nhỏ hơn ngày mượn");
  }

  const reader = await Reader.findById(readerId);

  if (!reader) {
    throw new Error("Không tìm thấy độc giả");
  }

  if (reader.status === false) {
    throw new Error("Độc giả đã bị khóa hoặc không còn hoạt động");
  }

  /*
   * Gộp các sách bị chọn trùng nhau.
   */
  const itemMap = new Map();

  for (const item of rawItems) {
    const bookId = item.bookId || item.book || item._id;

    const quantity = Number(item.quantity);

    if (!bookId) {
      throw new Error("Thông tin sách không hợp lệ");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Số lượng sách mượn không hợp lệ");
    }

    const key = String(bookId);

    itemMap.set(key, (itemMap.get(key) || 0) + quantity);
  }

  const normalizedItems = Array.from(itemMap.entries()).map(
    ([bookId, quantity]) => ({
      bookId,
      quantity,
    }),
  );

  const bookIds = normalizedItems.map((item) => item.bookId);

  const books = await Book.find({
    _id: {
      $in: bookIds,
    },
  });

  if (books.length !== bookIds.length) {
    throw new Error("Có sách không tồn tại trong hệ thống");
  }

  const bookMap = new Map(books.map((book) => [String(book._id), book]));

  const detailsData = [];
  let totalAmount = 0;

  for (const item of normalizedItems) {
    const book = bookMap.get(String(item.bookId));

    const available = Number(book.available ?? book.quantity ?? 0);

    if (item.quantity > available) {
      throw new Error(`"${book.title}" chỉ còn ${available} quyển`);
    }

    const unitPrice = Number(book.price) || 0;

    const subtotal = unitPrice * item.quantity;

    totalAmount += subtotal;

    detailsData.push({
      book: book._id,
      quantity: item.quantity,
      unitPrice,
      subtotal,
    });
  }

  const borrowCode = await generateBorrowCode();

  let createdBorrow = null;
  const decreasedItems = [];

  try {
    /*
     * Tạo thông tin chung của phiếu.
     */
    createdBorrow = await Borrow.create({
      borrowCode,
      reader: readerId,
      employee: employeeId,
      borrowDate,
      dueDate,
      totalAmount,
      note: String(data.note || "").trim(),
      status: "borrowing",
    });

    /*
     * Tạo chi tiết sách của phiếu.
     */
    await BorrowDetail.insertMany(
      detailsData.map((detail) => ({
        borrow: createdBorrow._id,
        book: detail.book,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        subtotal: detail.subtotal,
      })),
    );

    /*
     * Trừ số lượng sách khả dụng.
     */
    for (const detail of detailsData) {
      const updateResult = await Book.updateOne(
        {
          _id: detail.book,
          available: {
            $gte: detail.quantity,
          },
        },
        {
          $inc: {
            available: -detail.quantity,
          },
        },
      );

      if (updateResult.modifiedCount !== 1) {
        throw new Error("Số lượng sách đã thay đổi, vui lòng tải lại dữ liệu");
      }

      decreasedItems.push({
        book: detail.book,
        quantity: detail.quantity,
      });
    }

    return await getBorrowById(createdBorrow._id);
  } catch (error) {
    /*
     * Hoàn lại số lượng đã trừ khi có lỗi.
     */
    for (const item of decreasedItems) {
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

    if (createdBorrow?._id) {
      await BorrowDetail.deleteMany({
        borrow: createdBorrow._id,
      });

      await Borrow.deleteOne({
        _id: createdBorrow._id,
      });
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
  const borrow = await Borrow.findById(id)
    .populate("reader", "readerCode firstName lastName phone address status")
    .populate("employee", "employeeCode fullName firstName lastName");

  if (!borrow) {
    throw new Error("Không tìm thấy phiếu mượn");
  }

  const details = await BorrowDetail.find({
    borrow: borrow._id,
  })
    .populate({
      path: "book",
      select: "bookCode title author category image price publisher",
      populate: {
        path: "publisher",
        select: "publisherName name",
      },
    })
    .sort({
      createdAt: 1,
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
