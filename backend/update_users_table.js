require('dotenv').config();
const db = require('./config/db');

async function updateTable() {
  try {
    console.log('Adding reset_otp and reset_otp_expires columns to Users table...');
    
    // Add reset_otp column
    await db.query(`
      ALTER TABLE Users 
      ADD COLUMN reset_otp VARCHAR(6) NULL,
      ADD COLUMN reset_otp_expires TIMESTAMP NULL
    `);
    
    console.log('Columns added successfully!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Columns already exist.');
      process.exit(0);
    }
    console.error('Error updating table:', error.message);
    process.exit(1);
  }
}

updateTable();
