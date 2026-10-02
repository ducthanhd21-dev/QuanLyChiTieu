const BillModel = require('../models/billModel');

const StatsController = {
  // GET /api/stats/monthly
  async getMonthly(req, res) {
    try {
      const userId = req.user.id;
      const data = await BillModel.getMonthlyStats(userId);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Monthly stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại sau.',
      });
    }
  },

  // GET /api/stats/category?month=YYYY-MM
  async getByCategory(req, res) {
    try {
      const userId = req.user.id;
      const { month } = req.query;

      const data = await BillModel.getCategoryStats(userId, month || null);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Category stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại sau.',
      });
    }
  },
};

module.exports = StatsController;
