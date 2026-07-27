const BookService = require("../services/BookService");

function buildBookPayload(req) {
  const payload = {
    ...req.body,
  };

  if (req.file) {
    payload.image = `/uploads/books/${req.file.filename}`;
  }

  if (
    payload.publishYear === undefined &&
    payload.publicationYear !== undefined
  ) {
    payload.publishYear = payload.publicationYear;
  }

  delete payload.publicationYear;
  delete payload.isbn;

  if (
    payload.publishYear !== undefined &&
    String(payload.publishYear).trim() === ""
  ) {
    delete payload.publishYear;
  }

  if (payload.price !== undefined && String(payload.price).trim() === "") {
    delete payload.price;
  }

  if (
    payload.quantity !== undefined &&
    String(payload.quantity).trim() === ""
  ) {
    delete payload.quantity;
  }

  if (payload.title !== undefined) {
    payload.title = String(payload.title).trim();
  }

  if (payload.author !== undefined) {
    payload.author = String(payload.author).trim();
  }

  if (payload.category !== undefined) {
    payload.category = String(payload.category).trim();
  }

  if (payload.publisherName !== undefined) {
    payload.publisherName = String(payload.publisherName).trim();
  }

  if (payload.description !== undefined) {
    payload.description = String(payload.description).trim();
  }

  if (payload.image !== undefined) {
    payload.image = String(payload.image).trim();
  }

  return payload;
}

async function getAllBooks(req, res) {
  try {
    const result = await BookService.getAllBooks(req.query);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sách thành công",
      data: result,
    });
  } catch (error) {
    console.error("Get books error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Không thể lấy danh sách sách",
    });
  }
}

async function getBookById(req, res) {
  try {
    const book = await BookService.getBookById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết sách thành công",
      data: book,
    });
  } catch (error) {
    console.error("Get book detail error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Không tìm thấy sách",
    });
  }
}

async function createBook(req, res) {
  try {
    const payload = buildBookPayload(req);

    const book = await BookService.createBook(payload);

    return res.status(201).json({
      success: true,
      message: "Thêm sách thành công",
      data: book,
    });
  } catch (error) {
    console.error("Create book error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Không thể thêm sách",
    });
  }
}

async function updateBook(req, res) {
  try {
    const payload = buildBookPayload(req);

    const book = await BookService.updateBook(req.params.id, payload);

    return res.status(200).json({
      success: true,
      message: "Cập nhật sách thành công",
      data: book,
    });
  } catch (error) {
    console.error("Update book error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Không thể cập nhật sách",
    });
  }
}

async function deleteBook(req, res) {
  try {
    const book = await BookService.deleteBook(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Xóa sách thành công",
      data: book,
    });
  } catch (error) {
    console.error("Delete book error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Không thể xóa sách",
    });
  }
}

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
