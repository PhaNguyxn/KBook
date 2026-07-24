const express = require("express");

const BookController = require("../controllers/BookController");

const verifyToken = require("../middleware/auth.middleware");

const { isAdmin, isStaffOrAdmin } = require("../middleware/role.middleware");

const bookUpload = require("../middleware/bookUpload.middleware");

const router = express.Router();

router.use(verifyToken);

router.get("/", isStaffOrAdmin, BookController.getAllBooks);

router.get("/:id", isStaffOrAdmin, BookController.getBookById);

router.post(
  "/",
  isAdmin,
  bookUpload.single("imageFile"),
  BookController.createBook,
);

router.put(
  "/:id",
  isAdmin,
  bookUpload.single("imageFile"),
  BookController.updateBook,
);

router.delete("/:id", isAdmin, BookController.deleteBook);

module.exports = router;
