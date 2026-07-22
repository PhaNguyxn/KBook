const Employee = require("../models/Employee");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Đăng ký nhân viên
const register = async (data) => {
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

  const employeeExist = await Employee.findOne({ employeeCode });

  if (employeeExist) {
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

// Đăng nhập
const login = async (data) => {
  const { employeeCode, password } = data;

  const employee = await Employee.findOne({
    employeeCode,
  });

  if (!employee) {
    throw new Error("Tài khoản không tồn tại");
  }

  const check = await bcrypt.compare(password, employee.password);

  if (!check) {
    throw new Error("Sai mật khẩu");
  }

  const token = jwt.sign(
    {
      id: employee._id,
      role: employee.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    },
  );

  const employeeData = employee.toObject();

  delete employeeData.password;

  return {
    token,
    employee: employeeData,
  };
};

module.exports = {
  register,
  login,
};
