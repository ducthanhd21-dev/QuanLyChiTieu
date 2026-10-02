const BudgetModel = require('../models/budgetModel');

const BudgetController = {
  // GET /api/budget?month=YYYY-MM
  async getBudget(req, res) {
    try {
      const userId = req.user.id;
      const { month } = req.query;

      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp tham số month định dạng YYYY-MM.',
        });
      }

      const budget = await BudgetModel.getByMonth(userId, month);

      return res.status(200).json({
        success: true,
        data: budget ? {
          month: budget.month,
          amount: parseFloat(budget.amount),
        } : null,
      });
    } catch (error) {
      console.error('getBudget error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy hạn mức ngân sách.',
      });
    }
  },

  // POST /api/budget
  async setBudget(req, res) {
    try {
      const userId = req.user.id;
      const { month, amount } = req.body;

      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp tham số month định dạng YYYY-MM.',
        });
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Số tiền ngân sách phải là số dương.',
        });
      }

      const budget = await BudgetModel.upsert(userId, month, parsedAmount);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật hạn mức ngân sách thành công!',
        data: {
          month: budget.month,
          amount: parseFloat(budget.amount),
        },
      });
    } catch (error) {
      console.error('setBudget error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lưu hạn mức ngân sách.',
      });
    }
  },

  // DELETE /api/budget
  async removeBudget(req, res) {
    try {
      const userId = req.user.id;
      const { month } = req.query;

      await BudgetModel.delete(userId, month);

      return res.status(200).json({
        success: true,
        message: 'Đã xóa hạn mức ngân sách.',
      });
    } catch (error) {
      console.error('removeBudget error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa hạn mức ngân sách.',
      });
    }
  },
};

module.exports = BudgetController;
