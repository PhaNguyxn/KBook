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
    const borrow = await BorrowService.createBorrow(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: "Tạo phiếu mượn thành công",
      data: borrow,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
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
