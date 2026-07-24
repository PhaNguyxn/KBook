const mongoose = require("mongoose");

const Publisher = require("../models/Publisher");
const generateCode = require("../utils/generateCode");
const Book = require("../models/Book");
/* ==================================================
   HÀM HỖ TRỢ
================================================== */

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true" || value === "1" || value === 1) {
    return true;
  }

  if (value === "false" || value === "0" || value === 0) {
    return false;
  }

  return value;
}

function normalizePhone(value = "") {
  return String(value).replace(/\s+/g, "").trim();
}

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizePublisherName(value = "") {
  return String(value).trim().toLocaleLowerCase("vi-VN");
}

/**
 * Trả về tên field gây lỗi duplicate key.
 */
function getDuplicateField(error) {
  if (!error || error.code !== 11000) {
    return "";
  }

  if (error.keyPattern) {
    return Object.keys(error.keyPattern)[0] || "";
  }

  if (error.keyValue) {
    return Object.keys(error.keyValue)[0] || "";
  }

  return "";
}

/**
 * Chuyển lỗi duplicate key của MongoDB
 * thành thông báo dễ hiểu.
 */
function throwDuplicateError(error) {
  const duplicateField = getDuplicateField(error);

  switch (duplicateField) {
    case "publisherCode":
      throw new Error("Mã nhà xuất bản đã tồn tại");

    case "publisherName":
      throw new Error("Tên nhà xuất bản đã tồn tại");

    case "email":
      throw new Error("Email nhà xuất bản đã tồn tại");

    case "phone":
      throw new Error("Số điện thoại nhà xuất bản đã tồn tại");

    default:
      throw error;
  }
}

async function generatePublisherCode() {
  const maximumAttempts = 10000;

  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    const publisherCode = await generateCode("publisher", "NXB", 3);

    const codeExisted = await Publisher.exists({
      publisherCode,
    });

    if (!codeExisted) {
      return publisherCode;
    }
  }

  throw new Error("Không thể tạo mã nhà xuất bản tự động");
}


async function checkPublisherDuplicate({
  publisherName = "",
  email = "",
  phone = "",
  excludeId = null,
}) {
  const duplicateConditions = [];

  if (publisherName) {
    duplicateConditions.push({
      publisherName: {
        $regex: `^${escapeRegex(publisherName)}$`,
        $options: "i",
      },
    });
  }

  if (email) {
    duplicateConditions.push({
      email,
    });
  }

  if (phone) {
    duplicateConditions.push({
      phone,
    });
  }

  if (duplicateConditions.length === 0) {
    return null;
  }

  const filter = {
    $or: duplicateConditions,
  };

  if (excludeId) {
    filter._id = {
      $ne: excludeId,
    };
  }

  return Publisher.findOne(filter).lean();
}

function checkDuplicateInformation(
  existedPublisher,
  { publisherName = "", email = "", phone = "" },
) {
  if (!existedPublisher) {
    return;
  }

  const existedName = normalizePublisherName(existedPublisher.publisherName);

  const inputName = normalizePublisherName(publisherName);

  if (inputName && existedName === inputName) {
    if (existedPublisher.status === false) {
      throw new Error("Nhà xuất bản này đã tồn tại nhưng đang bị khóa");
    }

    throw new Error("Tên nhà xuất bản đã tồn tại");
  }

  if (email && existedPublisher.email === email) {
    throw new Error("Email nhà xuất bản đã tồn tại");
  }

  if (phone && existedPublisher.phone === phone) {
    throw new Error("Số điện thoại nhà xuất bản đã tồn tại");
  }
}

/* ==================================================
   LẤY DANH SÁCH NHÀ XUẤT BẢN
================================================== */

