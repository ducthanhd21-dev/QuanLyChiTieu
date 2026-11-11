const { pool } = require('../config/database');

const IncomeModel = {
  // Get all income entries for a month
  async getByMonth(userId, month) {
    const { rows } = await pool.query(
      `SELECT id, date, amount, note, created_at, updated_at
       FROM income_entries
       WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
       ORDER BY date ASC`,
      [userId, month]
    );
    return rows;
  },

  // Get total income for a month
  async getTotalByMonth(userId, month) {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM income_entries
       WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2`,
      [userId, month]
    );
    return parseFloat(rows[0].total);
  },

  // Create a new income entry
  async create(userId, date, amount, note) {
    const { rows } = await pool.query(
      `INSERT INTO income_entries (user_id, date, amount, note)
       VALUES ($1, $2, $3, $4)
       RETURNING id, date, amount, note, created_at, updated_at`,
      [userId, date, amount, note || null]
    );
    return rows[0];
  },

  // Update an income entry
  async update(id, userId, date, amount, note) {
    const { rows } = await pool.query(
      `UPDATE income_entries
       SET date = $1, amount = $2, note = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING id, date, amount, note, created_at, updated_at`,
      [date, amount, note || null, id, userId]
    );
    return rows[0] || null;
  },

  // Delete an income entry
  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM income_entries WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  },

  // Get monthly income totals (last 12 recorded months)
  async getMonthlyTotals(userId) {
    const { rows } = await pool.query(
      `SELECT
         TO_CHAR(date, 'YYYY-MM') AS month,
         COALESCE(SUM(amount), 0) AS total_income
       FROM income_entries
       WHERE user_id = $1
       GROUP BY TO_CHAR(date, 'YYYY-MM')
       ORDER BY month DESC
       LIMIT 12`,
      [userId]
    );
    return rows;
  },
};

module.exports = IncomeModel;
