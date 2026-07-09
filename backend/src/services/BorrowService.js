const Borrow = require("../models/Borrow");
const BorrowDetail = require("../models/BorrowDetail");
const Book = require("../models/Book");
const Reader = require("../models/Reader");

const createBorrow = async (data, employeeId) => {
  const { reader, dueDate, books } = data;

  const readerExist = await Reader.findById(reader);

  if (!readerExist) {
    throw new Error("Không tìm thấy độc giả");
  }

  if (!books || books.length === 0) {
    throw new Error("Danh sách sách không được để trống");
  }

  const borrow = await Borrow.create({
    reader,
    employee: employeeId,
    dueDate,
  });

  for (const item of books) {
    const book = await Book.findById(item.book);

    if (!book) {
      throw new Error("Không tìm thấy sách");
    }

    if (book.available < item.quantity) {
      throw new Error(`${book.title} không đủ số lượng`);
    }

    book.available -= item.quantity;

    await book.save();

    await BorrowDetail.create({
      borrow: borrow._id,
      book: book._id,
      quantity: item.quantity,
    });
  }

  return borrow;
};

const getAllBorrows = async () => {
  return await Borrow.find()
    .populate("reader")
    .populate("employee")
    .sort({ createdAt: -1 });
};

const getBorrowById = async (id) => {
  const borrow = await Borrow.findById(id)
    .populate("reader")
    .populate("employee");

  if (!borrow) {
    throw new Error("Không tìm thấy phiếu mượn");
  }

  const details = await BorrowDetail.find({
    borrow: id,
  }).populate("book");

  return {
    borrow,
    details,
  };
};

const returnBorrow = async (id) => {
  const borrow = await Borrow.findById(id);

  if (!borrow) {
    throw new Error("Không tìm thấy phiếu mượn");
  }

  if (borrow.status === "returned") {
    throw new Error("Phiếu đã trả");
  }

  const details = await BorrowDetail.find({
    borrow: borrow._id,
  });

  for (const item of details) {
    const book = await Book.findById(item.book);

    book.available += item.quantity;

    await book.save();
  }

  borrow.status = "returned";
  borrow.returnDate = new Date();

  await borrow.save();

  return borrow;
};

module.exports = {
  createBorrow,
  getAllBorrows,
  getBorrowById,
  returnBorrow,
};
