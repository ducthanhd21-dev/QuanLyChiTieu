require('dotenv').config();
const { pool } = require('./database');

async function migrateExpenses() {
  const client = await pool.connect();
  try {
    console.log('Creating daily_expenses table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
        category VARCHAR(50) NOT NULL DEFAULT 'Ăn uống',
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON daily_expenses(user_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON daily_expenses(user_id, date);

      DROP TRIGGER IF EXISTS update_expenses_updated_at ON daily_expenses;
      CREATE TRIGGER update_expenses_updated_at
        BEFORE UPDATE ON daily_expenses
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ daily_expenses table created successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrateExpenses();
