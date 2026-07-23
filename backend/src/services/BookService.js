const mongoose = require("mongoose");
const Book = require("../models/Book");

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateObjectId(id, message) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(message);
  }
}

function normalizeNumber(value, defaultValue = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : defaultValue;
}

/**
 * GET /api/books
 */
async function getAllBooks(query = {}) {
  let {
    page = 1,
    limit = 10,
    keyword = "",
    category = "",
    publisher = "",
    sort = "latest",
  } = query;

  page = Math.max(Number(page) || 1, 1);

  limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  keyword = String(keyword || "").trim();
  category = String(category || "").trim();
  publisher = String(publisher || "").trim();

  const filter = {};

  // Tìm theo mã sách, tên sách, tác giả hoặc ISBN
  if (keyword) {
    const safeKeyword = escapeRegex(keyword);

    filter.$or = [
      {
        bookCode: {
          $regex: safeKeyword,
          $options: "i",
        },
      },
      {
        title: {
          $regex: safeKeyword,
          $options: "i",
        },
      },
      {
        author: {
          $regex: safeKeyword,
          $options: "i",
        },
      },
      {
        isbn: {
          $regex: safeKeyword,
          $options: "i",
        },
      },
    ];
  }

  // Tìm kiếm theo thể loại
  if (category) {
    filter.category = {
      $regex: escapeRegex(category),
      $options: "i",
    };
  }

  // Lọc theo nhà xuất bản
  if (publisher) {
    validateObjectId(publisher, "Nhà xuất bản không hợp lệ");

    filter.publisher = publisher;
  }

  const sortOptions = {
    latest: {
      createdAt: -1,
    },
    oldest: {
      createdAt: 1,
    },
    "title-asc": {
      title: 1,
    },
    "title-desc": {
      title: -1,
    },
    "available-asc": {
      available: 1,
    },
    "available-desc": {
      available: -1,
    },
  };

  const sortOption = sortOptions[sort] || sortOptions.latest;

  const total = await Book.countDocuments(filter);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;

  const books = await Book.find(filter)
    .populate("publisher", "publisherCode publisherName email phone")
    .sort(sortOption)
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .lean();

  return {
    books,

    pagination: {
      total,
      page: currentPage,
      limit,
      totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
    },
  };
}

/**
 * GET /api/books/:id
 */
async function getBookById(id) {
  validateObjectId(id, "Mã sách không hợp lệ");

  const book = await Book.findById(id)
    .populate("publisher", "publisherCode publisherName email phone address")
    .lean();

  if (!book) {
    throw new Error("Không tìm thấy sách");
  }

  return book;
}

/**
 * POST /api/books
 */
async function createBook(data = {}) {
  const bookCode = String(data.bookCode || "")
    .trim()
    .toUpperCase();

  const title = String(data.title || "").trim();

  const author = String(data.author || "").trim();

  const category = String(data.category || "").trim();

  const publisher = String(data.publisher || "").trim();

  if (!bookCode) {
    throw new Error("Vui lòng nhập mã sách");
  }

  if (!title) {
    throw new Error("Vui lòng nhập tên sách");
  }

  if (!author) {
    throw new Error("Vui lòng nhập tác giả");
  }

  if (!category) {
    throw new Error("Vui lòng nhập thể loại");
  }

  validateObjectId(publisher, "Nhà xuất bản không hợp lệ");

  const existedBook = await Book.findOne({
    bookCode,
  });

  if (existedBook) {
    throw new Error("Mã sách đã tồn tại");
  }

  const quantity = normalizeNumber(data.quantity, 1);

  if (quantity < 0) {
    throw new Error("Số lượng sách không được nhỏ hơn 0");
  }

  const publicationYear = data.publicationYear
    ? normalizeNumber(data.publicationYear)
    : undefined;

  const book = await Book.create({
    bookCode,
    title,
    author,
    category,
    publisher,

    isbn: String(data.isbn || "").trim(),

    publicationYear,

    description: String(data.description || "").trim(),

    image: String(data.image || "").trim(),

    quantity,
    available: quantity,
    status: true,
  });

  return Book.findById(book._id)
    .populate("publisher", "publisherCode publisherName")
    .lean();
}

/**
 * PUT /api/books/:id
 */
async function updateBook(id, data = {}) {
  validateObjectId(id, "Mã sách không hợp lệ");

  const book = await Book.findById(id);

  if (!book) {
    throw new Error("Không tìm thấy sách");
  }

  if (data.bookCode !== undefined) {
    const bookCode = String(data.bookCode).trim().toUpperCase();

    if (!bookCode) {
      throw new Error("Mã sách không được để trống");
    }

    const duplicatedBook = await Book.findOne({
      _id: {
        $ne: id,
      },
      bookCode,
    });

    if (duplicatedBook) {
      throw new Error("Mã sách đã tồn tại");
    }

    book.bookCode = bookCode;
  }

  if (data.title !== undefined) {
    const title = String(data.title).trim();

    if (!title) {
      throw new Error("Tên sách không được để trống");
    }

    book.title = title;
  }

  if (data.author !== undefined) {
    const author = String(data.author).trim();

    if (!author) {
      throw new Error("Tác giả không được để trống");
    }

    book.author = author;
  }

  if (data.category !== undefined) {
    const category = String(data.category).trim();

    if (!category) {
      throw new Error("Thể loại không được để trống");
    }

    book.category = category;
  }

  if (data.publisher !== undefined) {
    validateObjectId(data.publisher, "Nhà xuất bản không hợp lệ");

    book.publisher = data.publisher;
  }

  if (data.isbn !== undefined) {
    book.isbn = String(data.isbn || "").trim();
  }

  if (data.publicationYear !== undefined) {
    book.publicationYear = data.publicationYear
      ? normalizeNumber(data.publicationYear)
      : undefined;
  }

  if (data.description !== undefined) {
    book.description = String(data.description || "").trim();
  }

  if (data.image !== undefined && String(data.image).trim()) {
    book.image = String(data.image).trim();
  }

  if (data.quantity !== undefined) {
    const newQuantity = normalizeNumber(data.quantity);

    if (newQuantity < 0) {
      throw new Error("Số lượng sách không được nhỏ hơn 0");
    }

    const oldQuantity = Number(book.quantity || 0);

    const oldAvailable = Number(book.available || 0);

    const borrowedQuantity = Math.max(oldQuantity - oldAvailable, 0);

    if (newQuantity < borrowedQuantity) {
      throw new Error(
        `Hiện có ${borrowedQuantity} sách đang được mượn. Số lượng mới không được nhỏ hơn ${borrowedQuantity}`,
      );
    }

    book.quantity = newQuantity;

    book.available = newQuantity - borrowedQuantity;
  }

  await book.save();

  return Book.findById(book._id)
    .populate("publisher", "publisherCode publisherName")
    .lean();
}

/**
 * DELETE /api/books/:id
 *
 * Xóa vĩnh viễn thay vì khóa sách.
 */
async function deleteBook(id) {
  validateObjectId(id, "Mã sách không hợp lệ");

  const book = await Book.findByIdAndDelete(id);

  if (!book) {
    throw new Error("Không tìm thấy sách");
  }

  return book;
}

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
