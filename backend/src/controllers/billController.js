const BillModel = require('../models/billModel');

const BillController = {
  // GET /api/bills
  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const { month } = req.query; // format: YYYY-MM
      const bills = await BillModel.findByUser(userId, month || null);

      return res.status(200).json({
        success: true,
        data: bills,
      });
    } catch (error) {
      console.error('GetAll bills error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại sau.',
      });
    }
  },

  // GET /api/bills/alerts (upcoming or overdue bills)
  async getAlerts(req, res) {
    try {
      const userId = req.user.id;
      const alerts = await BillModel.getUpcomingAlerts(userId);

      return res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      console.error('GetAlerts error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy cảnh báo đến hạn.',
      });
    }
  },

  // GET /api/bills/:id
  async getOne(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const bill = await BillModel.findById(id, userId);

      if (!bill) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khoản thanh toán.',
        });
      }

      return res.status(200).json({
        success: true,
        data: bill,
      });
    } catch (error) {
      console.error('GetOne bill error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại sau.',
      });
    }
  },

  // POST /api/bills
  async create(req, res) {
    try {
      const userId = req.user.id;
      const { title, amount, due_date, category, note, is_recurring, receipt_url } = req.body;

      const billId = await BillModel.create({
        userId,
        title,
        amount,
        due_date,
        category,
        note,
        is_recurring: !!is_recurring,
        receipt_url: receipt_url || null,
      });

      const bill = await BillModel.findById(billId, userId);

      return res.status(201).json({
        success: true,
        message: 'Tạo khoản thanh toán thành công!',
        data: bill,
      });
    } catch (error) {
      console.error('Create bill error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại sau.',
      });
    }
  },

  // PUT /api/bills/:id
  async update(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { title, amount, due_date, category, note, is_recurring, receipt_url } = req.body;

      // Check bill exists and belongs to user
      const existing = await BillModel.findById(id, userId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khoản thanh toán.',
        });
      }

      await BillModel.update(id, userId, {
        title,
        amount,
        due_date,
        category,
        note,
        is_recurring: is_recurring !== undefined ? !!is_recurring : existing.is_recurring,
        receipt_url: receipt_url !== undefined ? receipt_url : existing.receipt_url,
      });

      const updated = await BillModel.findById(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thành công!',
        data: updated,
      });
    } catch (error) {
      console.error('Update bill error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại sau.',
      });
    }
  },

  // PATCH /api/bills/:id/receipt
  async updateReceipt(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { receipt_url } = req.body;

      const existing = await BillModel.findById(id, userId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khoản thanh toán.',
        });
      }

      await BillModel.updateReceipt(id, userId, receipt_url || null);
      const updated = await BillModel.findById(id, userId);

      return res.status(200).json({
        success: true,
        message: receipt_url ? 'Đã đính kèm ảnh biên lai!' : 'Đã gỡ ảnh biên lai.',
        data: updated,
      });
    } catch (error) {
      console.error('Update receipt error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật ảnh biên lai.',
      });
    }
  },

  // POST /api/bills/copy-from-month
  async copyFromMonth(req, res) {
    try {
      const userId = req.user.id;
      const { fromMonth, toMonth } = req.body;

      if (!fromMonth || !toMonth) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp fromMonth và toMonth (định dạng YYYY-MM).',
        });
      }

      const count = await BillModel.copyFromMonth(userId, fromMonth, toMonth);

      return res.status(200).json({
        success: true,
        message: `Đã sao chép thành công ${count} khoản thanh toán từ tháng ${fromMonth} sang ${toMonth}!`,
        data: { copiedCount: count },
      });
    } catch (error) {
      console.error('CopyFromMonth error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi sao chép hóa đơn.',
      });
    }
  },

  // DELETE /api/bills/:id
  async remove(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const existing = await BillModel.findById(id, userId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khoản thanh toán.',
        });
      }

      await BillModel.delete(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Xóa khoản thanh toán thành công!',
      });
    } catch (error) {
      console.error('Delete bill error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại sau.',
      });
    }
  },

  // PATCH /api/bills/:id/toggle-paid
  async togglePaid(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const existing = await BillModel.findById(id, userId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khoản thanh toán.',
        });
      }

      await BillModel.togglePaid(id, userId);
      const updated = await BillModel.findById(id, userId);

      const statusMsg = updated.is_paid
        ? 'Đã đánh dấu đã thanh toán!'
        : 'Đã bỏ đánh dấu thanh toán!';

      return res.status(200).json({
        success: true,
        message: statusMsg,
        data: updated,
      });
    } catch (error) {
      console.error('Toggle paid error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server. Vui lòng thử lại sau.',
      });
    }
  },
};

module.exports = BillController;
