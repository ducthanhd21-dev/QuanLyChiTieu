const ExpenseModel = require('../models/expenseModel');

const expenseController = {
  // GET /api/expenses?month=YYYY-MM
  async getByMonth(req, res) {
    try {
      const userId = req.user.id;
      const month = req.query.month;
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ success: false, message: 'Tháng không hợp lệ. Dùng định dạng YYYY-MM.' });
      }
      const [entries, total, byCategory] = await Promise.all([
        ExpenseModel.getByMonth(userId, month),
        ExpenseModel.getTotalByMonth(userId, month),
        ExpenseModel.getCategorySummary(userId, month),
      ]);
      res.json({ success: true, data: { entries, total, byCategory } });
    } catch (err) {
      console.error('getByMonth expense error:', err);
      res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
  },

  // POST /api/expenses
  async create(req, res) {
    try {
      const userId = req.user.id;
      const { date, amount, category, note } = req.body;
      if (!date || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Ngày và số tiền hợp lệ là bắt buộc.' });
      }
      const entry = await ExpenseModel.create(userId, date, parseFloat(amount), category, note);
      res.status(201).json({ success: true, data: entry });
    } catch (err) {
      console.error('create expense error:', err);
      res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
  },

  // PUT /api/expenses/:id
  async update(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { date, amount, category, note } = req.body;
      if (!date || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Ngày và số tiền hợp lệ là bắt buộc.' });
      }
      const entry = await ExpenseModel.update(id, userId, date, parseFloat(amount), category, note);
      if (!entry) return res.status(404).json({ success: false, message: 'Không tìm thấy khoản chi tiêu.' });
      res.json({ success: true, data: entry });
    } catch (err) {
      console.error('update expense error:', err);
      res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
  },

  // DELETE /api/expenses/:id
  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const deleted = await ExpenseModel.delete(id, userId);
      if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy khoản chi tiêu.' });
      res.json({ success: true, message: 'Đã xóa khoản chi tiêu.' });
    } catch (err) {
      console.error('delete expense error:', err);
      res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
  },
};

module.exports = expenseController;