const getAllPublishers = async (query = {}) => {
  let {
    page = 1,
    limit = 10,
    keyword = "",
    status = "",
    sort = "latest",
  } = query;

  page = Math.max(Number(page) || 1, 1);

  limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  keyword = String(keyword || "").trim();

  const filter = {};

  /*
   * Tìm kiếm theo:
   * - Mã nhà xuất bản
   * - Tên nhà xuất bản
   * - Email
   * - Số điện thoại
   * - Địa chỉ
   */
  if (keyword) {
    const safeKeyword = escapeRegex(keyword);

    filter.$or = [
      {
        publisherCode: {
          $regex: safeKeyword,
          $options: "i",
        },
      },
      {
        publisherName: {
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
      {
        phone: {
          $regex: safeKeyword,
          $options: "i",
        },
      },
      {
        address: {
          $regex: safeKeyword,
          $options: "i",
        },
      },
    ];
  }

  const normalizedStatus = normalizeBoolean(status);

  if (typeof normalizedStatus === "boolean") {
    filter.status = normalizedStatus;
  }

  const sortOptions = {
    latest: {
      createdAt: -1,
    },

    oldest: {
      createdAt: 1,
    },

    "code-asc": {
      publisherCode: 1,
    },

    "code-desc": {
      publisherCode: -1,
    },

    "name-asc": {
      publisherName: 1,
    },

    "name-desc": {
      publisherName: -1,
    },
  };

  const sortOption = sortOptions[sort] || sortOptions.latest;

  const total = await Publisher.countDocuments(filter);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  /*
   * Tránh trường hợp đang ở trang lớn hơn
   * tổng số trang sau khi dữ liệu thay đổi.
   */
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;

  const skip = (currentPage - 1) * limit;

  const publishers = await Publisher.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    publishers,

    pagination: {
      total,
      page: currentPage,
      limit,
      totalPages,

      hasPreviousPage: totalPages > 0 && currentPage > 1,

      hasNextPage: totalPages > 0 && currentPage < totalPages,
    },
  };
};

/* ==================================================
   LẤY CHI TIẾT NHÀ XUẤT BẢN
================================================== */

const getPublisherById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã nhà xuất bản không hợp lệ");
  }

  const publisher = await Publisher.findById(id).lean();

  if (!publisher) {
    throw new Error("Không tìm thấy nhà xuất bản");
  }

  return publisher;
};

/* ==================================================
   THÊM NHÀ XUẤT BẢN
================================================== */

const createPublisher = async (data = {}) => {
  const publisherName = String(data.publisherName || data.name || "").trim();

  const email = normalizeEmail(data.email);

  const phone = normalizePhone(data.phone);

  const address = String(data.address || "").trim();

  if (!publisherName) {
    throw new Error("Vui lòng nhập tên nhà xuất bản");
  }

  /*
   * Kiểm tra trùng trước khi sinh mã.
   */
  const existedPublisher = await checkPublisherDuplicate({
    publisherName,
    email,
    phone,
  });

  checkDuplicateInformation(existedPublisher, {
    publisherName,
    email,
    phone,
  });

  /*
   * Mã được sinh hoàn toàn ở backend.
   * Frontend không cần gửi publisherCode.
   */
  const publisherCode = await generatePublisherCode();

  try {
    const publisher = await Publisher.create({
      publisherCode,
      publisherName,

      email: email || undefined,
      phone: phone || undefined,
      address,

      status: true,
    });

    return publisher;
  } catch (error) {
    if (error?.code === 11000) {
      throwDuplicateError(error);
    }

    throw error;
  }
};

/* ==================================================
   CẬP NHẬT NHÀ XUẤT BẢN
================================================== */

