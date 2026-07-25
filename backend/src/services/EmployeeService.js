const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Employee = require("../models/Employee");
const Borrow = require("../models/Borrow");

/* =========================================
   HÀM HỖ TRỢ
========================================= */

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

function normalizeText(value) {
  return String(value || "").trim();
}

function validateEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(email);
}

function validatePhone(phone) {
  return /^[0-9]{9,11}$/.test(phone);
}

/* =========================================
   TỰ SINH MÃ NHÂN VIÊN
========================================= */

async function generateEmployeeCode() {
  /*
   * Lấy tất cả mã có định dạng NV + số.
   * Cách này vẫn hoạt động đúng khi dữ liệu
   * bị xóa hoặc mã không được tạo liên tục.
   */
  const employees = await Employee.find({
    employeeCode: /^NV\d+$/i,
  })
    .select("employeeCode")
    .lean();

  let largestNumber = 0;

  for (const employee of employees) {
    const code = String(employee.employeeCode || "").toUpperCase();

    const number = Number(code.replace(/^NV/, ""));

    if (Number.isInteger(number) && number > largestNumber) {
      largestNumber = number;
    }
  }

  const nextNumber = largestNumber + 1;

  return `NV${String(nextNumber).padStart(3, "0")}`;
}

/* =========================================
   DANH SÁCH NHÂN VIÊN
========================================= */

const getAllEmployees = async (query = {}) => {
  let { page = 1, limit = 10, keyword = "", role = "", sort = "" } = query;

  page = Math.max(Number(page) || 1, 1);

  limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const filter = {};

  const searchKeyword = String(keyword || "").trim();

  if (searchKeyword) {
    filter.$or = [
      {
        employeeCode: {
          $regex: searchKeyword,
          $options: "i",
        },
      },
      {
        fullName: {
          $regex: searchKeyword,
          $options: "i",
        },
      },
      {
        email: {
          $regex: searchKeyword,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: searchKeyword,
          $options: "i",
        },
      },
    ];
  }

  if (["admin", "staff"].includes(role)) {
    filter.role = role;
  }

  let sortOption = {
    createdAt: -1,
  };

  if (sort === "name") {
    sortOption = {
      fullName: 1,
      employeeCode: 1,
    };
  } else if (sort === "employeeCode") {
    sortOption = {
      employeeCode: 1,
    };
  } else if (sort === "role") {
    sortOption = {
      role: 1,
      fullName: 1,
    };
  }

  const [total, employees] = await Promise.all([
    Employee.countDocuments(filter),

    Employee.find(filter)
      .select("-password")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return {
    employees,

    pagination: {
      total,
      page,
      limit,

      totalPages: Math.ceil(total / limit),
    },
  };
};

/* =========================================
   CHI TIẾT NHÂN VIÊN
========================================= */

const getEmployeeById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã nhân viên không hợp lệ");
  }

  const employee = await Employee.findById(id).select("-password");

  if (!employee) {
    throw new Error("Không tìm thấy nhân viên");
  }

  return employee;
};

/* =========================================
   THÊM NHÂN VIÊN
========================================= */

const createEmployee = async (data = {}) => {
  const fullName = normalizeText(data.fullName);

  const email = normalizeEmail(data.email);

  const phone = normalizePhone(data.phone);

  const password = String(data.password || "");

  const birthday = data.birthday || null;

  const gender = data.gender || "Nam";

  const address = normalizeText(data.address);

  const role = data.role || "staff";

  if (!fullName || !email || !phone || !password) {
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

  if (!["admin", "staff"].includes(role)) {
    throw new Error("Vai trò nhân viên không hợp lệ");
  }

  if (birthday) {
    const birthdayDate = new Date(birthday);

    if (Number.isNaN(birthdayDate.getTime()) || birthdayDate >= new Date()) {
      throw new Error("Ngày sinh không hợp lệ");
    }
  }

  const existedEmployee = await Employee.findOne({
    $or: [
      {
        email,
      },
      {
        phone,
      },
    ],
  });

  if (existedEmployee) {
    if (existedEmployee.email === email) {
      throw new Error("Email đã tồn tại");
    }

    throw new Error("Số điện thoại đã tồn tại");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  /*
   * Thử lại tối đa 5 lần trong trường hợp
   * hai yêu cầu tạo nhân viên chạy cùng lúc
   * và sinh trùng employeeCode.
   */
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const employeeCode = await generateEmployeeCode();

      const employee = await Employee.create({
        employeeCode,

        fullName,
        email,
        phone,
        birthday,
        gender,
        address,
        role,
        password: hashedPassword,

        /*
         * Giữ status=true để tương thích
         * dữ liệu cũ, nhưng giao diện mới
         * không còn chức năng khóa.
         */
        status: true,
      });

      return await Employee.findById(employee._id).select("-password");
    } catch (error) {
      const duplicatedEmployeeCode =
        error?.code === 11000 &&
        Boolean(
          error?.keyPattern?.employeeCode || error?.keyValue?.employeeCode,
        );

      if (!duplicatedEmployeeCode) {
        /*
         * Xử lý trường hợp index MongoDB
         * phát hiện email hoặc điện thoại
         * bị trùng.
         */
        if (error?.code === 11000 && error?.keyPattern?.email) {
          throw new Error("Email đã tồn tại");
        }

        if (error?.code === 11000 && error?.keyPattern?.phone) {
          throw new Error("Số điện thoại đã tồn tại");
        }

        throw error;
      }
    }
  }

  throw new Error("Không thể tạo mã nhân viên, vui lòng thử lại");
};

