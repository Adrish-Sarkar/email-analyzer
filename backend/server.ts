import express, { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Define an interface for the API Request Body
interface AnalyzeRequestBody {
    text: string;
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDB(): Promise<void> {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS email_scans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email_text TEXT NOT NULL,
            spam_score INT NOT NULL,
            has_personalization BOOLEAN NOT NULL,
            flagged_words TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await pool.query(createTableQuery);
    console.log("MySQL Database Initialized.");
}
initDB().catch(err => console.error(err));

// Enforce types on the Request and Response
app.post('/api/analyze', async (req: Request<{}, {}, AnalyzeRequestBody>, res: Response) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "Text is required" });

        const spamKeywords: string[] = ["100% free", "make money", "guarantee", "act now", "risk-free", "click here"];
        let flagged: string[] = [];
        let score: number = 100;

        spamKeywords.forEach(word => {
            if (text.toLowerCase().includes(word)) {
                flagged.push(word);
                score -= 20;
            }
        });

        const hasPersonalization: boolean = /\{\{.*?\}\}/.test(text);
        if (!hasPersonalization) score -= 10;

        if (score < 0) {
            score = 0;
        }

        const insertQuery = `
            INSERT INTO email_scans (email_text, spam_score, has_personalization, flagged_words)
            VALUES (?, ?, ?, ?);
        `;
        await pool.execute(insertQuery, [text, score, hasPersonalization ? 1 : 0, flagged.join(', ')]);

        return res.json({ score, hasPersonalization, flaggedWords: flagged });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));