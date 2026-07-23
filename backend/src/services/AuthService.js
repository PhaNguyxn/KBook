const Employee = require("../models/Employee");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async (data) => {
  const employeeCode = data.employeeCode?.trim();
  const password = data.password;

  if (!employeeCode || !password) {
    throw new Error("Vui lòng nhập mã nhân viên và mật khẩu");
  }

  const employee = await Employee.findOne({
    employeeCode,
  }).select("+password");

  if (!employee) {
    throw new Error("Mã nhân viên hoặc mật khẩu không đúng");
  }

  const passwordMatched = await bcrypt.compare(password, employee.password);

  if (!passwordMatched) {
    throw new Error("Mã nhân viên hoặc mật khẩu không đúng");
  }

  if (!employee.status) {
    throw new Error("Tài khoản đã bị khóa");
  }

  const token = jwt.sign(
    {
      id: employee._id.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "1d",
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
  login,
};
