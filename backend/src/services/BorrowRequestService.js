const mongoose = require("mongoose");

const BorrowRequest = require("../models/BorrowRequest");
const Reader = require("../models/Reader");
const Book = require("../models/Book");
const BorrowService = require("./BorrowService");

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateObjectId(id, message) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(message);
  }
}

function populateBorrowRequest(query, options = {}) {
  const { includeReader = true, includeBorrow = true } = options;

  if (includeReader) {
    query.populate(
      "reader",
      "readerCode firstName lastName fullName phone email address",
    );
  }

  query.populate(
    "items.book",
    "bookCode title author category available quantity image publishYear",
  );

  query.populate("processedBy", "employeeCode fullName username role");

  if (includeBorrow) {
    query.populate("borrow");
  }

  return query;
}

/* =========================================
   TỰ SINH MÃ YÊU CẦU
========================================= */

async function generateRequestCode() {
  const date = new Date();

  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  const count = await BorrowRequest.countDocuments({
    createdAt: {
      $gte: startOfDay,
    },
  });

  return `REQ${datePart}${String(count + 1).padStart(4, "0")}`;
}

/* =========================================
   DANH SÁCH CHO NHÂN VIÊN
========================================= */

async function getAllBorrowRequests(query = {}) {
  let { page = 1, limit = 10, keyword = "", status = "" } = query;

  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const filter = {};

  if (
    ["pending", "approved", "rejected", "cancelled"].includes(String(status))
  ) {
    filter.status = String(status);
  }

  keyword = String(keyword || "").trim();

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
          firstName: {
            $regex: safeKeyword,
            $options: "i",
          },
        },
        {
          lastName: {
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
        {
          email: {
            $regex: safeKeyword,
            $options: "i",
          },
        },
      ],
    })
      .select("_id")
      .lean();

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

  let requestQuery = BorrowRequest.find(filter)
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .skip((currentPage - 1) * limit)
    .limit(limit);

  requestQuery = populateBorrowRequest(requestQuery);

  const requests = await requestQuery.lean();

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

/* =========================================
   CHI TIẾT CHO NHÂN VIÊN
========================================= */

async function getBorrowRequestById(id) {
  validateObjectId(id, "Mã yêu cầu không hợp lệ");

  let requestQuery = BorrowRequest.findById(id);

  requestQuery = populateBorrowRequest(requestQuery);

  const request = await requestQuery.lean();

  if (!request) {
    throw new Error("Không tìm thấy yêu cầu mượn sách");
  }

  return request;
}

/* =========================================
   DANH SÁCH CỦA ĐỘC GIẢ ĐANG ĐĂNG NHẬP
========================================= */

async function getMyBorrowRequests(readerId, query = {}) {
  validateObjectId(readerId, "Mã độc giả không hợp lệ");

  let { page = 1, limit = 8, keyword = "", status = "" } = query;

  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 8, 1), 50);

  const filter = {
    reader: readerId,
  };

  if (
    ["pending", "approved", "rejected", "cancelled"].includes(String(status))
  ) {
    filter.status = String(status);
  }

  keyword = String(keyword || "").trim();

  if (keyword) {
    const safeKeyword = escapeRegex(keyword);

    filter.$or = [
      {
        requestCode: {
          $regex: safeKeyword,
          $options: "i",
        },
      },
      {
        note: {
          $regex: safeKeyword,
          $options: "i",
        },
      },
    ];
  }

  const total = await BorrowRequest.countDocuments(filter);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;

  let requestQuery = BorrowRequest.find(filter)
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .skip((currentPage - 1) * limit)
    .limit(limit);

  requestQuery = populateBorrowRequest(requestQuery, {
    includeReader: false,
    includeBorrow: true,
  });

  const requests = await requestQuery.lean();

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

/* =========================================
   CHI TIẾT YÊU CẦU CỦA ĐỘC GIẢ
========================================= */

async function getMyBorrowRequestById(readerId, requestId) {
  validateObjectId(readerId, "Mã độc giả không hợp lệ");
  validateObjectId(requestId, "Mã yêu cầu không hợp lệ");

  let requestQuery = BorrowRequest.findOne({
    _id: requestId,
    reader: readerId,
  });

  requestQuery = populateBorrowRequest(requestQuery, {
    includeReader: false,
    includeBorrow: true,
  });

  const request = await requestQuery.lean();

  if (!request) {
    throw new Error(
      "Không tìm thấy yêu cầu mượn hoặc bạn không có quyền xem yêu cầu này",
    );
  }

  return request;
}

/* =========================================
   TẠO YÊU CẦU MƯỢN
========================================= */

