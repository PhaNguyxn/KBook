const express = require("express");

const BorrowRequestController = require("../controllers/BorrowRequestController");

const verifyToken = require("../middleware/auth.middleware");

const { isStaffOrAdmin } = require("../middleware/role.middleware");

const readerAuthMiddleware = require("../middleware/readerAuth.middleware");

const router = express.Router();

router.get(
  "/reader/my-requests",
  readerAuthMiddleware,
  BorrowRequestController.getMyRequests,
);

router.get(
  "/reader/my-requests/:id",
  readerAuthMiddleware,
  BorrowRequestController.getMyRequestById,
);

router.patch(
  "/reader/my-requests/:id/cancel",
  readerAuthMiddleware,
  BorrowRequestController.cancelMyRequest,
);

router.post(
  "/reader",
  readerAuthMiddleware,
  BorrowRequestController.createForReader,
);

/* =========================================
   API DÀNH CHO NHÂN VIÊN
========================================= */

router.use(verifyToken);
router.use(isStaffOrAdmin);

router.get("/", BorrowRequestController.getAll);

router.get("/:id", BorrowRequestController.getById);

router.post("/", BorrowRequestController.create);

router.patch("/:id/approve", BorrowRequestController.approve);

router.patch("/:id/reject", BorrowRequestController.reject);

module.exports = router;
