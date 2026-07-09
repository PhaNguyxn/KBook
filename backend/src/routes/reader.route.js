const express = require("express");

const router = express.Router();

const ReaderController = require("../controllers/ReaderController");

const verifyToken = require("../middleware/auth.middleware");

const { isAdmin } = require("../middleware/role.middleware");

router.get("/", ReaderController.getAllReaders);

router.get("/:id", ReaderController.getReaderById);

router.post("/", verifyToken, isAdmin, ReaderController.createReader);

router.put("/:id", verifyToken, isAdmin, ReaderController.updateReader);

router.delete("/:id", verifyToken, isAdmin, ReaderController.deleteReader);

module.exports = router;
