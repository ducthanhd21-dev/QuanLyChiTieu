const { pool } = require('../config/database');

const ExpenseModel = {
  // Get all daily expense entries for a month (newest first)
  async getByMonth(userId, month) {
    const { rows } = await pool.query(
      `SELECT id, date, amount, category, note, created_at, updated_at
       FROM daily_expenses
       WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
       ORDER BY date DESC, id DESC`,
      [userId, month]
    );
    return rows;
  },

  // Get total daily expenses for a month
  async getTotalByMonth(userId, month) {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM daily_expenses
       WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2`,
      [userId, month]
    );
    return parseFloat(rows[0].total);
  },

  // Get category breakdown for a month
  async getCategorySummary(userId, month) {
    const { rows } = await pool.query(
      `SELECT category, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
       FROM daily_expenses
       WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
       GROUP BY category
       ORDER BY total DESC`,
      [userId, month]
    );
    return rows;
  },

  // Create a new daily expense entry
  async create(userId, date, amount, category, note) {
    const { rows } = await pool.query(
      `INSERT INTO daily_expenses (user_id, date, amount, category, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, date, amount, category, note, created_at, updated_at`,
      [userId, date, amount, category || 'Ăn uống', note || null]
    );
    return rows[0];
  },

  // Update a daily expense entry
  async update(id, userId, date, amount, category, note) {
    const { rows } = await pool.query(
      `UPDATE daily_expenses
       SET date = $1, amount = $2, category = $3, note = $4, updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING id, date, amount, category, note, created_at, updated_at`,
      [date, amount, category || 'Ăn uống', note || null, id, userId]
    );
    return rows[0] || null;
  },

  // Delete a daily expense entry
  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM daily_expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  },
};

module.exports = ExpenseModel;
