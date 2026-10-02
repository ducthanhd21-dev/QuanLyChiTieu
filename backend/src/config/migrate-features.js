require('dotenv').config();
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Running database upgrades for new features...');

    // 1. Add is_recurring and receipt_url to bills table
    await pool.query(`
      ALTER TABLE bills 
      ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS receipt_url TEXT;
    `);
    console.log('✅ bills table updated: added is_recurring, receipt_url');

    // 2. Create budgets table for monthly budget management
    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        month VARCHAR(7) NOT NULL, -- format: YYYY-MM
        amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, month)
      );

      CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
    `);
    console.log('✅ budgets table created successfully');

    // 3. Add trigger for budgets table updated_at
    await pool.query(`
      DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
      CREATE TRIGGER update_budgets_updated_at
        BEFORE UPDATE ON budgets
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ budgets trigger created');

    await pool.end();
    console.log('🎉 All database feature upgrades applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
