const EmployeeService = require("../services/EmployeeService");

const getAllEmployees = async (req, res) => {
  try {
    const result = await EmployeeService.getAllEmployees(req.query);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách nhân viên thành công",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể lấy danh sách nhân viên",
    });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const employee = await EmployeeService.getEmployeeById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin nhân viên thành công",
      data: employee,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const createEmployee = async (req, res) => {
  try {
    const employee = await EmployeeService.createEmployee(req.body);

    return res.status(201).json({
      success: true,
      message: "Thêm nhân viên thành công",
      data: employee,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    /*
     * Không cho người dùng tự khóa mình.
     */
    if (
      req.params.id === req.user.id &&
      (req.body.status === false || req.body.status === "false")
    ) {
      return res.status(400).json({
        success: false,
        message: "Bạn không thể tự khóa tài khoản của mình",
      });
    }

    /*
     * Không cho admin tự hạ quyền.
     */
    if (req.params.id === req.user.id && req.body.role === "staff") {
      return res.status(400).json({
        success: false,
        message: "Bạn không thể tự hạ quyền của mình",
      });
    }

    const employee = await EmployeeService.updateEmployee(
      req.params.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật nhân viên thành công",
      data: employee,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const currentEmployeeId =
      req.user?._id || req.user?.id || req.employee?._id || req.employee?.id;

    const employee = await EmployeeService.deleteEmployee(
      req.params.id,
      currentEmployeeId,
    );

    return res.status(200).json({
      success: true,
      message: "Xóa nhân viên thành công",
      data: employee,
    });
  } catch (error) {
    console.error("Delete employee error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Không thể xóa nhân viên",
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
