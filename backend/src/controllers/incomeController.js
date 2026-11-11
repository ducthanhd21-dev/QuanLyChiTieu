const IncomeModel = require('../models/incomeModel');

const incomeController = {
  // GET /api/income?month=YYYY-MM
  async getByMonth(req, res) {
    try {
      const userId = req.user.id;
      const month = req.query.month;
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ success: false, message: 'Tháng không hợp lệ. Dùng định dạng YYYY-MM.' });
      }
      const entries = await IncomeModel.getByMonth(userId, month);
      const total = await IncomeModel.getTotalByMonth(userId, month);
      res.json({ success: true, data: { entries, total } });
    } catch (err) {
      console.error('getByMonth error:', err);
      res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
  },

  // POST /api/income
  async create(req, res) {
    try {
      const userId = req.user.id;
      const { date, amount, note } = req.body;
      if (!date || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Ngày và số tiền là bắt buộc.' });
      }
      const entry = await IncomeModel.create(userId, date, parseFloat(amount), note);
      res.status(201).json({ success: true, data: entry });
    } catch (err) {
      console.error('create income error:', err);
      res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
  },

  // PUT /api/income/:id
  async update(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { date, amount, note } = req.body;
      if (!date || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Ngày và số tiền là bắt buộc.' });
      }
      const entry = await IncomeModel.update(id, userId, date, parseFloat(amount), note);
      if (!entry) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });
      res.json({ success: true, data: entry });
    } catch (err) {
      console.error('update income error:', err);
      res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
  },

  // DELETE /api/income/:id
  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const deleted = await IncomeModel.delete(id, userId);
      if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });
      res.json({ success: true, message: 'Đã xóa.' });
    } catch (err) {
      console.error('delete income error:', err);
      res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
  },

  // GET /api/income/monthly
  async getMonthly(req, res) {
    try {
      const userId = req.user.id;
      const rows = await IncomeModel.getMonthlyTotals(userId);
      res.json({ success: true, data: rows });
    } catch (err) {
      console.error('getMonthly income error:', err);
      res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
  },
};

module.exports = incomeController;
