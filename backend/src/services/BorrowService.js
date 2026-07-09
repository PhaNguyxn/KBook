const Borrow = require("../models/Borrow");
const Book = require("../models/Book");
const Reader = require("../models/Reader");

const createBorrow = async (data, userId) => {
  const { reader, book, dueDate } = data;

  const readerExist = await Reader.findById(reader);

  if (!readerExist) {
    throw new Error("Không tìm thấy độc giả");
  }

  const bookExist = await Book.findById(book);

  if (!bookExist) {
    throw new Error("Không tìm thấy sách");
  }

  if (bookExist.available <= 0) {
    throw new Error("Sách đã hết");
  }

  bookExist.available -= 1;

  await bookExist.save();

  const borrow = await Borrow.create({
    reader,
    employee: userId,
    book,
    dueDate,
  });

  return await Borrow.findById(borrow._id)
    .populate("reader")
    .populate("book")
    .populate("employee");
};

const getAllBorrows = async () => {
  return await Borrow.find()
    .populate("reader")
    .populate("book")
    .populate("employee")
    .sort({
      createdAt: -1,
    });
};

const getBorrowById = async (id) => {
  const borrow = await Borrow.findById(id)
    .populate("reader")
    .populate("book")
    .populate("employee");

  if (!borrow) {
    throw new Error("Không tìm thấy phiếu mượn");
  }

  return borrow;
};

const returnBook = async (id) => {
  const borrow = await Borrow.findById(id);

  if (!borrow) {
    throw new Error("Không tìm thấy phiếu mượn");
  }

  if (borrow.status === "returned") {
    throw new Error("Sách đã được trả");
  }

  borrow.status = "returned";
  borrow.returnDate = new Date();

  await borrow.save();

  const book = await Book.findById(borrow.book);

  book.available += 1;

  await book.save();

  return borrow;
};

module.exports = {
  createBorrow,
  getAllBorrows,
  getBorrowById,
  returnBook,
};