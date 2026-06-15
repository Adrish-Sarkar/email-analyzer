import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
    console.log('Starting database migrations...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS email_scans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email_text TEXT NOT NULL,
                spam_score INT NOT NULL,
                has_personalization BOOLEAN NOT NULL,
                flagged_words TEXT,
                link_count INT NOT NULL DEFAULT 0,
                has_excessive_caps BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await connection.query(createTableQuery);
        console.log("Migration successful: Table 'email_scans' is ready.");
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigration();
