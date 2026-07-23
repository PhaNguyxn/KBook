const BorrowRequestService = require("../services/BorrowRequestService");

async function getAll(req, res) {
  try {
    const result = await BorrowRequestService.getAllBorrowRequests(req.query);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách yêu cầu thành công",
      data: result,
    });
  } catch (error) {
    console.error("Get borrow requests error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Không thể lấy danh sách yêu cầu",
    });
  }
}

async function getById(req, res) {
  try {
    const request = await BorrowRequestService.getBorrowRequestById(
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

async function create(req, res) {
  try {
    const request = await BorrowRequestService.createBorrowRequest(req.body);

    return res.status(201).json({
      success: true,
      message: "Tạo yêu cầu mượn sách thành công",
      data: request,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function approve(req, res) {
  try {
    const request = await BorrowRequestService.approveBorrowRequest(
      req.params.id,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      message: "Duyệt yêu cầu mượn sách thành công",
      data: request,
    });
  } catch (error) {
    console.error("Approve borrow request error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function reject(req, res) {
  try {
    const request = await BorrowRequestService.rejectBorrowRequest(
      req.params.id,
      req.user.id,
      req.body.reason,
    );

    return res.status(200).json({
      success: true,
      message: "Từ chối yêu cầu mượn sách thành công",
      data: request,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  approve,
  reject,
};
