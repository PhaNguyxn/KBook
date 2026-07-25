const express = require("express");

const readerAuthController = require("../controllers/readerAuth.controller");

const readerAuthMiddleware = require("../middleware/readerAuth.middleware");

const router = express.Router();

const Reader = require("../models/Reader");

router.get("/debug-readers", async (req, res) => {
  const readers = await Reader.find({})
    .select("readerCode email firstName lastName")
    .lean();

  return res.json({
    database: Reader.db.name,

    collection: Reader.collection.name,

    total: readers.length,

    readers,
  });
});

/* =========================================
   KIỂM TRA ROUTER
========================================= */

router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Reader Auth Router đang hoạt động",
  });
});

/* =========================================
   API CÔNG KHAI
========================================= */

// POST /api/reader-auth/register
router.post("/register", readerAuthController.register);

// POST /api/reader-auth/login
router.post("/login", readerAuthController.login);

/* =========================================
   API YÊU CẦU ĐĂNG NHẬP
========================================= */

// GET /api/reader-auth/profile
router.get("/profile", readerAuthMiddleware, readerAuthController.getProfile);

// PUT /api/reader-auth/profile
router.put(
  "/profile",
  readerAuthMiddleware,
  readerAuthController.updateProfile,
);

// PUT /api/reader-auth/change-password
router.put(
  "/change-password",
  readerAuthMiddleware,
  readerAuthController.changePassword,
);

module.exports = router;
