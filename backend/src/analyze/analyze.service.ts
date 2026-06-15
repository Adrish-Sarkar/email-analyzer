import { Injectable, OnModuleInit } from '@nestjs/common';
import { AnalysisResults } from './interfaces/analyze-results.interface';
import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AnalyzeService implements OnModuleInit {
    private pool: mysql.Pool;

    // 1. Maintain your exact spam keywords array
    private readonly spamKeywords = [
        '100%', 'free', 'money', 'act now', 'click here',
        'guarantee', 'risk-free', 'buy details', 'cash'
    ];

    onModuleInit() {
        try {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'app_user',
                password: process.env.DB_PASSWORD || 'apppassword',
                database: process.env.DB_NAME || 'email_analytics',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
        } catch (err) {
            console.error('Failed to initialize MySQL pool', err);
        }
    }

    async executeAnalysis(text: string): Promise<AnalysisResults> {
        // Edge case guardrail: handle blank or whitespace inputs
        if (!text || !text.trim()) {
            return { score: 100, hasPersonalization: false, flaggedWords: [], linkCount: 0, hasExcessiveCaps: false };
        }

        const cleanText = text.toLowerCase();

        // 2. Personalization processing (Checking for merge tags)
        const hasPersonalization = text.includes('{{') && text.includes('}}');

        // 3. Link tracking processing via your Regex logic
        const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]+/gi;
        const matches = text.match(urlRegex);
        const linkCount = matches ? matches.length : 0;

        // 4. Spam detection processing
        const flaggedWords = this.spamKeywords.filter(word => cleanText.includes(word));

        // 5. Excessive capitalisation detection
        //    Flag if >50% of alphabetic characters are uppercase (minimum 10 letters required)
        const letters = text.replace(/[^a-zA-Z]/g, '');
        const upperLetters = text.replace(/[^A-Z]/g, '');
        const hasExcessiveCaps =
            letters.length >= 10 && upperLetters.length / letters.length > 0.5;

        // 6. Deducting score safely
        let score = 100;
        score -= flaggedWords.length * 10;
        score -= linkCount * 10;
        if (!hasPersonalization) score -= 20;
        if (hasExcessiveCaps) score -= 15;

        // Boundary condition guardrail: Force a floor of 0
        if (score < 0) score = 0;

        // Write scan results to the database table if pool is ready
        if (this.pool) {
            try {
                const insertQuery = `
                    INSERT INTO email_scans (email_text, spam_score, has_personalization, flagged_words, link_count, has_excessive_caps)
                    VALUES (?, ?, ?, ?, ?, ?);
                `;
                await this.pool.execute(insertQuery, [
                    text,
                    score,
                    hasPersonalization ? 1 : 0,
                    flaggedWords.join(', '),
                    linkCount,
                    hasExcessiveCaps ? 1 : 0
                ]);
            } catch (dbError) {
                console.error("Database logging failed:", dbError);
            }
        }

        return {
            score,
            hasPersonalization,
            flaggedWords,
            linkCount,
            hasExcessiveCaps,
        };
    }
}
