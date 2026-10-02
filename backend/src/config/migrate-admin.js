require('dotenv').config();
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Checking users table schema...');
    // Add role column if not exists
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
    `);
    console.log('✅ Column "role" ensured in users table.');

    // List all users
    const users = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
    console.log(`📋 Total registered users: ${users.rows.length}`);
    console.log(users.rows);

    // If there is any user, we can promote the first user to admin or check
    if (users.rows.length > 0) {
      const firstUser = users.rows[0];
      await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [firstUser.id]);
      console.log(`👑 Promoted user "${firstUser.name}" (${firstUser.email}) to ADMIN!`);
    }

    await pool.end();
    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
