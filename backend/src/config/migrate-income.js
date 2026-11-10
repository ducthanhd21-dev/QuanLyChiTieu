require('dotenv').config();
const { pool } = require('./database');

async function migrateIncome() {
  const client = await pool.connect();
  try {
    console.log('Creating income_entries table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS income_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_income_user_id ON income_entries(user_id);
      CREATE INDEX IF NOT EXISTS idx_income_user_date ON income_entries(user_id, date);

      DROP TRIGGER IF EXISTS update_income_updated_at ON income_entries;
      CREATE TRIGGER update_income_updated_at
        BEFORE UPDATE ON income_entries
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ income_entries table created successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrateIncome();
