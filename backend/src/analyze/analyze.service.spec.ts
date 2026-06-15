import { AnalyzeService } from './analyze.service';

describe('AnalyzeService', () => {
    let service: AnalyzeService;

    beforeEach(() => {
        service = new AnalyzeService();
    });

    // ─── Edge Cases ────────────────────────────────────────────────────────────

    it('should return a perfect score of 100 for empty input', async () => {
        const result = await service.executeAnalysis('');
        expect(result.score).toBe(100);
        expect(result.hasPersonalization).toBe(false);
        expect(result.flaggedWords).toEqual([]);
        expect(result.linkCount).toBe(0);
        expect(result.hasExcessiveCaps).toBe(false);
    });

    it('should return a perfect score of 100 for whitespace-only input', async () => {
        const result = await service.executeAnalysis('   ');
        expect(result.score).toBe(100);
    });

    // ─── Personalization ───────────────────────────────────────────────────────

    it('should detect personalization merge tags and not penalise for them', async () => {
        const result = await service.executeAnalysis('Hello {{firstName}}, welcome aboard!');
        expect(result.hasPersonalization).toBe(true);
        // No spam words, no links, has personalisation → score = 100
        expect(result.score).toBe(100);
    });

    it('should penalise 20 points when personalization tags are absent', async () => {
        const result = await service.executeAnalysis('Hello, welcome aboard!');
        expect(result.hasPersonalization).toBe(false);
        expect(result.score).toBe(80);
    });

    // ─── Spam Keywords ─────────────────────────────────────────────────────────

    it('should detect a single spam keyword and deduct 10 points', async () => {
        // No personalisation (-20), one keyword (-10) → 70
        const result = await service.executeAnalysis('Click here to claim your prize.');
        expect(result.flaggedWords).toContain('click here');
        expect(result.score).toBe(70);
    });

    it('should detect multiple spam keywords and deduct 10 points each', async () => {
        // No personalisation (-20), two keywords "free" + "cash" (-20) → 60
        const result = await service.executeAnalysis('Get free cash today!');
        expect(result.flaggedWords).toContain('free');
        expect(result.flaggedWords).toContain('cash');
        expect(result.score).toBe(60);
    });

    it('should be case-insensitive when matching spam keywords', async () => {
        const result = await service.executeAnalysis('FREE money available now.');
        expect(result.flaggedWords).toContain('free');
        expect(result.flaggedWords).toContain('money');
    });

    // ─── Link Detection ────────────────────────────────────────────────────────

    it('should detect an http URL and deduct 10 points', async () => {
        // No personalisation (-20), one link (-10) → 70
        const result = await service.executeAnalysis('Visit https://example.com for more info.');
        expect(result.linkCount).toBe(1);
        expect(result.score).toBe(70);
    });

    it('should detect a www URL and count it as a link', async () => {
        const result = await service.executeAnalysis('Go to www.example.com now.');
        expect(result.linkCount).toBe(1);
    });

    it('should count multiple links correctly', async () => {
        const result = await service.executeAnalysis(
            'Visit https://a.com and https://b.com and www.c.com'
        );
        expect(result.linkCount).toBe(3);
    });

    // ─── Excessive Caps ────────────────────────────────────────────────────────

    it('should flag excessive capitalisation when >50% of letters are uppercase', async () => {
        // "WIN A FREE PRIZE TODAY" — all caps
        const result = await service.executeAnalysis('WIN A FREE PRIZE TODAY');
        expect(result.hasExcessiveCaps).toBe(true);
    });

    it('should not flag normal sentence capitalisation', async () => {
        const result = await service.executeAnalysis('Hello, how are you doing today?');
        expect(result.hasExcessiveCaps).toBe(false);
    });

    it('should not flag excessive caps for short text under 10 letters', async () => {
        // "HI" has 2 letters — below the minimum threshold
        const result = await service.executeAnalysis('HI');
        expect(result.hasExcessiveCaps).toBe(false);
    });

    it('should deduct 15 points for excessive caps', async () => {
        // All caps, no personalisation (-20), no spam words, no links, excessive caps (-15) → 65
        const result = await service.executeAnalysis('HELLO PLEASE READ THIS EMAIL NOW');
        expect(result.hasExcessiveCaps).toBe(true);
        expect(result.score).toBe(65);
    });

    // ─── Score Floor ───────────────────────────────────────────────────────────

    it('should not let the score go below 0', async () => {
        const worstCase =
            'FREE money! Click here. 100% guarantee! Act now. Risk-free cash! ' +
            'BUY DETAILS AT https://spam.com https://spam2.com https://spam3.com ' +
            'https://spam4.com https://spam5.com';
        const result = await service.executeAnalysis(worstCase);
        expect(result.score).toBeGreaterThanOrEqual(0);
    });

    // ─── Combined Signals ──────────────────────────────────────────────────────

    it('should correctly score a clean, personalised email with no spam', async () => {
        const result = await service.executeAnalysis(
            'Hi {{firstName}}, just a friendly reminder about your upcoming appointment.'
        );
        expect(result.score).toBe(100);
        expect(result.hasPersonalization).toBe(true);
        expect(result.flaggedWords).toHaveLength(0);
        expect(result.linkCount).toBe(0);
        expect(result.hasExcessiveCaps).toBe(false);
    });

    it('should correctly score a typical spam email with all signals', async () => {
        const result = await service.executeAnalysis(
            'FREE MONEY! Click here now: https://spam.com — 100% guarantee!'
        );
        expect(result.hasPersonalization).toBe(false);
        expect(result.flaggedWords.length).toBeGreaterThan(0);
        expect(result.linkCount).toBeGreaterThan(0);
        expect(result.hasExcessiveCaps).toBe(true);
        expect(result.score).toBeLessThan(50);
    });
});
