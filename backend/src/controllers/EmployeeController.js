const EmployeeService = require("../services/EmployeeService");

// Thêm nhân viên
const createEmployee = async (req, res) => {
  try {
    const employee = await EmployeeService.createEmployee(req.body);

    res.status(201).json({
      success: true,
      message: "Thêm nhân viên thành công",
      data: employee,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Lấy danh sách nhân viên
const getAllEmployees = async (req, res) => {
  try {
    const employees = await EmployeeService.getAllEmployees();

    res.status(200).json({
      success: true,
      message: "Lấy danh sách nhân viên thành công",
      data: employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Lấy chi tiết nhân viên
const getEmployeeById = async (req, res) => {
  try {
    const employee = await EmployeeService.getEmployeeById(req.params.id);

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Cập nhật nhân viên
const updateEmployee = async (req, res) => {
  try {
    const employee = await EmployeeService.updateEmployee(
      req.params.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật nhân viên thành công",
      data: employee,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Xóa mềm nhân viên
const deleteEmployee = async (req, res) => {
  try {
    const employee = await EmployeeService.deleteEmployee(req.params.id);

    res.status(200).json({
      success: true,
      message: "Xóa nhân viên thành công",
      data: employee,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};
