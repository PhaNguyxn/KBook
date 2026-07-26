const mongoose = require("mongoose");

const Book = require("../models/Book");
const Publisher = require("../models/Publisher");
const generateCode = require("../utils/generateCode");
const PublisherService = require("./PublisherService");


function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateObjectId(id, message) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(message);
  }
}

function validatePrice(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error("Vui lòng nhập đơn giá");
  }

  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Đơn giá không hợp lệ");
  }

  return price;
}

function validatePublishYear(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error("Vui lòng nhập năm xuất bản");
  }

  const publishYear = Number(value);
  const currentYear = new Date().getFullYear();

  if (
    !Number.isInteger(publishYear) ||
    publishYear < 1000 ||
    publishYear > currentYear
  ) {
    throw new Error(`Năm xuất bản phải từ 1000 đến ${currentYear}`);
  }

  return publishYear;
}

function validateQuantity(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error("Vui lòng nhập số lượng sách");
  }

  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Số lượng sách phải là số nguyên không âm");
  }

  return quantity;
}


async function resolvePublisher(publisherValue) {
  const value = String(publisherValue || "").trim();

  if (!value) {
    throw new Error("Vui lòng nhập tên nhà xuất bản");
  }

  if (mongoose.isValidObjectId(value)) {
    const publisher = await Publisher.findById(value);

    if (!publisher) {
      throw new Error("Nhà xuất bản không tồn tại");
    }

    return publisher;
  }

  return PublisherService.findOrCreatePublisherByName(value);
}


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
        category: {
          $regex: safeKeyword,
          $options: "i",
        },
      },
    ];
  }


  if (category) {
    filter.category = {
      $regex: escapeRegex(category),
      $options: "i",
    };
  }

  if (publisher) {
    if (mongoose.isValidObjectId(publisher)) {
      filter.publisher = publisher;
    } else {
      const publisherIds = await Publisher.find({
        publisherName: {
          $regex: escapeRegex(publisher),
          $options: "i",
        },
      }).distinct("_id");

      filter.publisher = {
        $in: publisherIds,
      };
    }
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

    "price-asc": {
      price: 1,
    },

    "price-desc": {
      price: -1,
    },
  };

  const sortOption = sortOptions[sort] || sortOptions.latest;

  const total = await Book.countDocuments(filter);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;

  const books = await Book.find(filter)
    .populate("publisher", "publisherCode publisherName email phone address")
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

      hasPreviousPage: totalPages > 0 && currentPage > 1,

      hasNextPage: totalPages > 0 && currentPage < totalPages,
    },
  };
}

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


async function createBook(data = {}) {
  const title = String(data.title || "").trim();

  const author = String(data.author || "").trim();

  const category = String(data.category || "").trim();

  const publisherValue = data.publisherName || data.publisher || "";

  const price = validatePrice(data.price);

  const publishYear = validatePublishYear(data.publishYear);

  const quantity = validateQuantity(data.quantity);

  if (!title) {
    throw new Error("Vui lòng nhập tên sách");
  }

  if (!author) {
    throw new Error("Vui lòng nhập tác giả");
  }

  if (!category) {
    throw new Error("Vui lòng nhập thể loại");
  }

  const publisher = await resolvePublisher(publisherValue);

  const bookCode = await generateCode("book", "BOOK", 3);

  const book = await Book.create({
    bookCode,
    title,
    author,
    category,
    price,
    publishYear,

    publisher: publisher._id,

    quantity,
    available: quantity,

    image: String(data.image || "").trim(),

    description: String(data.description || "").trim(),
  });

  return Book.findById(book._id)
    .populate("publisher", "publisherCode publisherName email phone address")
    .lean();
}


async function updateBook(id, data = {}) {
  validateObjectId(id, "Mã sách không hợp lệ");

  const book = await Book.findById(id);

  if (!book) {
    throw new Error("Không tìm thấy sách");
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

  if (data.publisherName !== undefined || data.publisher !== undefined) {
    const publisherValue = data.publisherName ?? data.publisher ?? "";

    const publisher = await resolvePublisher(publisherValue);

    book.publisher = publisher._id;
  }

  if (data.price !== undefined) {
    book.price = validatePrice(data.price);
  }

 
  if (data.publishYear !== undefined || data.publicationYear !== undefined) {
    const publishYearValue = data.publishYear ?? data.publicationYear;

    book.publishYear = validatePublishYear(publishYearValue);
  }

  if (data.description !== undefined) {
    book.description = String(data.description || "").trim();
  }

  if (data.image !== undefined) {
    book.image = String(data.image || "").trim();
  }

  if (data.quantity !== undefined) {
    const newQuantity = validateQuantity(data.quantity);

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
    .populate("publisher", "publisherCode publisherName email phone address")
    .lean();
}

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
