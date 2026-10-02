const UserModel = require('../models/userModel');

const AdminController = {
  // GET /api/admin/users?month=YYYY-MM
  async getUsersWithBills(req, res) {
    try {
      const { month } = req.query; // format: YYYY-MM
      const users = await UserModel.getAllUsersForAdmin(month || null);

      // Compute system-wide totals
      const totalUsers = users.length;
      let totalSystemBills = 0;
      let totalSystemAmount = 0;
      let totalSystemPaid = 0;
      let totalSystemUnpaid = 0;

      const formattedUsers = users.map((u) => {
        const totalBills = parseInt(u.total_bills_in_month) || 0;
        const totalAmount = parseFloat(u.total_amount_in_month) || 0;
        const paidAmount = parseFloat(u.paid_amount_in_month) || 0;
        const unpaidAmount = parseFloat(u.unpaid_amount_in_month) || 0;

        totalSystemBills += totalBills;
        totalSystemAmount += totalAmount;
        totalSystemPaid += paidAmount;
        totalSystemUnpaid += unpaidAmount;

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.created_at,
          monthlySummary: {
            totalBills,
            totalAmount,
            paidAmount,
            unpaidAmount,
          },
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          month: month || 'all',
          totalUsers,
          totalSystemBills,
          totalSystemAmount,
          totalSystemPaid,
          totalSystemUnpaid,
          users: formattedUsers,
        },
      });
    } catch (error) {
      console.error('Admin getUsersWithBills error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy dữ liệu quản trị.',
      });
    }
  },

  // GET /api/admin/users/:userId/bills?month=YYYY-MM
  async getUserBills(req, res) {
    try {
      const { userId } = req.params;
      const { month } = req.query;

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng.',
        });
      }

      const bills = await UserModel.getUserBillsForAdmin(userId, month || null);

      return res.status(200).json({
        success: true,
        data: {
          user,
          month: month || 'all',
          bills,
        },
      });
    } catch (error) {
      console.error('Admin getUserBills error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy chi tiết hóa đơn người dùng.',
      });
    }
  },
};

module.exports = AdminController;
