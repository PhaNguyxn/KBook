const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Reader = require("../models/Reader");

/* =========================================
   HÀM CHUẨN HÓA
========================================= */

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizePhone(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .trim();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^[0-9]{9,11}$/.test(phone);
}

function validateBirthday(value) {
  if (!value) {
    return null;
  }

  const birthday = new Date(value);

  if (Number.isNaN(birthday.getTime()) || birthday >= new Date()) {
    throw new Error("Ngày sinh không hợp lệ");
  }

  return birthday;
}

/* =========================================
   TỰ SINH MÃ ĐỘC GIẢ
========================================= */

async function generateReaderCode() {
  const readers = await Reader.find({
    readerCode: /^DG\d+$/i,
  })
    .select("readerCode")
    .lean();

  let largestNumber = 0;

  for (const reader of readers) {
    const code = String(reader.readerCode || "").toUpperCase();

    const number = Number(code.replace(/^DG/, ""));

    if (Number.isInteger(number) && number > largestNumber) {
      largestNumber = number;
    }
  }

  const nextNumber = largestNumber + 1;

  return `DG${String(nextNumber).padStart(3, "0")}`;
}

/* =========================================
   TẠO TOKEN
========================================= */

function generateReaderToken(reader) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET chưa được cấu hình");
  }

  return jwt.sign(
    {
      readerId: String(reader._id),

      id: String(reader._id),

      readerCode: reader.readerCode,

      email: reader.email,

      type: "reader",
    },

    process.env.JWT_SECRET,

    {
      expiresIn: process.env.JWT_EXPIRES || "7d",
    },
  );
}

/* =========================================
   LOẠI BỎ MẬT KHẨU
========================================= */

function sanitizeReader(reader) {
  if (!reader) {
    return null;
  }

  const data =
    typeof reader.toObject === "function"
      ? reader.toObject({
          virtuals: true,
        })
      : { ...reader };

  delete data.password;
  delete data.__v;

  data.fullName =
    data.fullName || `${data.lastName || ""} ${data.firstName || ""}`.trim();

  return data;
}

/* =========================================
   ĐĂNG KÝ
========================================= */

async function registerReader(data = {}) {
  const lastName = normalizeText(data.lastName);

  const firstName = normalizeText(data.firstName);

  const email = normalizeEmail(data.email);

  const phone = normalizePhone(data.phone);

  const password = String(data.password || "");

  const birthday = validateBirthday(data.birthday);

  const gender = data.gender || "Nam";

  const address = normalizeText(data.address);

  if (!lastName || !firstName || !email || !phone || !password) {
    throw new Error("Vui lòng nhập đầy đủ thông tin bắt buộc");
  }

  if (!validateEmail(email)) {
    throw new Error("Email không hợp lệ");
  }

  if (!validatePhone(phone)) {
    throw new Error("Số điện thoại phải gồm từ 9 đến 11 chữ số");
  }

  if (password.length < 6) {
    throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
  }

  if (!["Nam", "Nữ", "Khác"].includes(gender)) {
    throw new Error("Giới tính không hợp lệ");
  }

  const existedReader = await Reader.findOne({
    $or: [
      {
        email,
      },
      {
        phone,
      },
    ],
  }).lean();

  if (existedReader) {
    if (existedReader.email === email) {
      throw new Error("Email đã được sử dụng");
    }

    throw new Error("Số điện thoại đã được sử dụng");
  }

  const hashedPassword = await bcrypt.hash(password, 10);


  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const readerCode = await generateReaderCode();

      const reader = await Reader.create({
        readerCode,
        lastName,
        firstName,
        email,
        phone,
        birthday,
        gender,
        address,
        password: hashedPassword,
        status: true,
      });

      return sanitizeReader(reader);
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }

      const duplicatedField =
        Object.keys(error?.keyPattern || {})[0] ||
        Object.keys(error?.keyValue || {})[0];

      if (duplicatedField === "email") {
        throw new Error("Email đã được sử dụng");
      }

      if (duplicatedField === "phone") {
        throw new Error("Số điện thoại đã được sử dụng");
      }

      if (duplicatedField !== "readerCode") {
        throw error;
      }
    }
  }

  throw new Error("Không thể tạo mã độc giả, vui lòng thử lại");
}

/* =========================================
   ĐĂNG NHẬP BẰNG EMAIL
========================================= */

