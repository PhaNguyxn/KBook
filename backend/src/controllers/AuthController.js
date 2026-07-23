const AuthService = require("../services/AuthService");

const login = async (req, res) => {
  try {
    const result = await AuthService.login(req.body);

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token: result.token,
      employee: result.employee,
    });
  } catch (error) {
    const statusCode = error.message === "Tài khoản đã bị khóa" ? 403 : 401;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
};

module.exports = {
  login,
  getMe,
};
