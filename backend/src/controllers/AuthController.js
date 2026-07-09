const AuthService = require("../services/AuthService");

const register = async (req, res) => {
  try {
    const employee = await AuthService.register(req.body);

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      data: employee,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await AuthService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token: result.token,
      employee: result.employee,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
};
