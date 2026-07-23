const express = require("express");

const router = express.Router();

const DashboardController = require("../controllers/DashboardController");

const verifyToken = require("../middleware/auth.middleware");

const { isStaffOrAdmin } = require("../middleware/role.middleware");

router.get("/", verifyToken, isStaffOrAdmin, DashboardController.getDashboard);

module.exports = router;
