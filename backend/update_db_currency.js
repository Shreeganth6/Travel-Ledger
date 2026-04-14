const db = require('./config/db');

async function migrate() {
  try {
    console.log('Starting migration...');

    // 1. Add currency to Trips
    console.log('Adding currency column to Trips...');
    await db.query(`
      ALTER TABLE Trips 
      ADD COLUMN currency VARCHAR(3) DEFAULT 'INR' 
      AFTER budget
    `);

    // 2. Add paid_currency and paid_amount to Settlements
    console.log('Adding payment tracking columns to Settlements...');
    await db.query(`
      ALTER TABLE Settlements 
      ADD COLUMN paid_currency VARCHAR(3) AFTER amount,
      ADD COLUMN paid_amount DECIMAL(12,2) AFTER paid_currency
    `);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_COLUMN_NAMES') {
      console.log('Columns already exist. Skipping.');
      process.exit(0);
    }
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
