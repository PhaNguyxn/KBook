const express = require("express");

const router = express.Router();

const BorrowController = require("../controllers/BorrowController");

const verifyToken = require("../middleware/auth.middleware");

const { isStaffOrAdmin } = require("../middleware/role.middleware");

router.use(verifyToken);
router.use(isStaffOrAdmin);

router.get("/", BorrowController.getAllBorrows);

router.get("/:id", BorrowController.getBorrowById);

router.post("/", BorrowController.createBorrow);

router.put("/:id/return", BorrowController.returnBorrow);

module.exports = router;
