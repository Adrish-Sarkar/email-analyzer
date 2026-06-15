export interface AnalysisResults {
  score: number;
  hasPersonalization: boolean;
  flaggedWords: string[];
  linkCount: number;
  hasExcessiveCaps: boolean;
}

