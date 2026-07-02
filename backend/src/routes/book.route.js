const express = require("express");

const router = express.Router();

const BookController = require("../controllers/BookController");

const verifyToken = require("../middleware/auth.middleware");

const { isAdmin } = require("../middleware/role.middleware");

// Public
router.get("/", BookController.getAllBooks);

router.get("/:id", BookController.getBookById);

// Admin
router.post("/", verifyToken, isAdmin, BookController.createBook);

router.put("/:id", verifyToken, isAdmin, BookController.updateBook);

router.delete("/:id", verifyToken, isAdmin, BookController.deleteBook);

module.exports = router;
