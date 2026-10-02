const BillModel = require('../models/billModel');

const DashboardController = {
  // GET /api/dashboard/summary?month=2026-10
  async getSummary(req, res) {
    try {
      const userId = req.user.id;
      const { month } = req.query;

      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
          success: false,
          message: 'Tham số month không hợp lệ. Dùng định dạng YYYY-MM.',
        });
      }

      const summary = await BillModel.getMonthlySummary(userId, month);
      const bills = await BillModel.findByUser(userId, month);

      const totalAmount = parseFloat(summary.total_amount) || 0;
      const paidAmount = parseFloat(summary.paid_amount) || 0;
      const unpaidAmount = parseFloat(summary.unpaid_amount) || 0;
      const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

      return res.status(200).json({
        success: true,
        data: {
          month,
          totalBills: parseInt(summary.total_bills) || 0,
          paidCount: parseInt(summary.paid_count) || 0,
          unpaidCount: parseInt(summary.unpaid_count) || 0,
          totalAmount,
          paidAmount,
          unpaidAmount,
          progress: Math.round(progress * 10) / 10,
          bills,
        },
      });
    } catch (error) {
      console.error('Dashboard summary error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại sau.',
      });
    }
  },
};

module.exports = DashboardController;