async function loginReader(data = {}) {
  const email = String(data.email || "")
    .trim()
    .toLowerCase();

  const password = String(data.password || "");

  if (!email) {
    throw new Error("Vui lòng nhập email");
  }

  if (!password) {
    throw new Error("Vui lòng nhập mật khẩu");
  }

  const reader = await Reader.findOne({
    email,
  }).select("+password");

  if (!reader) {
    throw new Error("Email hoặc mật khẩu không chính xác");
  }

  if (reader.status === false) {
    throw new Error("Tài khoản độc giả đã bị khóa");
  }

  if (!reader.password) {
    throw new Error("Tài khoản chưa được thiết lập mật khẩu");
  }

  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(reader.password);

  if (!isBcryptHash) {
    console.error(`Mật khẩu của ${email} chưa được mã hóa bcrypt`);

    throw new Error("Tài khoản chưa được thiết lập mật khẩu hợp lệ");
  }

  const passwordMatched = await bcrypt.compare(password, reader.password);

  if (!passwordMatched) {
    throw new Error("Email hoặc mật khẩu không chính xác");
  }

  const token = generateReaderToken(reader);

  return {
    token,
    reader: sanitizeReader(reader),
  };
}

/* =========================================
   LẤY HỒ SƠ
========================================= */

async function getReaderProfile(readerId) {
  if (!mongoose.isValidObjectId(readerId)) {
    throw new Error("Mã độc giả không hợp lệ");
  }

  const reader = await Reader.findById(readerId);

  if (!reader) {
    throw new Error("Không tìm thấy độc giả");
  }

  return sanitizeReader(reader);
}

/* =========================================
   CẬP NHẬT HỒ SƠ
========================================= */

async function updateReaderProfile(readerId, data = {}) {
  if (!mongoose.isValidObjectId(readerId)) {
    throw new Error("Mã độc giả không hợp lệ");
  }

  const reader = await Reader.findById(readerId);

  if (!reader) {
    throw new Error("Không tìm thấy độc giả");
  }


  if (data.lastName !== undefined) {
    const lastName = normalizeText(data.lastName);

    if (!lastName) {
      throw new Error("Họ không được để trống");
    }

    reader.lastName = lastName;
  }

  if (data.firstName !== undefined) {
    const firstName = normalizeText(data.firstName);

    if (!firstName) {
      throw new Error("Tên không được để trống");
    }

    reader.firstName = firstName;
  }

  if (data.email !== undefined) {
    const email = normalizeEmail(data.email);

    if (!validateEmail(email)) {
      throw new Error("Email không hợp lệ");
    }

    const existedEmail = await Reader.findOne({
      email,

      _id: {
        $ne: readerId,
      },
    }).lean();

    if (existedEmail) {
      throw new Error("Email đã được sử dụng");
    }

    reader.email = email;
  }

  if (data.phone !== undefined) {
    const phone = normalizePhone(data.phone);

    if (!validatePhone(phone)) {
      throw new Error("Số điện thoại phải gồm từ 9 đến 11 chữ số");
    }

    const existedPhone = await Reader.findOne({
      phone,

      _id: {
        $ne: readerId,
      },
    }).lean();

    if (existedPhone) {
      throw new Error("Số điện thoại đã được sử dụng");
    }

    reader.phone = phone;
  }

  if (data.birthday !== undefined) {
    reader.birthday = data.birthday ? validateBirthday(data.birthday) : null;
  }

  if (data.gender !== undefined) {
    if (!["Nam", "Nữ", "Khác"].includes(data.gender)) {
      throw new Error("Giới tính không hợp lệ");
    }

    reader.gender = data.gender;
  }

  if (data.address !== undefined) {
    reader.address = normalizeText(data.address);
  }

  try {
    await reader.save();
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.email) {
      throw new Error("Email đã được sử dụng");
    }

    if (error?.code === 11000 && error?.keyPattern?.phone) {
      throw new Error("Số điện thoại đã được sử dụng");
    }

    throw error;
  }

  return sanitizeReader(reader);
}

/* =========================================
   ĐỔI MẬT KHẨU
========================================= */

async function changeReaderPassword(readerId, data = {}) {
  if (!mongoose.isValidObjectId(readerId)) {
    throw new Error("Mã độc giả không hợp lệ");
  }

  const currentPassword = String(data.currentPassword || "");

  const newPassword = String(data.newPassword || "");

  const confirmPassword = String(data.confirmPassword || "");

  if (!currentPassword || !newPassword) {
    throw new Error("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới");
  }

  if (newPassword.length < 6) {
    throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    throw new Error("Mật khẩu xác nhận không khớp");
  }

  if (currentPassword === newPassword) {
    throw new Error("Mật khẩu mới phải khác mật khẩu hiện tại");
  }

  const reader = await Reader.findById(readerId).select("+password");

  if (!reader) {
    throw new Error("Không tìm thấy độc giả");
  }

  const passwordMatched = await bcrypt.compare(
    currentPassword,
    reader.password,
  );

  if (!passwordMatched) {
    throw new Error("Mật khẩu hiện tại không chính xác");
  }

  reader.password = await bcrypt.hash(newPassword, 10);

  await reader.save();

  return {
    message: "Đổi mật khẩu thành công",
  };
}

module.exports = {
  registerReader,
  loginReader,
  getReaderProfile,
  updateReaderProfile,
  changeReaderPassword,
};
