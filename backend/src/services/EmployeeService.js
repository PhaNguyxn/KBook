const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Employee = require("../models/Employee");

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

// =========================
// Danh sách nhân viên
// =========================
const getAllEmployees = async (query = {}) => {
  let {
    page = 1,
    limit = 10,
    keyword = "",
    role = "",
    status = "",
    sort = "",
  } = query;

  page = Math.max(Number(page) || 1, 1);
  limit = Math.max(Number(limit) || 10, 1);

  const filter = {};

  if (keyword.trim()) {
    const searchKeyword = keyword.trim();

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

  if (status !== "") {
    filter.status = status === "true";
  }

  let sortOption = {
    createdAt: -1,
  };

  if (sort === "name") {
    sortOption = {
      fullName: 1,
    };
  }

  if (sort === "employeeCode") {
    sortOption = {
      employeeCode: 1,
    };
  }

  if (sort === "role") {
    sortOption = {
      role: 1,
      fullName: 1,
    };
  }

  const total = await Employee.countDocuments(filter);

  const employees = await Employee.find(filter)
    .select("-password")
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);

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

// =========================
// Chi tiết nhân viên
// =========================
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

// =========================
// Thêm nhân viên
// =========================
const createEmployee = async (data) => {
  const {
    employeeCode,
    fullName,
    email,
    password,
    phone,
    birthday,
    gender,
    address,
    role,
  } = data;

  if (
    !employeeCode?.trim() ||
    !fullName?.trim() ||
    !email?.trim() ||
    !password ||
    !phone?.trim()
  ) {
    throw new Error("Vui lòng nhập đầy đủ thông tin bắt buộc");
  }

  if (!["admin", "staff"].includes(role)) {
    throw new Error("Vai trò nhân viên không hợp lệ");
  }

  if (gender && !["Nam", "Nữ", "Khác"].includes(gender)) {
    throw new Error("Giới tính không hợp lệ");
  }

  if (password.length < 6) {
    throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
  }

  const normalizedEmployeeCode = employeeCode.trim().toUpperCase();

  const normalizedEmail = email.trim().toLowerCase();

  const normalizedPhone = phone.replace(/\s/g, "");

  const existedEmployee = await Employee.findOne({
    $or: [
      {
        employeeCode: normalizedEmployeeCode,
      },
      {
        email: normalizedEmail,
      },
      {
        phone: normalizedPhone,
      },
    ],
  });

  if (existedEmployee) {
    if (existedEmployee.employeeCode === normalizedEmployeeCode) {
      throw new Error("Mã nhân viên đã tồn tại");
    }

    if (existedEmployee.email === normalizedEmail) {
      throw new Error("Email đã tồn tại");
    }

    throw new Error("Số điện thoại đã tồn tại");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const employee = await Employee.create({
    employeeCode: normalizedEmployeeCode,
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    phone: normalizedPhone,
    birthday: birthday || null,
    gender: gender || "Nam",
    address: address?.trim() || "",
    role,
    status: true,
  });

  return await Employee.findById(employee._id).select("-password");
};

// =========================
// Cập nhật nhân viên
// =========================
const updateEmployee = async (id, data) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã nhân viên không hợp lệ");
  }

  const employee = await Employee.findById(id);

  if (!employee) {
    throw new Error("Không tìm thấy nhân viên");
  }

  if (data.employeeCode) {
    const normalizedEmployeeCode = data.employeeCode.trim().toUpperCase();

    const employeeCodeExisted = await Employee.findOne({
      employeeCode: normalizedEmployeeCode,
      _id: {
        $ne: id,
      },
    });

    if (employeeCodeExisted) {
      throw new Error("Mã nhân viên đã tồn tại");
    }

    employee.employeeCode = normalizedEmployeeCode;
  }

  if (data.email) {
    const normalizedEmail = data.email.trim().toLowerCase();

    const emailExisted = await Employee.findOne({
      email: normalizedEmail,
      _id: {
        $ne: id,
      },
    });

    if (emailExisted) {
      throw new Error("Email đã tồn tại");
    }

    employee.email = normalizedEmail;
  }

  if (data.phone) {
    const normalizedPhone = data.phone.replace(/\s/g, "");

    const phoneExisted = await Employee.findOne({
      phone: normalizedPhone,
      _id: {
        $ne: id,
      },
    });

    if (phoneExisted) {
      throw new Error("Số điện thoại đã tồn tại");
    }

    employee.phone = normalizedPhone;
  }

  if (data.fullName !== undefined) {
    employee.fullName = data.fullName.trim();
  }

  if (data.birthday !== undefined) {
    employee.birthday = data.birthday || null;
  }

  if (data.gender !== undefined) {
    if (!["Nam", "Nữ", "Khác"].includes(data.gender)) {
      throw new Error("Giới tính không hợp lệ");
    }

    employee.gender = data.gender;
  }

  if (data.address !== undefined) {
    employee.address = data.address.trim();
  }

  if (data.role !== undefined) {
    if (!["admin", "staff"].includes(data.role)) {
      throw new Error("Vai trò nhân viên không hợp lệ");
    }

    /*
     * Không cho hạ quyền admin cuối cùng.
     */
    if (employee.role === "admin" && data.role === "staff") {
      const activeAdminCount = await Employee.countDocuments({
        role: "admin",
        status: true,
      });

      if (activeAdminCount <= 1) {
        throw new Error("Không thể hạ quyền admin cuối cùng");
      }
    }

    employee.role = data.role;
  }

  if (data.status !== undefined) {
    const normalizedStatus = normalizeBoolean(data.status);

    if (typeof normalizedStatus !== "boolean") {
      throw new Error("Trạng thái nhân viên không hợp lệ");
    }

    if (
      employee.role === "admin" &&
      employee.status === true &&
      normalizedStatus === false
    ) {
      const activeAdminCount = await Employee.countDocuments({
        role: "admin",
        status: true,
      });

      if (activeAdminCount <= 1) {
        throw new Error("Không thể khóa admin cuối cùng");
      }
    }

    employee.status = normalizedStatus;
  }

  if (data.password) {
    if (data.password.length < 6) {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
    }

    employee.password = await bcrypt.hash(data.password, 10);
  }

  await employee.save();

  return await Employee.findById(id).select("-password");
};

// =========================
// Khóa nhân viên
// =========================
const deleteEmployee = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Mã nhân viên không hợp lệ");
  }

  const employee = await Employee.findById(id);

  if (!employee) {
    throw new Error("Không tìm thấy nhân viên");
  }

  if (!employee.status) {
    throw new Error("Nhân viên đã bị khóa");
  }

  if (employee.role === "admin") {
    const activeAdminCount = await Employee.countDocuments({
      role: "admin",
      status: true,
    });

    if (activeAdminCount <= 1) {
      throw new Error("Không thể khóa admin cuối cùng");
    }
  }

  employee.status = false;

  await employee.save();

  return await Employee.findById(id).select("-password");
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
