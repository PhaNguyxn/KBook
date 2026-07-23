const PublisherService = require("../services/PublisherService");

// ==================================================
// GET /api/publishers
// ==================================================
const getAllPublishers = async (req, res) => {
  try {
    const result = await PublisherService.getAllPublishers(req.query);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách nhà xuất bản thành công",
      data: result,
    });
  } catch (error) {
    console.error("Get publishers error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Không thể lấy danh sách nhà xuất bản",
    });
  }
};

// ==================================================
// GET /api/publishers/:id
// ==================================================
const getPublisherById = async (req, res) => {
  try {
    const publisher = await PublisherService.getPublisherById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin nhà xuất bản thành công",
      data: publisher,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || "Không tìm thấy nhà xuất bản",
    });
  }
};

// ==================================================
// POST /api/publishers
// ==================================================
const createPublisher = async (req, res) => {
  try {
    const publisher = await PublisherService.createPublisher(req.body);

    return res.status(201).json({
      success: true,
      message: "Thêm nhà xuất bản thành công",
      data: publisher,
    });
  } catch (error) {
    console.error("Create publisher error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Không thể thêm nhà xuất bản",
    });
  }
};

// ==================================================
// PUT /api/publishers/:id
// ==================================================
const updatePublisher = async (req, res) => {
  try {
    const publisher = await PublisherService.updatePublisher(
      req.params.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật nhà xuất bản thành công",
      data: publisher,
    });
  } catch (error) {
    console.error("Update publisher error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Không thể cập nhật nhà xuất bản",
    });
  }
};

// ==================================================
// DELETE /api/publishers/:id
// ==================================================
const deletePublisher = async (req, res) => {
  try {
    const publisher = await PublisherService.deletePublisher(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Khóa nhà xuất bản thành công",
      data: publisher,
    });
  } catch (error) {
    console.error("Delete publisher error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Không thể khóa nhà xuất bản",
    });
  }
};

module.exports = {
  getAllPublishers,
  getPublisherById,
  createPublisher,
  updatePublisher,
  deletePublisher,
};
