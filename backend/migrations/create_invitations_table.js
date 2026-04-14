const mysql = require('mysql2/promise');
require('dotenv').config();

const createTable = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME
        });

        console.log('Connected to database.');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Trip_Invitations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trip_id INT NOT NULL,
                email VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trip_id) REFERENCES Trips(trip_id) ON DELETE CASCADE
            )
        `);

        console.log('Trip_Invitations table created successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error creating table:', error);
    }
};

createTable();
