const Book = require("../models/Book");

const getAllBooks = async (query) => {
  const filter = {
    status: true,
  };

  if (query.keyword) {
    filter.title = {
      $regex: query.keyword,
      $options: "i",
    };
  }

  return await Book.find(filter).populate("publisher").sort({ createdAt: -1 });
};

const createBook = async (data) => {
  const existed = await Book.findOne({
    isbn: data.isbn,
  });

  if (existed) {
    throw new Error("ISBN đã tồn tại");
  }

  const book = await Book.create({
    ...data,
    available: data.quantity,
  });

  return book;
};

const getBookById = async (id) => {
  const book = await Book.findById(id).populate("publisher");

  if (!book) {
    throw new Error("Không tìm thấy sách");
  }

  return book;
};

const updateBook = async (id, data) => {
  const book = await Book.findById(id);

  if (!book) {
    throw new Error("Không tìm thấy sách");
  }

  Object.assign(book, data);

  await book.save();

  return book;
};

const deleteBook = async (id) => {
  const book = await Book.findById(id);

  if (!book) {
    throw new Error("Không tìm thấy sách");
  }

  book.status = false;

  await book.save();

  return true;
};


module.exports = {
  getAllBooks,
  createBook,
  getBookById,
  updateBook,
  deleteBook,
};
