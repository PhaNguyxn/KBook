const PublisherService = require("../services/PublisherService");

// GET ALL
const getAllPublishers = async (req, res) => {
  try {
    const publishers = await PublisherService.getAllPublishers();

    res.status(200).json({
      success: true,
      message: "Lấy danh sách nhà xuất bản thành công",
      data: publishers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET BY ID
const getPublisherById = async (req, res) => {
  try {
    const publisher = await PublisherService.getPublisherById(req.params.id);

    res.status(200).json({
      success: true,
      data: publisher,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// CREATE
const createPublisher = async (req, res) => {
  try {
    const publisher = await PublisherService.createPublisher(req.body);

    res.status(201).json({
      success: true,
      message: "Thêm nhà xuất bản thành công",
      data: publisher,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE
const updatePublisher = async (req, res) => {
  try {
    const publisher = await PublisherService.updatePublisher(
      req.params.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật nhà xuất bản thành công",
      data: publisher,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE
const deletePublisher = async (req, res) => {
  try {
    await PublisherService.deletePublisher(req.params.id);

    res.status(200).json({
      success: true,
      message: "Xóa nhà xuất bản thành công",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
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
