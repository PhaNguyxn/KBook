const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Reader = require("../models/Reader");

async function readerAuthMiddleware(req, res, next) {
  try {
    const authorization = String(req.headers.authorization || "");

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        code: "READER_TOKEN_MISSING",
        message: "Vui lòng đăng nhập tài khoản độc giả",
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "READER_TOKEN_MISSING",
        message: "Phiên đăng nhập không hợp lệ",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      const isExpired = error.name === "TokenExpiredError";

      return res.status(401).json({
        success: false,

        code: isExpired ? "READER_TOKEN_EXPIRED" : "READER_TOKEN_INVALID",

        message: isExpired
          ? "Phiên đăng nhập đã hết hạn"
          : "Phiên đăng nhập không hợp lệ",
      });
    }

    if (decoded.type && decoded.type !== "reader") {
      return res.status(401).json({
        success: false,
        code: "INVALID_ACCOUNT_TYPE",
        message: "Token không thuộc tài khoản độc giả",
      });
    }

    const readerId =
      decoded.readerId || decoded.id || decoded._id || decoded.sub;

    if (!readerId || !mongoose.isValidObjectId(readerId)) {
      return res.status(401).json({
        success: false,
        code: "READER_ID_INVALID",
        message: "Thông tin tài khoản không hợp lệ",
      });
    }

    const reader = await Reader.findById(readerId).select("-password");

    if (!reader) {
      return res.status(401).json({
        success: false,
        code: "READER_NOT_FOUND",
        message: "Tài khoản không còn tồn tại. Vui lòng đăng nhập lại",
      });
    }

    if (reader.status === false) {
      return res.status(403).json({
        success: false,
        code: "READER_LOCKED",
        message: "Tài khoản độc giả đã bị khóa",
      });
    }

    req.readerId = reader._id;
    req.reader = reader;

    return next();
  } catch (error) {
    console.error("Reader authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể xác thực tài khoản độc giả",
    });
  }
}

module.exports = readerAuthMiddleware;
