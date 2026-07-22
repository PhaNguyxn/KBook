const Book = require("../models/Book");

const getAllBooks = async (query) => {
  let { page = 1, limit = 10, keyword, publisher, status } = query;

  page = Number(page);
  limit = Number(limit);

  const filter = {};

  // Search
  if (keyword) {
    filter.$or = [
      {
        title: {
          $regex: keyword,
          $options: "i",
        },
      },
      {
        author: {
          $regex: keyword,
          $options: "i",
        },
      },
    ];
  }

  // Filter publisher
  if (publisher) {
    filter.publisher = publisher;
  }

  // Filter trạng thái
  if (status !== undefined) {
    filter.status = status === "true";
  }

  const total = await Book.countDocuments(filter);

  const books = await Book.find(filter)
    .populate("publisher")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({
      createdAt: -1,
    });

  return {
    books,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const createBook = async (data, file) => {
  const {
    title,
    author,
    publisher,
    publishYear,
    isbn,
    quantity,
    available,
    description,
  } = data;

  const existed = await Book.findOne({ isbn });

  if (existed) {
    throw new Error("ISBN đã tồn tại");
  }

  const image = file
    ? `/uploads/${file.filename}`
    : "/uploads/default-book.jpg";

  const book = await Book.create({
    title,
    author,
    publisher,
    publishYear,
    isbn,
    quantity,
    available,
    description,
    image,
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

const updateBook = async (id, data, file) => {
  const book = await Book.findById(id);

  if (!book) {
    throw new Error("Không tìm thấy sách");
  }

  Object.assign(book, data);

  if (file) {
    book.image = `/uploads/${file.filename}`;
  }

  await book.save();

  return await Book.findById(id).populate("publisher");
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
