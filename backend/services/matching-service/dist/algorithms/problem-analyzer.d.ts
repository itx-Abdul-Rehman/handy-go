export interface ProblemAnalysisResult {
    detectedServices: string[];
    confidence: number;
    suggestedQuestions: string[];
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    matchedKeywords: string[];
    matchedPatterns: string[];
}
/**
 * Analyze problem description to detect services and urgency
 */
export declare const analyzeProblem: (problemDescription: string, providedCategory?: string) => ProblemAnalysisResult;
declare const _default: {
    analyzeProblem: (problemDescription: string, providedCategory?: string) => ProblemAnalysisResult;
};
export default _default;
//# sourceMappingURL=problem-analyzer.d.ts.map