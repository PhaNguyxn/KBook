const express = require("express");

const router = express.Router();

const EmployeeController = require("../controllers/EmployeeController");

const verifyToken = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/role.middleware");

// Lấy danh sách
router.get("/", verifyToken, isAdmin, EmployeeController.getAllEmployees);

// Lấy chi tiết
router.get("/:id", verifyToken, isAdmin, EmployeeController.getEmployeeById);

// Thêm
router.post("/", verifyToken, isAdmin, EmployeeController.createEmployee);

// Cập nhật
router.put("/:id", verifyToken, isAdmin, EmployeeController.updateEmployee);

// Xóa mềm
router.delete("/:id", verifyToken, isAdmin, EmployeeController.deleteEmployee);

module.exports = router;
