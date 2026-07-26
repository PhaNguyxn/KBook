const express = require("express");

const BookController = require("../controllers/BookController");

const verifyToken = require("../middleware/auth.middleware");

const { isAdmin, isStaffOrAdmin } = require("../middleware/role.middleware");

const bookUpload = require("../middleware/bookUpload.middleware");

const router = express.Router();


router.get("/", BookController.getAllBooks);

router.get("/:id", BookController.getBookById);

router.use(verifyToken);
router.post(
  "/",
  isStaffOrAdmin,
  bookUpload.single("imageFile"),
  BookController.createBook,
);

router.put(
  "/:id",
  isStaffOrAdmin,
  bookUpload.single("imageFile"),
  BookController.updateBook,
);

router.delete("/:id", isStaffOrAdmin, BookController.deleteBook);

module.exports = router;
