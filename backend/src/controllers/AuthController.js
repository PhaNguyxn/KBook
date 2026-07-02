const User = require("../models/User");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const AuthService = require("../services/AuthService");

const register = async (req, res) => {
  try {
    const user = await AuthService.register(req.body);

    res.status(201).json({
      success: true,

      message: "Đăng ký thành công",

      data: user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,

      message: err.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await AuthService.login(req.body);

    res.json({
      success: true,

      message: "Đăng nhập thành công",

      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,

      message: err.message,
    });
  }
};

module.exports = {
  register,

  login,
};