const ReaderService = require("../services/ReaderService");

// Lấy danh sách độc giả
const getAllReaders = async (req, res) => {
  try {
    const result = await ReaderService.getAllReaders(req.query);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách độc giả thành công",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Lấy thông tin độc giả theo ID
const getReaderById = async (req, res) => {
  try {
    const reader = await ReaderService.getReaderById(req.params.id);

    res.status(200).json({
      success: true,
      data: reader,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Thêm độc giả
const createReader = async (req, res) => {
  try {
    const reader = await ReaderService.createReader(req.body);

    res.status(201).json({
      success: true,
      message: "Thêm độc giả thành công",
      data: reader,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Cập nhật độc giả
const updateReader = async (req, res) => {
  try {
    const reader = await ReaderService.updateReader(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Cập nhật độc giả thành công",
      data: reader,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Xóa độc giả 
const deleteReader = async (req, res) => {
  try {
    const reader = await ReaderService.deleteReader(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Xóa độc giả thành công",
      data: reader,
    });
  } catch (error) {
    console.error("Delete reader error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Không thể xóa độc giả",
    });
  }
};

module.exports = {
  getAllReaders,
  getReaderById,
  createReader,
  updateReader,
  deleteReader,
};
