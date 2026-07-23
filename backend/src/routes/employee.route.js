const express = require("express");

const router = express.Router();

const EmployeeController = require("../controllers/EmployeeController");

const verifyToken = require("../middleware/auth.middleware");

const { isAdmin } = require("../middleware/role.middleware");

router.use(verifyToken);
router.use(isAdmin);

router.get("/", EmployeeController.getAllEmployees);

router.get("/:id", EmployeeController.getEmployeeById);

router.post("/", EmployeeController.createEmployee);

router.put("/:id", EmployeeController.updateEmployee);

router.delete("/:id", EmployeeController.deleteEmployee);

module.exports = router;
