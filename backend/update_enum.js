require('dotenv').config();
const db = require('./config/db');

async function updateEnum() {
  try {
    // Adding 'done' to the enum
    await db.query("ALTER TABLE Trips MODIFY COLUMN status ENUM('active', 'settled', 'closed', 'done') DEFAULT 'active'");
    console.log('Successfully added "done" to Trips status enum');
    process.exit(0);
  } catch (error) {
    console.error('Error updating enum:', error.message);
    process.exit(1);
  }
}

updateEnum();
