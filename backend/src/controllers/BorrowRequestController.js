const BorrowRequestService = require("../services/BorrowRequestService");

/* =========================================
   API DÀNH CHO NHÂN VIÊN
========================================= */

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
      message: error.message || "Không tìm thấy yêu cầu mượn",
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
      message: error.message || "Không thể tạo yêu cầu mượn sách",
    });
  }
}

async function approve(req, res) {
  try {
    const employeeId = req.user?.id || req.user?._id || req.user?.employeeId;

    const request = await BorrowRequestService.approveBorrowRequest(
      req.params.id,
      employeeId,
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
      message: error.message || "Không thể duyệt yêu cầu mượn sách",
    });
  }
}

async function reject(req, res) {
  try {
    const employeeId = req.user?.id || req.user?._id || req.user?.employeeId;

    const request = await BorrowRequestService.rejectBorrowRequest(
      req.params.id,
      employeeId,
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
      message: error.message || "Không thể từ chối yêu cầu mượn sách",
    });
  }
}

/* =========================================
   API DÀNH CHO ĐỘC GIẢ
========================================= */

async function createForReader(req, res) {
  try {
    const payload = {
      ...req.body,
      readerId: req.readerId.toString(),
    };

    delete payload.reader;
    delete payload.readerCode;

    const request = await BorrowRequestService.createBorrowRequest(payload);

    return res.status(201).json({
      success: true,
      message: "Gửi yêu cầu mượn sách thành công",
      data: request,
    });
  } catch (error) {
    console.error("Create reader borrow request error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Không thể gửi yêu cầu mượn sách",
    });
  }
}

async function getMyRequests(req, res) {
  try {
    const result = await BorrowRequestService.getMyBorrowRequests(
      req.readerId,
      req.query,
    );

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách yêu cầu mượn thành công",
      data: result,
    });
  } catch (error) {
    console.error("Get reader borrow requests error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Không thể lấy danh sách yêu cầu mượn",
    });
  }
}

async function getMyRequestById(req, res) {
  try {
    const request = await BorrowRequestService.getMyBorrowRequestById(
      req.readerId,
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || "Không tìm thấy yêu cầu mượn",
    });
  }
}

async function cancelMyRequest(req, res) {
  try {
    const request = await BorrowRequestService.cancelMyBorrowRequest(
      req.readerId,
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      message: "Hủy yêu cầu mượn thành công",
      data: request,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Không thể hủy yêu cầu mượn",
    });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  approve,
  reject,

  createForReader,
  getMyRequests,
  getMyRequestById,
  cancelMyRequest,
};
