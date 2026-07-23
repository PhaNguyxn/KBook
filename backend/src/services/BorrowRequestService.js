const mongoose = require("mongoose");

const BorrowRequest = require("../models/BorrowRequest");

const Reader = require("../models/Reader");
const Book = require("../models/Book");

/*
 * Đổi đường dẫn hoặc tên hàm này cho đúng
 * với BorrowService hiện tại của dự án.
 */
const BorrowService = require("./BorrowService");

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function generateRequestCode() {
  const date = new Date();

  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  const count = await BorrowRequest.countDocuments({
    createdAt: {
      $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    },
  });

  return `REQ${datePart}${String(count + 1).padStart(4, "0")}`;
}

// Lấy danh sách có phân trang
async function getAllBorrowRequests(query = {}) {
  let { page = 1, limit = 10, keyword = "", status = "" } = query;

  page = Math.max(Number(page) || 1, 1);

  limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const filter = {};

  if (["pending", "approved", "rejected", "cancelled"].includes(status)) {
    filter.status = status;
  }

  keyword = String(keyword).trim();

  if (keyword) {
    const safeKeyword = escapeRegex(keyword);

    const readers = await Reader.find({
      $or: [
        {
          readerCode: {
            $regex: safeKeyword,
            $options: "i",
          },
        },
        {
          fullName: {
            $regex: safeKeyword,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: safeKeyword,
            $options: "i",
          },
        },
      ],
    }).select("_id");

    filter.$or = [
      {
        requestCode: {
          $regex: safeKeyword,
          $options: "i",
        },
      },
      {
        reader: {
          $in: readers.map((reader) => reader._id),
        },
      },
    ];
  }

  const total = await BorrowRequest.countDocuments(filter);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;

  const requests = await BorrowRequest.find(filter)
    .populate("reader", "readerCode fullName phone email")
    .populate("items.book", "bookCode title author available quantity image")
    .populate("processedBy", "fullName username")
    .sort({
      createdAt: -1,
    })
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .lean();

  return {
    requests,

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

// Lấy chi tiết
async function getBorrowRequestById(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã yêu cầu không hợp lệ");
  }

  const request = await BorrowRequest.findById(id)
    .populate("reader", "readerCode fullName phone email address")
    .populate("items.book", "bookCode title author available quantity image")
    .populate("processedBy", "fullName username")
    .populate("borrow")
    .lean();

  if (!request) {
    throw new Error("Không tìm thấy yêu cầu mượn sách");
  }

  return request;
}

// Tạo yêu cầu
async function createBorrowRequest(data = {}) {
  const { readerId, items = [], expectedBorrowDate, dueDate, note } = data;

  if (!mongoose.isValidObjectId(readerId)) {
    throw new Error("Độc giả không hợp lệ");
  }

  const reader = await Reader.findById(readerId);

  if (!reader) {
    throw new Error("Không tìm thấy độc giả");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Vui lòng chọn ít nhất một sách");
  }

  if (!dueDate) {
    throw new Error("Vui lòng chọn hạn trả sách");
  }

  const normalizedItems = [];

  for (const item of items) {
    if (!mongoose.isValidObjectId(item.bookId)) {
      throw new Error("Thông tin sách không hợp lệ");
    }

    const quantity = Math.max(Number(item.quantity) || 1, 1);

    const book = await Book.findById(item.bookId);

    if (!book) {
      throw new Error("Có sách không tồn tại trong hệ thống");
    }

    if (Number(book.available) < quantity) {
      throw new Error(`Sách "${book.title}" không đủ số lượng`);
    }

    normalizedItems.push({
      book: book._id,
      quantity,
    });
  }

  const requestCode = await generateRequestCode();

  return BorrowRequest.create({
    requestCode,
    reader: readerId,
    items: normalizedItems,

    expectedBorrowDate: expectedBorrowDate || new Date(),

    dueDate,
    note: String(note || "").trim(),
    status: "pending",
  });
}

// Duyệt yêu cầu
async function approveBorrowRequest(id, employeeId) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã yêu cầu không hợp lệ");
  }

  const request = await BorrowRequest.findById(id)
    .populate("reader")
    .populate("items.book");

  if (!request) {
    throw new Error("Không tìm thấy yêu cầu mượn sách");
  }

  if (request.status !== "pending") {
    throw new Error("Chỉ có thể duyệt yêu cầu đang chờ");
  }

  for (const item of request.items) {
    if (Number(item.book.available) < Number(item.quantity)) {
      throw new Error(`Sách "${item.book.title}" không còn đủ số lượng`);
    }
  }

  /*
   * Điều chỉnh payload này theo hàm createBorrow
   * đang có trong BorrowService của dự án.
   */
  const borrow = await BorrowService.createBorrow(
    {
      readerId: request.reader._id.toString(),

      dueDate: request.dueDate,

      items: request.items.map((item) => ({
        bookId: item.book._id.toString(),

        quantity: item.quantity,
      })),
    },

    employeeId,
  );

  request.status = "approved";
  request.processedBy = employeeId;
  request.processedAt = new Date();
  request.borrow = borrow?._id || borrow?.borrow?._id;

  await request.save();

  return request;
}

// Từ chối yêu cầu
async function rejectBorrowRequest(id, employeeId, reason) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã yêu cầu không hợp lệ");
  }

  const request = await BorrowRequest.findById(id);

  if (!request) {
    throw new Error("Không tìm thấy yêu cầu mượn sách");
  }

  if (request.status !== "pending") {
    throw new Error("Chỉ có thể từ chối yêu cầu đang chờ");
  }

  const rejectReason = String(reason || "").trim();

  if (!rejectReason) {
    throw new Error("Vui lòng nhập lý do từ chối");
  }

  request.status = "rejected";
  request.rejectReason = rejectReason;
  request.processedBy = employeeId;
  request.processedAt = new Date();

  await request.save();

  return request;
}

module.exports = {
  getAllBorrowRequests,
  getBorrowRequestById,
  createBorrowRequest,
  approveBorrowRequest,
  rejectBorrowRequest,
};
