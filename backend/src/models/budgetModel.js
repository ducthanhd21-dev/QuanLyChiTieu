const { pool } = require('../config/database');

const BudgetModel = {
  // Get budget for a specific month
  async getByMonth(userId, month) {
    const { rows } = await pool.query(
      'SELECT id, month, amount, created_at, updated_at FROM budgets WHERE user_id = $1 AND month = $2',
      [userId, month]
    );
    return rows[0] || null;
  },

  // Set or update budget for a month (UPSERT)
  async upsert(userId, month, amount) {
    const { rows } = await pool.query(
      `INSERT INTO budgets (user_id, month, amount)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, month)
       DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
       RETURNING id, month, amount, created_at, updated_at`,
      [userId, month, amount]
    );
    return rows[0];
  },

  // Delete budget for a month
  async delete(userId, month) {
    const { rowCount } = await pool.query(
      'DELETE FROM budgets WHERE user_id = $1 AND month = $2',
      [userId, month]
    );
    return rowCount > 0;
  },
};

module.exports = BudgetModel;
