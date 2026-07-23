const DashboardService = require("../services/DashboardService");

async function getDashboard(req, res) {
  try {
    const data = await DashboardService.getDashboardData();

    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu tổng quan thành công",
      data,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Không thể tải dữ liệu tổng quan",
    });
  }
}

module.exports = {
  getDashboard,
};
