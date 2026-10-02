require('dotenv').config();
const { Pool } = require('pg');

const email = process.argv[2];

if (!email) {
  console.log('Cách dùng: npm run make-admin <email>');
  console.log('Ví dụ: npm run make-admin thanhloser03@gmail.com');
  process.exit(1);
}

async function makeAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const res = await pool.query("UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, name, email, role", [email]);
    if (res.rows.length === 0) {
      console.log(`❌ Không tìm thấy người dùng với email: ${email}`);
    } else {
      console.log(`👑 Đã thăng cấp tài khoản thành ADMIN thành công!`, res.rows[0]);
    }
    await pool.end();
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

makeAdmin();
