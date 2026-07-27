const readerAuthService = require("../services/readerAuth.service");

async function register(req, res) {
  try {
    const reader = await readerAuthService.registerReader(req.body);

    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",

      data: reader,
    });
  } catch (error) {
    console.error("Register reader error:", error);

    return res.status(400).json({
      success: false,

      message: error.message || "Không thể đăng ký tài khoản",
    });
  }
}


async function login(req, res) {
  try {
    const result = await readerAuthService.loginReader(req.body);

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",

      data: result,
    });
  } catch (error) {
    console.error("Login reader error:", error);

    return res.status(401).json({
      success: false,

      message: error.message || "Đăng nhập không thành công",
    });
  }
}


async function getProfile(req, res) {
  try {
    const reader = await readerAuthService.getReaderProfile(req.readerId);

    return res.status(200).json({
      success: true,
      data: reader,
    });
  } catch (error) {
    console.error("Get reader profile error:", error);

    return res.status(400).json({
      success: false,

      message: error.message || "Không thể tải hồ sơ độc giả",
    });
  }
}


async function updateProfile(req, res) {
  try {
    const reader = await readerAuthService.updateReaderProfile(
      req.readerId,
      req.body,
    );

    return res.status(200).json({
      success: true,

      message: "Cập nhật thông tin thành công",

      data: reader,
    });
  } catch (error) {
    console.error("Update reader profile error:", error);

    return res.status(400).json({
      success: false,

      message: error.message || "Không thể cập nhật hồ sơ độc giả",
    });
  }
}


async function changePassword(req, res) {
  try {
    const result = await readerAuthService.changeReaderPassword(
      req.readerId,
      req.body,
    );

    return res.status(200).json({
      success: true,

      message: result.message || "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Change reader password error:", error);

    return res.status(400).json({
      success: false,

      message: error.message || "Không thể đổi mật khẩu",
    });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
