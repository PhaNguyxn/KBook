const BorrowService = require("../services/BorrowService");

// Lấy danh sách phiếu mượn
const getAllBorrows = async (req, res) => {
  try {

    const result = await BorrowService.getAllBorrows(req.query);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách phiếu mượn thành công",
      data: result,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// Lấy chi tiết phiếu mượn
const getBorrowById = async (req, res) => {
  try {
    const borrow = await BorrowService.getBorrowById(req.params.id);

    res.status(200).json({
      success: true,
      data: borrow,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Tạo phiếu mượn
const createBorrow = async (req, res) => {
  try {
    const employeeId =
      req.user?._id || req.user?.id || req.employee?._id || req.employee?.id;

    console.log("Create borrow body:", JSON.stringify(req.body, null, 2));

    console.log("Create borrow employee:", employeeId);

    const result = await BorrowService.createBorrow(req.body, employeeId);

    return res.status(201).json({
      success: true,
      message: "Lập phiếu mượn thành công",
      data: result,
    });
  } catch (error) {
    console.error("Create borrow error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Không thể lập phiếu mượn",
    });
  }
};

// Trả sách
const returnBorrow = async (req, res) => {
  try {
    const borrow = await BorrowService.returnBorrow(req.params.id);

    res.status(200).json({
      success: true,
      message: "Trả sách thành công",
      data: borrow,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllBorrows,
  getBorrowById,
  createBorrow,
  returnBorrow,
};
