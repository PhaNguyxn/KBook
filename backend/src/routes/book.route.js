const express = require("express");
const router = express.Router();

const BookController = require("../controllers/BookController");
const verifyToken = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

// Public
router.get("/", BookController.getAllBooks);
router.get("/:id", BookController.getBookById);

// Admin
router.post("/", verifyToken, isAdmin, upload.single("image"), BookController.createBook);
router.put("/:id", verifyToken, isAdmin, upload.single("image"), BookController.updateBook);
router.delete("/:id", verifyToken, isAdmin, BookController.deleteBook);

module.exports = router;
