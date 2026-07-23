const express = require("express");

const router = express.Router();

const BookController = require("../controllers/BookController");

const verifyToken = require("../middleware/auth.middleware");

const { isAdmin, isStaffOrAdmin } = require("../middleware/role.middleware");

const upload = require("../middleware/upload.middleware");

router.use(verifyToken);

router.get("/", isStaffOrAdmin, BookController.getAllBooks);

router.get("/:id", isStaffOrAdmin, BookController.getBookById);

router.post("/", isAdmin, upload.single("image"), BookController.createBook);

router.put("/:id", isAdmin, upload.single("image"), BookController.updateBook);

router.delete("/:id", isAdmin, BookController.deleteBook);

module.exports = router;
