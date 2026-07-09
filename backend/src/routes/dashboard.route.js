const express = require("express");

const router = express.Router();

const DashboardController = require("../controllers/DashboardController");

const verifyToken = require("../middleware/auth.middleware");

router.get("/", verifyToken, DashboardController.getDashboard);

module.exports = router;
