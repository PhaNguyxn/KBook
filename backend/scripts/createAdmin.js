require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Employee = require("../src/models/Employee");

async function createAdmin() {
  const [employeeCode, fullName, email, phone, password] =
    process.argv.slice(2);

  if (!employeeCode || !fullName || !email || !phone || !password) {
    console.log(
      "Cách dùng: node scripts/createAdmin.js <mã> <họ tên> <email> <sđt> <mật khẩu>",
    );

    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existed = await Employee.findOne({
      $or: [{ employeeCode }, { email }, { phone }],
    });

    if (existed) {
      throw new Error("Mã nhân viên, email hoặc số điện thoại đã tồn tại");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    await Employee.create({
      employeeCode,
      fullName,
      email,
      phone,
      password: hashPassword,
      role: "admin",
      status: true,
    });

    console.log("Tạo tài khoản admin thành công");
  } catch (error) {
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
