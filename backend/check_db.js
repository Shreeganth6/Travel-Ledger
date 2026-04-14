require('dotenv').config();
const db = require('./config/db');

async function checkSchema() {
  try {
    const [rows] = await db.query('DESCRIBE Users');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error fetching schema:', error.message);
    process.exit(1);
  }
}

checkSchema();
