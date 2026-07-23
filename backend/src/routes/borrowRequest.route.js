const express = require("express");

const BorrowRequestController = require("../controllers/BorrowRequestController");

const verifyToken = require("../middleware/auth.middleware");

const { isStaffOrAdmin } = require("../middleware/role.middleware");

const router = express.Router();

router.use(verifyToken);
router.use(isStaffOrAdmin);

router.get("/", BorrowRequestController.getAll);

router.get("/:id", BorrowRequestController.getById);

router.post("/", BorrowRequestController.create);

router.patch("/:id/approve", BorrowRequestController.approve);

router.patch("/:id/reject", BorrowRequestController.reject);

module.exports = router;
