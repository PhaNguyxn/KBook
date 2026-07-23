const express = require("express");

const router = express.Router();

const AuthController = require("../controllers/AuthController");

const verifyToken = require("../middleware/auth.middleware");

router.post("/login", AuthController.login);

router.get("/me", verifyToken, AuthController.getMe);

module.exports = router;
