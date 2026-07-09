const express = require("express");

const router = express.Router();

const BorrowController = require("../controllers/BorrowController");

const verifyToken = require("../middleware/auth.middleware");

router.get("/", verifyToken, BorrowController.getAllBorrows);

router.get("/:id", verifyToken, BorrowController.getBorrowById);

router.post("/", verifyToken, BorrowController.createBorrow);

router.put("/:id/return", verifyToken, BorrowController.returnBorrow);

module.exports = router;
