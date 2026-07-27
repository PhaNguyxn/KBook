const express = require("express");

const router = express.Router();

const ReaderController = require("../controllers/ReaderController");

const verifyToken = require("../middleware/auth.middleware");

const { isAdmin, isStaffOrAdmin } = require("../middleware/role.middleware");

router.use(verifyToken);

router.get("/", isStaffOrAdmin, ReaderController.getAllReaders);

router.get("/:id", isStaffOrAdmin, ReaderController.getReaderById);

router.post("/", isStaffOrAdmin, ReaderController.createReader);

router.put("/:id", isAdmin, ReaderController.updateReader);

router.delete("/:id", isAdmin, ReaderController.deleteReader);

module.exports = router;
