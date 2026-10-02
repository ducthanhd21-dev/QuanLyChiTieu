const { pool } = require('../config/database');

const BillModel = {
  // Get all bills for a user (with optional month filter)
  async findByUser(userId, month = null) {
    let sql = 'SELECT * FROM bills WHERE user_id = $1';
    const params = [userId];

    if (month) {
      // month format: YYYY-MM  →  PostgreSQL: TO_CHAR
      sql += ` AND TO_CHAR(due_date, 'YYYY-MM') = $2`;
      params.push(month);
    }

    sql += ' ORDER BY due_date ASC, created_at DESC';
    const { rows } = await pool.query(sql, params);
    return rows;
  },

  // Get a single bill by id (must belong to user)
  async findById(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM bills WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0] || null;
  },

  // Create a bill — RETURNING to get the new id
  async create({ userId, title, amount, due_date, category, note, is_recurring = false, receipt_url = null }) {
    const { rows } = await pool.query(
      `INSERT INTO bills (user_id, title, amount, due_date, category, note, is_paid, is_recurring, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7, $8)
       RETURNING id`,
      [userId, title, amount, due_date, category || 'Hóa đơn', note || null, is_recurring, receipt_url]
    );
    return rows[0].id;
  },

  // Update a bill
  async update(id, userId, { title, amount, due_date, category, note, is_recurring, receipt_url }) {
    const { rowCount } = await pool.query(
      `UPDATE bills
       SET title = $1, amount = $2, due_date = $3, category = $4, note = $5,
           is_recurring = COALESCE($6, is_recurring),
           receipt_url = COALESCE($7, receipt_url)
       WHERE id = $8 AND user_id = $9`,
      [title, amount, due_date, category || 'Hóa đơn', note || null, is_recurring, receipt_url, id, userId]
    );
    return rowCount > 0;
  },

  // Attach or remove receipt
  async updateReceipt(id, userId, receiptUrl) {
    const { rowCount } = await pool.query(
      'UPDATE bills SET receipt_url = $1 WHERE id = $2 AND user_id = $3',
      [receiptUrl, id, userId]
    );
    return rowCount > 0;
  },

  // Delete a bill
  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM bills WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  },

  // Toggle paid status — PostgreSQL uses NOT is_paid
  async togglePaid(id, userId) {
    const { rowCount } = await pool.query(
      'UPDATE bills SET is_paid = NOT is_paid WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  },

  // Copy bills from a previous month into a target month
  async copyFromMonth(userId, fromMonth, toMonth) {
    // 1. Get bills from fromMonth
    const { rows: sourceBills } = await pool.query(
      `SELECT title, amount, due_date, category, note, is_recurring
       FROM bills
       WHERE user_id = $1 AND TO_CHAR(due_date, 'YYYY-MM') = $2`,
      [userId, fromMonth]
    );

    if (sourceBills.length === 0) {
      return 0;
    }

    const [targetYear, targetMonth] = toMonth.split('-').map(Number);
    // Find number of days in target month
    const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();

    let copiedCount = 0;
    for (const b of sourceBills) {
      // Keep day of month, capped at days in target month
      const sourceDate = new Date(b.due_date);
      const day = Math.min(sourceDate.getDate(), daysInTargetMonth);
      const newDueDate = `${toMonth}-${String(day).padStart(2, '0')}`;

      await pool.query(
        `INSERT INTO bills (user_id, title, amount, due_date, category, note, is_paid, is_recurring)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7)`,
        [userId, b.title, b.amount, newDueDate, b.category, b.note, b.is_recurring]
      );
      copiedCount++;
    }

    return copiedCount;
  },

  // Get upcoming alerts (unpaid bills due within 3 days or already overdue)
  async getUpcomingAlerts(userId) {
    const { rows } = await pool.query(
      `SELECT id, title, amount, due_date, category, is_paid,
              (due_date - CURRENT_DATE) AS days_remaining
       FROM bills
       WHERE user_id = $1 
         AND is_paid = FALSE 
         AND due_date <= (CURRENT_DATE + INTERVAL '3 days')
       ORDER BY due_date ASC`,
      [userId]
    );
    return rows;
  },

  // Dashboard summary for a specific month
  async getMonthlySummary(userId, month) {
    const { rows } = await pool.query(
      `SELECT
        COUNT(*) AS total_bills,
        COALESCE(SUM(amount), 0) AS total_amount,
        COALESCE(SUM(CASE WHEN is_paid = TRUE THEN amount ELSE 0 END), 0) AS paid_amount,
        COALESCE(SUM(CASE WHEN is_paid = FALSE THEN amount ELSE 0 END), 0) AS unpaid_amount,
        COUNT(CASE WHEN is_paid = TRUE THEN 1 END) AS paid_count,
        COUNT(CASE WHEN is_paid = FALSE THEN 1 END) AS unpaid_count
       FROM bills
       WHERE user_id = $1 AND TO_CHAR(due_date, 'YYYY-MM') = $2`,
      [userId, month]
    );
    return rows[0];
  },

  // Statistics: monthly totals (last 12 months)
  async getMonthlyStats(userId) {
    const { rows } = await pool.query(
      `SELECT
        TO_CHAR(due_date, 'YYYY-MM') AS month,
        COALESCE(SUM(amount), 0) AS total_amount,
        COALESCE(SUM(CASE WHEN is_paid = TRUE THEN amount ELSE 0 END), 0) AS paid_amount,
        COALESCE(SUM(CASE WHEN is_paid = FALSE THEN amount ELSE 0 END), 0) AS unpaid_amount,
        COUNT(*) AS total_bills
       FROM bills
       WHERE user_id = $1
       GROUP BY TO_CHAR(due_date, 'YYYY-MM')
       ORDER BY month DESC
       LIMIT 12`,
      [userId]
    );
    return rows;
  },

  // Statistics: by category
  async getCategoryStats(userId, month = null) {
    let sql = `SELECT
        category,
        COUNT(*) AS total_bills,
        COALESCE(SUM(amount), 0) AS total_amount,
        COUNT(CASE WHEN is_paid = TRUE THEN 1 END) AS paid_count
       FROM bills WHERE user_id = $1`;
    const params = [userId];

    if (month) {
      sql += ` AND TO_CHAR(due_date, 'YYYY-MM') = $2`;
      params.push(month);
    }

    sql += ' GROUP BY category ORDER BY total_amount DESC';
    const { rows } = await pool.query(sql, params);
    return rows;
  },
};

module.exports = BillModel;
