const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (data) => {
  const { username, password, fullName, email } = data;

  const existed = await User.findOne({
    username,
  });

  if (existed) {
    throw new Error("Username đã tồn tại");
  }

  const emailExist = await User.findOne({
    email,
  });

  if (emailExist) {
    throw new Error("Email đã tồn tại");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    password: hashPassword,
    fullName,
    email,
  });

  return user;
};

const login = async (data) => {
  const { username, password } = data;

  const user = await User.findOne({
    username,
  });

  if (!user) {
    throw new Error("Tài khoản không tồn tại");
  }

  const check = await bcrypt.compare(password, user.password);

  if (!check) {
    throw new Error("Sai mật khẩu");
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    },
  );

  return {
    token,
    user,
  };
};

module.exports = {
  register, login
};