const updatePublisher = async (id, data = {}) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã nhà xuất bản không hợp lệ");
  }

  const publisher = await Publisher.findById(id);

  if (!publisher) {
    throw new Error("Không tìm thấy nhà xuất bản");
  }

  /*
   * Không cập nhật publisherCode.
   *
   * Mã nhà xuất bản được tự sinh khi tạo
   * và giữ nguyên trong suốt quá trình sử dụng.
   */

  if (data.publisherName !== undefined || data.name !== undefined) {
    const publisherName = String(data.publisherName ?? data.name ?? "").trim();

    if (!publisherName) {
      throw new Error("Tên nhà xuất bản không được để trống");
    }

    const existedPublisher = await checkPublisherDuplicate({
      publisherName,
      excludeId: id,
    });

    checkDuplicateInformation(existedPublisher, {
      publisherName,
    });

    publisher.publisherName = publisherName;
  }

  if (data.email !== undefined) {
    const email = normalizeEmail(data.email);

    if (email) {
      const existedPublisher = await checkPublisherDuplicate({
        email,
        excludeId: id,
      });

      checkDuplicateInformation(existedPublisher, {
        email,
      });
    }

    publisher.email = email || undefined;
  }

  if (data.phone !== undefined) {
    const phone = normalizePhone(data.phone);

    if (phone) {
      const existedPublisher = await checkPublisherDuplicate({
        phone,
        excludeId: id,
      });

      checkDuplicateInformation(existedPublisher, {
        phone,
      });
    }

    publisher.phone = phone || undefined;
  }

  if (data.address !== undefined) {
    publisher.address = String(data.address || "").trim();
  }

  if (data.status !== undefined) {
    const status = normalizeBoolean(data.status);

    if (typeof status !== "boolean") {
      throw new Error("Trạng thái nhà xuất bản không hợp lệ");
    }

    publisher.status = status;
  }

  try {
    await publisher.save();

    return publisher;
  } catch (error) {
    if (error?.code === 11000) {
      throwDuplicateError(error);
    }

    throw error;
  }
};

// ==================================================
// XÓA NHÀ XUẤT BẢN
// ==================================================
const deletePublisher = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(
      "Mã nhà xuất bản không hợp lệ",
    );
  }

  const publisher =
    await Publisher.findById(id);

  if (!publisher) {
    throw new Error(
      "Không tìm thấy nhà xuất bản",
    );
  }

  /*
   * Không cho xóa nhà xuất bản nếu vẫn còn
   * sách đang tham chiếu đến nhà xuất bản này.
   */
  const relatedBook =
    await Book.exists({
      publisher: id,
    });

  if (relatedBook) {
    throw new Error(
      "Không thể xóa nhà xuất bản vì vẫn còn sách thuộc nhà xuất bản này",
    );
  }

  await Publisher.deleteOne({
    _id: id,
  });

  return {
    _id: publisher._id,
    publisherCode:
      publisher.publisherCode,
    publisherName:
      publisher.publisherName,
  };
};

// ==================================================
// TÌM HOẶC TẠO NHÀ XUẤT BẢN THEO TÊN
// ==================================================
const findOrCreatePublisherByName = async (
  name,
) => {
  const publisherName = String(
    name || "",
  ).trim();

  if (!publisherName) {
    throw new Error(
      "Vui lòng nhập tên nhà xuất bản",
    );
  }

  /*
   * Tìm chính xác theo tên nhưng không phân biệt
   * chữ hoa và chữ thường.
   */
  const existedPublisher =
    await Publisher.findOne({
      publisherName: {
        $regex:
          `^${escapeRegex(
            publisherName,
          )}$`,
        $options: "i",
      },
    });

  if (existedPublisher) {
    return existedPublisher;
  }

  /*
   * Chưa tồn tại thì tự tạo nhà xuất bản mới.
   */
  const publisherCode =
    await generatePublisherCode();

  try {
    return await Publisher.create({
      publisherCode,
      publisherName,
      address: "",
      status: true,
    });
  } catch (error) {
    /*
     * Trường hợp hai yêu cầu cùng tạo một tên,
     * thử tìm lại trước khi báo lỗi.
     */
    const publisher =
      await Publisher.findOne({
        publisherName: {
          $regex:
            `^${escapeRegex(
              publisherName,
            )}$`,
          $options: "i",
        },
      });

    if (publisher) {
      return publisher;
    }

    throw error;
  }
};

module.exports = {
  getAllPublishers,
  getPublisherById,
  createPublisher,
  updatePublisher,
  deletePublisher,
  findOrCreatePublisherByName,
};
