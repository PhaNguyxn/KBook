const DashboardService = require("../services/DashboardService");

// Dashboard tổng quan
const getDashboard = async (req, res) => {
  try {
    const dashboard = await DashboardService.getDashboard();

    res.status(200).json({
      success: true,
      message: "Lấy thống kê thành công",
      data: dashboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboard,
};
