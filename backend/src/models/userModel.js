const { pool } = require('../config/database');

const UserModel = {
  // Create a new user (default role: 'user')
  async create({ name, email, password, role = 'user' }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [name, email, password, role]
    );
    return rows[0].id;
  },

  // Find user by email (includes password and role for auth)
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  // Find user by id (without password)
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  // Find user by id including password (for password verification)
  async findByIdWithPassword(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  // Update user name
  async updateName(id, name) {
    const { rows } = await pool.query(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, created_at, updated_at',
      [name, id]
    );
    return rows[0] || null;
  },

  // Update user password
  async updatePassword(id, hashedPassword) {
    const { rowCount } = await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    );
    return rowCount > 0;
  },

  // Check if email exists
  async emailExists(email) {
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    return rows.length > 0;
  },

  // ADMIN: Get all users with summary of their bills for a selected month
  async getAllUsersForAdmin(month = null) {
    let sql = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.created_at,
        COUNT(b.id) AS total_bills_in_month,
        COALESCE(SUM(b.amount), 0) AS total_amount_in_month,
        COALESCE(SUM(CASE WHEN b.is_paid = TRUE THEN b.amount ELSE 0 END), 0) AS paid_amount_in_month,
        COALESCE(SUM(CASE WHEN b.is_paid = FALSE THEN b.amount ELSE 0 END), 0) AS unpaid_amount_in_month
      FROM users u
      LEFT JOIN bills b 
        ON u.id = b.user_id 
        ${month ? "AND TO_CHAR(b.due_date, 'YYYY-MM') = $1" : ""}
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      ORDER BY u.id ASC
    `;

    const params = month ? [month] : [];
    const { rows } = await pool.query(sql, params);
    return rows;
  },

  // ADMIN: Get detailed bills of a user
  async getUserBillsForAdmin(userId, month = null) {
    let sql = 'SELECT * FROM bills WHERE user_id = $1';
    const params = [userId];

    if (month) {
      sql += " AND TO_CHAR(due_date, 'YYYY-MM') = $2";
      params.push(month);
    }

    sql += ' ORDER BY due_date ASC, created_at DESC';
    const { rows } = await pool.query(sql, params);
    return rows;
  },
};

module.exports = UserModel;
