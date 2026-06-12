import { Injectable } from '@nestjs/common';
import { AnalysisResults } from './interfaces/analyze-results.interface';

@Injectable()
export class AnalyzeService {
    // 1. Maintain your exact spam keywords array
    private readonly spamKeywords = [
        '100%', 'free', 'money', 'act now', 'click here',
        'guarantee', 'risk-free', 'buy details', 'cash'
    ];

    async executeAnalysis(text: string): Promise<AnalysisResults> {
        // Edge case guardrail: handle blank or whitespace inputs
        if (!text || !text.trim()) {
            return { score: 100, hasPersonalization: false, flaggedWords: [], linkCount: 0 };
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

        // 5. Deducting score safely
        let score = 100;
        score -= flaggedWords.length * 10;
        score -= linkCount * 10;
        if (!hasPersonalization) score -= 20;

        // Boundary condition guardrail: Force a floor of 0
        if (score < 0) score = 0;

        return {
            score,
            hasPersonalization,
            flaggedWords,
            linkCount,
        };
    }
}