/* =========================================
   CẬP NHẬT NHÂN VIÊN
========================================= */

const updateEmployee = async (id, data = {}) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã nhân viên không hợp lệ");
  }

  const employee = await Employee.findById(id);

  if (!employee) {
    throw new Error("Không tìm thấy nhân viên");
  }

  /*
   * Không xử lý data.employeeCode.
   * Mã nhân viên được sinh tự động và
   * không được phép thay đổi.
   */

  if (data.fullName !== undefined) {
    const fullName = normalizeText(data.fullName);

    if (!fullName) {
      throw new Error("Họ và tên không được để trống");
    }

    employee.fullName = fullName;
  }

  if (data.email !== undefined) {
    const email = normalizeEmail(data.email);

    if (!validateEmail(email)) {
      throw new Error("Email không hợp lệ");
    }

    const emailExisted = await Employee.findOne({
      email,

      _id: {
        $ne: id,
      },
    });

    if (emailExisted) {
      throw new Error("Email đã tồn tại");
    }

    employee.email = email;
  }

  if (data.phone !== undefined) {
    const phone = normalizePhone(data.phone);

    if (!validatePhone(phone)) {
      throw new Error("Số điện thoại phải gồm từ 9 đến 11 chữ số");
    }

    const phoneExisted = await Employee.findOne({
      phone,

      _id: {
        $ne: id,
      },
    });

    if (phoneExisted) {
      throw new Error("Số điện thoại đã tồn tại");
    }

    employee.phone = phone;
  }

  if (data.birthday !== undefined) {
    if (!data.birthday) {
      employee.birthday = null;
    } else {
      const birthday = new Date(data.birthday);

      if (Number.isNaN(birthday.getTime()) || birthday >= new Date()) {
        throw new Error("Ngày sinh không hợp lệ");
      }

      employee.birthday = birthday;
    }
  }

  if (data.gender !== undefined) {
    if (!["Nam", "Nữ", "Khác"].includes(data.gender)) {
      throw new Error("Giới tính không hợp lệ");
    }

    employee.gender = data.gender;
  }

  if (data.address !== undefined) {
    employee.address = normalizeText(data.address);
  }

  if (data.role !== undefined) {
    if (!["admin", "staff"].includes(data.role)) {
      throw new Error("Vai trò nhân viên không hợp lệ");
    }

    /*
     * Không cho hạ quyền quản trị viên
     * cuối cùng trong hệ thống.
     */
    if (employee.role === "admin" && data.role === "staff") {
      const adminCount = await Employee.countDocuments({
        role: "admin",

        status: {
          $ne: false,
        },
      });

      if (adminCount <= 1) {
        throw new Error("Không thể hạ quyền quản trị viên cuối cùng");
      }
    }

    employee.role = data.role;
  }

  /*
   * Không xử lý data.status vì hệ thống
   * đã chuyển từ khóa/kích hoạt sang xóa.
   */

  if (data.password) {
    const password = String(data.password);

    if (password.length < 6) {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
    }

    employee.password = await bcrypt.hash(password, 10);
  }

  await employee.save();

  return await Employee.findById(employee._id).select("-password");
};

/* =========================================
   XÓA NHÂN VIÊN
========================================= */

const deleteEmployee = async (id, currentEmployeeId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã nhân viên không hợp lệ");
  }

  if (currentEmployeeId && String(id) === String(currentEmployeeId)) {
    throw new Error("Bạn không thể tự xóa tài khoản đang đăng nhập");
  }

  const employee = await Employee.findById(id);

  if (!employee) {
    throw new Error("Không tìm thấy nhân viên");
  }

  /*
   * Không cho xóa quản trị viên cuối cùng.
   */
  if (employee.role === "admin") {
    const adminCount = await Employee.countDocuments({
      role: "admin",

      status: {
        $ne: false,
      },
    });

    if (adminCount <= 1) {
      throw new Error("Không thể xóa quản trị viên cuối cùng");
    }
  }

  /*
   * Không cho xóa nhân viên đã lập phiếu
   * mượn, vì nếu xóa thì populate employee
   * trong phiếu cũ sẽ trả về null.
   */
  const employeeField = Borrow.schema.path("employee")
    ? "employee"
    : Borrow.schema.path("employeeId")
      ? "employeeId"
      : null;

  if (employeeField) {
    const hasBorrowHistory = await Borrow.exists({
      [employeeField]: id,
    });

    if (hasBorrowHistory) {
      throw new Error("Không thể xóa nhân viên đã có lịch sử lập phiếu mượn");
    }
  }

  await Employee.deleteOne({
    _id: id,
  });

  return {
    _id: employee._id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
  };
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
