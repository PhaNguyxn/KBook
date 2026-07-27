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


router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Reader Auth Router đang hoạt động",
  });
});


router.post("/register", readerAuthController.register);

router.post("/login", readerAuthController.login);

router.get("/profile", readerAuthMiddleware, readerAuthController.getProfile);

router.put(
  "/profile",
  readerAuthMiddleware,
  readerAuthController.updateProfile,
);

router.put(
  "/change-password",
  readerAuthMiddleware,
  readerAuthController.changePassword,
);

module.exports = router;
