const mongoose = require("mongoose");

const Publisher = require("../models/Publisher");

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}

function normalizePhone(value = "") {
  return String(value).replace(/\s/g, "").trim();
}

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

// ==================================================
// LẤY DANH SÁCH NHÀ XUẤT BẢN CÓ PHÂN TRANG
// ==================================================
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

  // Tìm kiếm theo mã, tên, email, số điện thoại, địa chỉ
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

  // Lọc trạng thái
  if (status === "true") {
    filter.status = true;
  }

  if (status === "false") {
    filter.status = false;
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
   * Tránh trường hợp người dùng đang ở trang 4,
   * sau khi xóa dữ liệu chỉ còn 3 trang.
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

// ==================================================
// LẤY CHI TIẾT NHÀ XUẤT BẢN
// ==================================================
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

// ==================================================
// THÊM NHÀ XUẤT BẢN
// ==================================================
const createPublisher = async (data = {}) => {
  const publisherCode = String(data.publisherCode || "")
    .trim()
    .toUpperCase();

  const publisherName = String(data.publisherName || "").trim();

  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);
  const address = String(data.address || "").trim();

  if (!publisherCode) {
    throw new Error("Vui lòng nhập mã nhà xuất bản");
  }

  if (!publisherName) {
    throw new Error("Vui lòng nhập tên nhà xuất bản");
  }

  const duplicateConditions = [
    {
      publisherCode,
    },
    {
      publisherName: {
        $regex: `^${escapeRegex(publisherName)}$`,
        $options: "i",
      },
    },
  ];

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

  const existedPublisher = await Publisher.findOne({
    $or: duplicateConditions,
  });

  if (existedPublisher) {
    if (existedPublisher.publisherCode === publisherCode) {
      throw new Error("Mã nhà xuất bản đã tồn tại");
    }

    if (
      existedPublisher.publisherName?.trim().toLowerCase() ===
      publisherName.toLowerCase()
    ) {
      throw new Error("Tên nhà xuất bản đã tồn tại");
    }

    if (email && existedPublisher.email === email) {
      throw new Error("Email nhà xuất bản đã tồn tại");
    }

    if (phone && existedPublisher.phone === phone) {
      throw new Error("Số điện thoại đã tồn tại");
    }
  }

  const publisher = await Publisher.create({
    publisherCode,
    publisherName,
    email,
    phone,
    address,
    status: true,
  });

  return publisher;
};

// ==================================================
// CẬP NHẬT NHÀ XUẤT BẢN
// ==================================================
const updatePublisher = async (id, data = {}) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã nhà xuất bản không hợp lệ");
  }

  const publisher = await Publisher.findById(id);

  if (!publisher) {
    throw new Error("Không tìm thấy nhà xuất bản");
  }

  if (data.publisherCode !== undefined) {
    const publisherCode = String(data.publisherCode).trim().toUpperCase();

    if (!publisherCode) {
      throw new Error("Mã nhà xuất bản không được để trống");
    }

    const codeExisted = await Publisher.findOne({
      _id: {
        $ne: id,
      },
      publisherCode,
    });

    if (codeExisted) {
      throw new Error("Mã nhà xuất bản đã tồn tại");
    }

    publisher.publisherCode = publisherCode;
  }

  if (data.publisherName !== undefined) {
    const publisherName = String(data.publisherName).trim();

    if (!publisherName) {
      throw new Error("Tên nhà xuất bản không được để trống");
    }

    const nameExisted = await Publisher.findOne({
      _id: {
        $ne: id,
      },

      publisherName: {
        $regex: `^${escapeRegex(publisherName)}$`,
        $options: "i",
      },
    });

    if (nameExisted) {
      throw new Error("Tên nhà xuất bản đã tồn tại");
    }

    publisher.publisherName = publisherName;
  }

  if (data.email !== undefined) {
    const email = normalizeEmail(data.email);

    if (email) {
      const emailExisted = await Publisher.findOne({
        _id: {
          $ne: id,
        },
        email,
      });

      if (emailExisted) {
        throw new Error("Email nhà xuất bản đã tồn tại");
      }
    }

    publisher.email = email;
  }

  if (data.phone !== undefined) {
    const phone = normalizePhone(data.phone);

    if (phone) {
      const phoneExisted = await Publisher.findOne({
        _id: {
          $ne: id,
        },
        phone,
      });

      if (phoneExisted) {
        throw new Error("Số điện thoại đã tồn tại");
      }
    }

    publisher.phone = phone;
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

  await publisher.save();

  return publisher;
};

// ==================================================
// KHÓA NHÀ XUẤT BẢN
// ==================================================
const deletePublisher = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã nhà xuất bản không hợp lệ");
  }

  const publisher = await Publisher.findById(id);

  if (!publisher) {
    throw new Error("Không tìm thấy nhà xuất bản");
  }

  if (!publisher.status) {
    throw new Error("Nhà xuất bản đã bị xóa trước đó");
  }

  publisher.status = false;

  await publisher.save();

  return publisher;
};

module.exports = {
  getAllPublishers,
  getPublisherById,
  createPublisher,
  updatePublisher,
  deletePublisher,
};