async function createBorrowRequest(data = {}) {
  const { readerId, items = [], expectedBorrowDate, dueDate, note } = data;

  validateObjectId(readerId, "Độc giả không hợp lệ");

  const reader = await Reader.findById(readerId);

  if (!reader) {
    throw new Error("Không tìm thấy độc giả");
  }

  if (reader.status === false) {
    throw new Error("Tài khoản độc giả đã bị khóa");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Vui lòng chọn ít nhất một sách");
  }

  if (!dueDate) {
    throw new Error("Vui lòng chọn hạn trả sách");
  }

  const normalizedBorrowDate = expectedBorrowDate
    ? new Date(expectedBorrowDate)
    : new Date();

  const normalizedDueDate = new Date(dueDate);

  if (Number.isNaN(normalizedBorrowDate.getTime())) {
    throw new Error("Ngày mượn dự kiến không hợp lệ");
  }

  if (Number.isNaN(normalizedDueDate.getTime())) {
    throw new Error("Ngày trả dự kiến không hợp lệ");
  }

  if (normalizedDueDate <= normalizedBorrowDate) {
    throw new Error("Ngày trả phải sau ngày mượn dự kiến");
  }

  const normalizedItems = [];
  const selectedBookIds = new Set();

  for (const item of items) {
    const bookId = item.bookId || item.book?._id || item.book;

    validateObjectId(bookId, "Thông tin sách không hợp lệ");

    if (selectedBookIds.has(String(bookId))) {
      throw new Error("Một sách không được xuất hiện nhiều lần");
    }

    selectedBookIds.add(String(bookId));

    const quantity = Math.max(Number(item.quantity) || 1, 1);

    if (!Number.isInteger(quantity)) {
      throw new Error("Số lượng sách phải là số nguyên");
    }

    const book = await Book.findById(bookId);

    if (!book) {
      throw new Error("Có sách không tồn tại trong hệ thống");
    }

    if (book.status === false) {
      throw new Error(`Sách "${book.title}" hiện không được phục vụ`);
    }

    if (Number(book.available) < quantity) {
      throw new Error(`Sách "${book.title}" không đủ số lượng`);
    }

    normalizedItems.push({
      book: book._id,
      quantity,
    });
  }

  /*
   * Ngăn độc giả gửi nhiều yêu cầu đang chờ
   * chứa cùng một đầu sách.
   */
  const pendingRequest = await BorrowRequest.findOne({
    reader: readerId,
    status: "pending",
    "items.book": {
      $in: normalizedItems.map((item) => item.book),
    },
  }).lean();

  if (pendingRequest) {
    throw new Error(
      `Bạn đã có yêu cầu ${pendingRequest.requestCode} đang chờ xử lý với một trong các sách đã chọn`,
    );
  }

  let createdRequest = null;

  /*
   * Thử lại khi hai request được tạo đồng thời
   * và trùng requestCode.
   */
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const requestCode = await generateRequestCode();

      createdRequest = await BorrowRequest.create({
        requestCode,
        reader: readerId,
        items: normalizedItems,
        expectedBorrowDate: normalizedBorrowDate,
        dueDate: normalizedDueDate,
        note: String(note || "").trim(),
        status: "pending",
      });

      break;
    } catch (error) {
      if (
        error?.code !== 11000 ||
        !(error?.keyPattern?.requestCode || error?.keyValue?.requestCode)
      ) {
        throw error;
      }
    }
  }

  if (!createdRequest) {
    throw new Error("Không thể tạo mã yêu cầu, vui lòng thử lại");
  }

  return getMyBorrowRequestById(readerId, createdRequest._id);
}

/* =========================================
   HỦY YÊU CẦU CỦA ĐỘC GIẢ
========================================= */

async function cancelMyBorrowRequest(readerId, requestId) {
  validateObjectId(readerId, "Mã độc giả không hợp lệ");
  validateObjectId(requestId, "Mã yêu cầu không hợp lệ");

  const request = await BorrowRequest.findOne({
    _id: requestId,
    reader: readerId,
  });

  if (!request) {
    throw new Error(
      "Không tìm thấy yêu cầu mượn hoặc bạn không có quyền hủy yêu cầu này",
    );
  }

  if (request.status !== "pending") {
    throw new Error("Chỉ có thể hủy yêu cầu đang chờ duyệt");
  }

  request.status = "cancelled";

  await request.save();

  return getMyBorrowRequestById(readerId, request._id);
}

/* =========================================
   DUYỆT YÊU CẦU
========================================= */

async function approveBorrowRequest(id, employeeId) {
  validateObjectId(id, "Mã yêu cầu không hợp lệ");
  validateObjectId(employeeId, "Mã nhân viên không hợp lệ");

  const request = await BorrowRequest.findById(id)
    .populate("reader")
    .populate("items.book");

  if (!request) {
    throw new Error("Không tìm thấy yêu cầu mượn sách");
  }

  if (request.status !== "pending") {
    throw new Error("Chỉ có thể duyệt yêu cầu đang chờ");
  }

  if (!request.reader) {
    throw new Error("Độc giả của yêu cầu không còn tồn tại");
  }

  for (const item of request.items) {
    if (!item.book) {
      throw new Error("Có sách trong yêu cầu không còn tồn tại");
    }

    if (Number(item.book.available) < Number(item.quantity)) {
      throw new Error(`Sách "${item.book.title}" không còn đủ số lượng`);
    }
  }

  const borrow = await BorrowService.createBorrow(
    {
      readerId: request.reader._id.toString(),
      borrowDate: request.expectedBorrowDate || new Date(),
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
  request.borrow = borrow?._id || borrow?.borrow?._id || null;

  await request.save();

  return getBorrowRequestById(request._id);
}

/* =========================================
   TỪ CHỐI YÊU CẦU
========================================= */

async function rejectBorrowRequest(id, employeeId, reason) {
  validateObjectId(id, "Mã yêu cầu không hợp lệ");
  validateObjectId(employeeId, "Mã nhân viên không hợp lệ");

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

  return getBorrowRequestById(request._id);
}

module.exports = {
  getAllBorrowRequests,
  getBorrowRequestById,

  getMyBorrowRequests,
  getMyBorrowRequestById,
  cancelMyBorrowRequest,

  createBorrowRequest,
  approveBorrowRequest,
  rejectBorrowRequest,
};
