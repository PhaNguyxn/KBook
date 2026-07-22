const Employee = require("../models/Employee");
const bcrypt = require("bcrypt");

// Tạo nhân viên
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

  const existed = await Employee.findOne({ employeeCode });

  if (existed) {
    throw new Error("Mã nhân viên đã tồn tại");
  }

  const emailExist = await Employee.findOne({ email });

  if (emailExist) {
    throw new Error("Email đã tồn tại");
  }

  const phoneExist = await Employee.findOne({ phone });

  if (phoneExist) {
    throw new Error("Số điện thoại đã tồn tại");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const employee = await Employee.create({
    employeeCode,
    fullName,
    email,
    password: hashPassword,
    phone,
    birthday,
    gender,
    address,
    role,
  });

  return employee;
};

// Lấy danh sách nhân viên
const getAllEmployees = async (query) => {
  let { page = 1, limit = 10, keyword, role, status, sort } = query;

  page = Number(page);
  limit = Number(limit);

  const filter = {};

  // Search

  if (keyword) {
    filter.$or = [
      {
        fullName: {
          $regex: keyword,
          $options: "i",
        },
      },

      {
        email: {
          $regex: keyword,
          $options: "i",
        },
      },

      {
        phone: {
          $regex: keyword,
          $options: "i",
        },
      },
    ];
  }

  // Role

  if (role) {
    filter.role = role;
  }

  // Status

  if (status !== undefined) {
    filter.status = status === "true";
  }

  // Sort

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

// Lấy chi tiết nhân viên
const getEmployeeById = async (id) => {
  const employee = await Employee.findById(id).select("-password");

  if (!employee) {
    throw new Error("Không tìm thấy nhân viên");
  }

  return employee;
};

// Cập nhật nhân viên
const updateEmployee = async (id, data) => {
  const employee = await Employee.findById(id);

  if (!employee) {
    throw new Error("Không tìm thấy nhân viên");
  }

  employee.fullName = data.fullName ?? employee.fullName;
  employee.email = data.email ?? employee.email;
  employee.phone = data.phone ?? employee.phone;
  employee.gender = data.gender ?? employee.gender;
  employee.birthday = data.birthday ?? employee.birthday;
  employee.address = data.address ?? employee.address;
  employee.role = data.role ?? employee.role;
  employee.status = data.status !== undefined ? data.status : employee.status;

  await employee.save();

  return await Employee.findById(id).select("-password");
};

// Xóa mềm nhân viên
const deleteEmployee = async (id) => {
  const employee = await Employee.findById(id);

  if (!employee) {
    throw new Error("Không tìm thấy nhân viên");
  }

  employee.status = false;

  await employee.save();

  return employee;
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};
