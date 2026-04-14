const mysql = require('mysql2/promise');
require('dotenv').config();

const createTable = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME
        });

        console.log('Connected to database.');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Notifications (
                notification_id INT AUTO_INCREMENT PRIMARY KEY,
                trip_id         INT NOT NULL,
                user_id         INT NOT NULL,
                type            ENUM('expense_added', 'expense_deleted') NOT NULL,
                message         VARCHAR(255) NOT NULL,
                is_read         TINYINT(1) NOT NULL DEFAULT 0,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trip_id)  REFERENCES Trips(trip_id)  ON DELETE CASCADE,
                FOREIGN KEY (user_id)  REFERENCES Users(user_id)  ON DELETE CASCADE
            )
        `);

        console.log('Notifications table created successfully.');

    } catch (error) {
        console.error('Error creating Notifications table:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
};

createTable();
