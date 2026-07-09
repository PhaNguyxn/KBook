const BookService = require("../services/BookService");

const getAllBooks = async (req, res) => {
  try {
    const books = await BookService.getAllBooks(req.query);

    res.json({
      success: true,

      data: books,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

const createBook = async (req, res) => {
  try {
    const book = await BookService.createBook(req.body, req.file);

    res.status(201).json({
      success: true,
      message: "Thêm sách thành công",
      data: book,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const getBookById = async (req, res) => {
  try {
    const book = await BookService.getBookById(req.params.id);

    res.json({
      success: true,

      data: book,
    });
  } catch (err) {
    res.status(404).json({
      message: err.message,
    });
  }
};

const updateBook = async (req, res) => {
  try {
    const book = await BookService.updateBook(
      req.params.id,

      req.body,
    );

    res.json({
      success: true,

      data: book,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

const deleteBook = async (req, res) => {
  try {
    await BookService.deleteBook(req.params.id);

    res.json({
      success: true,

      message: "Xóa thành công",
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};


module.exports = {
  getAllBooks,

  getBookById,

  createBook,

  updateBook,

  deleteBook,

};
