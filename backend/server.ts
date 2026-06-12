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

        // 1. Keyword Scan
        spamKeywords.forEach(word => {
            if (text.toLowerCase().includes(word)) {
                flagged.push(word);
                score -= 20;
            }
        });

        // 2. Personalization Check
        const hasPersonalization: boolean = /\{\{.*?\}\}/.test(text);
        if (!hasPersonalization) score -= 10;

        // 3. Hyperlink Overhead Check
        // Match standard http/https links or common web domain suffixes
        const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]+/gi;
        const matches = text.match(urlRegex);
        const linkCount = matches ? matches.length : 0;

        // Cold outreach best practice: 1 link is fine (unsub or portfolio), excess is dangerous
        if (linkCount > 1) {
            const excessiveLinksCount = linkCount - 1;
            score -= (excessiveLinksCount * 15); // Deduct 15 points per extra link
        }

        // 4. Final Safety Guardrail Constraint
        if (score < 0) {
            score = 0;
        }

        try {
            const insertQuery = `
                INSERT INTO email_scans (email_text, spam_score, has_personalization, flagged_words)
                VALUES (?, ?, ?, ?);
            `;
            await pool.execute(insertQuery, [text, score, hasPersonalization ? 1 : 0, flagged.join(', ')]);
        } catch (dbError) {
            console.error("Database logging failed:", dbError);
        }

        // Return metrics cleanly to the UI layer
        return res.json({
            score,
            hasPersonalization,
            flaggedWords: flagged,
            linkCount
        });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));