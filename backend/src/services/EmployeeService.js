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
const getAllEmployees = async () => {
  return await Employee.find().select("-password").sort({ createdAt: -1 });
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
