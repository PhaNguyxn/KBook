const Reader = require("../models/Reader");
const generateCode = require("../utils/generateCode");

/* =========================================
   HÀM HỖ TRỢ
========================================= */

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizePhone(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateBirthday(value) {
  if (!value) {
    throw new Error("Vui lòng chọn ngày sinh");
  }

  const birthday = new Date(value);

  if (Number.isNaN(birthday.getTime())) {
    throw new Error("Ngày sinh không hợp lệ");
  }

  const today = new Date();

  birthday.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (birthday >= today) {
    throw new Error("Ngày sinh phải nhỏ hơn ngày hiện tại");
  }

  return birthday;
}

function validateGender(gender) {
  const allowedGenders = ["Nam", "Nữ", "Khác"];

  if (!allowedGenders.includes(gender)) {
    throw new Error("Giới tính không hợp lệ");
  }
}

function validatePhone(phone) {
  if (!phone) {
    throw new Error("Vui lòng nhập số điện thoại");
  }

  if (!/^[0-9]{9,11}$/.test(phone)) {
    throw new Error("Số điện thoại phải gồm từ 9 đến 11 chữ số");
  }
}

/* =========================================
   LẤY DANH SÁCH ĐỘC GIẢ
========================================= */

const getAllReaders = async (query = {}) => {
  let {
    page = 1,
    limit = 10,
    keyword = "",
    gender = "",
    sort = "",
  } = query;

  page = Math.max(Number(page) || 1, 1);

  limit = Math.max(Number(limit) || 10, 1);

  /*
   * Giới hạn số phần tử mỗi trang để tránh
   * client gửi limit quá lớn.
   */
  limit = Math.min(limit, 100);

  const filter = {};

  const searchKeyword = normalizeText(keyword);

  if (searchKeyword) {
    const safeKeyword = escapeRegex(searchKeyword);

    filter.$or = [
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
        address: {
          $regex: safeKeyword,
          $options: "i",
        },
      },
    ];
  }

  if (gender) {
    filter.gender = gender;
  }

  let sortOption = {
    createdAt: -1,
  };

  if (sort === "name") {
    sortOption = {
      lastName: 1,
      firstName: 1,
    };
  }

  if (sort === "readerCode") {
    sortOption = {
      readerCode: 1,
    };
  }

  const total = await Reader.countDocuments(filter);

  const totalPages = Math.ceil(total / limit);

  /*
   * Tránh truy cập trang lớn hơn tổng số trang.
   */
  if (totalPages > 0 && page > totalPages) {
    page = totalPages;
  }

  const readers = await Reader.find(filter)
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    readers,

    pagination: {
      total,
      page,
      limit,
      totalPages,

      hasPreviousPage: page > 1,

      hasNextPage: page < totalPages,
    },
  };
};

/* =========================================
   TẠO ĐỘC GIẢ
========================================= */

const createReader = async (data = {}) => {
  const firstName = normalizeText(data.firstName);

  const lastName = normalizeText(data.lastName);

  const gender = normalizeText(data.gender) || "Nam";

  const phone = normalizePhone(data.phone);

  const address = normalizeText(data.address);

  if (!lastName) {
    throw new Error("Vui lòng nhập họ độc giả");
  }

  if (!firstName) {
    throw new Error("Vui lòng nhập tên độc giả");
  }

  const birthday = validateBirthday(data.birthday);

  validateGender(gender);
  validatePhone(phone);

  /*
   * Chỉ kiểm tra trùng số điện thoại.
   * Mã độc giả do hệ thống tự sinh.
   */
  const existedPhone = await Reader.exists({
    phone,
  });

  if (existedPhone) {
    throw new Error("Số điện thoại đã tồn tại");
  }

  /*
   * Tự sinh mã:
   * DG001, DG002, DG003...
   *
   * Vòng lặp giúp bỏ qua mã đã tồn tại
   * nếu counter chưa đồng bộ với dữ liệu cũ.
   */
  let readerCode;
  let codeExists = true;

  while (codeExists) {
    readerCode = await generateCode("reader", "DG", 3);

    codeExists = await Reader.exists({
      readerCode,
    });
  }

  const reader = await Reader.create({
    readerCode,
    firstName,
    lastName,
    birthday,
    gender,
    address,
    phone,
  });

  return reader;
};

/* =========================================
   LẤY CHI TIẾT ĐỘC GIẢ
========================================= */

const getReaderById = async (id) => {
  const reader = await Reader.findById(id);

  if (!reader) {
    throw new Error("Không tìm thấy độc giả");
  }

  return reader;
};

/* =========================================
   CẬP NHẬT ĐỘC GIẢ
========================================= */

const updateReader = async (id, data = {}) => {
  const reader = await Reader.findById(id);

  if (!reader) {
    throw new Error("Không tìm thấy độc giả");
  }

  /*
   * Không sử dụng data.readerCode.
   * Mã độc giả không được phép thay đổi.
   */
  const firstName =
    data.firstName !== undefined
      ? normalizeText(data.firstName)
      : reader.firstName;

  const lastName =
    data.lastName !== undefined
      ? normalizeText(data.lastName)
      : reader.lastName;

  const gender =
    data.gender !== undefined ? normalizeText(data.gender) : reader.gender;

  const phone =
    data.phone !== undefined ? normalizePhone(data.phone) : reader.phone;

  const address =
    data.address !== undefined ? normalizeText(data.address) : reader.address;

  if (!lastName) {
    throw new Error("Vui lòng nhập họ độc giả");
  }

  if (!firstName) {
    throw new Error("Vui lòng nhập tên độc giả");
  }

  validateGender(gender);
  validatePhone(phone);

  let birthday = reader.birthday;

  if (data.birthday !== undefined) {
    birthday = validateBirthday(data.birthday);
  }

  /*
   * Kiểm tra trùng số điện thoại với
   * các độc giả khác.
   */
  if (phone !== reader.phone) {
    const phoneExist = await Reader.exists({
      phone,

      _id: {
        $ne: id,
      },
    });

    if (phoneExist) {
      throw new Error("Số điện thoại đã tồn tại");
    }
  }

  reader.firstName = firstName;
  reader.lastName = lastName;
  reader.birthday = birthday;
  reader.gender = gender;
  reader.phone = phone;
  reader.address = address;

  await reader.save();

  return reader;
};

const deleteReader = async (id) => {
  const reader = await Reader.findByIdAndDelete(id);

  if (!reader) {
    throw new Error("Không tìm thấy độc giả");
  }

  return reader;
};

/* =========================================
   EXPORT
========================================= */

module.exports = {
  getAllReaders,
  getReaderById,
  createReader,
  updateReader,
  deleteReader,
};
