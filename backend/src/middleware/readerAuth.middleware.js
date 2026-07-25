const jwt = require("jsonwebtoken");

const Reader = require("../models/Reader");

async function readerAuthMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập để tiếp tục",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET chưa được cấu hình",
      });
    }

    const payload = jwt.verify(token, secret);

    if (payload.type !== "reader") {
      return res.status(403).json({
        success: false,
        message: "Token không thuộc tài khoản độc giả",
      });
    }

    const readerId = payload.readerId || payload.id;

    const reader = await Reader.findById(readerId);

    if (!reader) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản độc giả không còn tồn tại",
      });
    }

    if (reader.status === false) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản độc giả đã bị khóa",
      });
    }

    /*
     * Có thể sử dụng cả req.readerId
     * và req.reader trong controller.
     */
    req.readerId = reader._id;

    req.reader = reader;

    req.auth = {
      type: "reader",
      id: reader._id,
      readerCode: reader.readerCode,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập đã hết hạn",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token đăng nhập không hợp lệ",
      });
    }

    console.error("Reader auth middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể xác thực tài khoản độc giả",
    });
  }
}

module.exports = readerAuthMiddleware;
