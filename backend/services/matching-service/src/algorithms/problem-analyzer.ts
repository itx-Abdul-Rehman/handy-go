import { SERVICE_CATEGORIES, ServiceCategory } from '@handy-go/shared';
import serviceKeywords from '../data/service-keywords.json' with { type: 'json' };

export interface ProblemAnalysisResult {
  detectedServices: string[];
  confidence: number;
  suggestedQuestions: string[];
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  matchedKeywords: string[];
  matchedPatterns: string[];
}

interface ServiceKeywordData {
  keywords: string[];
  patterns: string[];
  urgencyIndicators: {
    high: string[];
    medium: string[];
    low: string[];
  };
}

type ServiceKeywordsType = {
  [key: string]: ServiceKeywordData;
};

const typedServiceKeywords = serviceKeywords as ServiceKeywordsType;

/**
 * Analyze problem description to detect services and urgency
 */
export const analyzeProblem = (
  problemDescription: string,
  providedCategory?: string
): ProblemAnalysisResult => {
  const text = problemDescription.toLowerCase().trim();
  const words = text.split(/\s+/);

  const categoryScores: Map<string, { score: number; keywords: string[]; patterns: string[] }> = new Map();

  // Initialize scores for all categories
  SERVICE_CATEGORIES.forEach(category => {
    categoryScores.set(category, { score: 0, keywords: [], patterns: [] });
  });

  // If a category is provided, give it a boost
  if (providedCategory && SERVICE_CATEGORIES.includes(providedCategory as ServiceCategory)) {
    const current = categoryScores.get(providedCategory)!;
    current.score += 5;
    categoryScores.set(providedCategory, current);
  }

  // Score each category based on keyword matches
  SERVICE_CATEGORIES.forEach(category => {
    const data = typedServiceKeywords[category];
    if (!data) return;

    const current = categoryScores.get(category)!;

    // Check keywords
    data.keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (text.includes(keywordLower)) {
        current.score += 2;
        current.keywords.push(keyword);
      }
    });

    // Check patterns (higher weight)
    data.patterns.forEach(pattern => {
      const patternLower = pattern.toLowerCase();
      if (text.includes(patternLower)) {
        current.score += 4;
        current.patterns.push(pattern);
      }
    });

    categoryScores.set(category, current);
  });

  // Sort categories by score
  const sortedCategories = Array.from(categoryScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .filter(([_, data]) => data.score > 0);

  // Determine detected services
  const topCategory = sortedCategories[0];
  const detectedServices: string[] = [];
  let matchedKeywords: string[] = [];
  let matchedPatterns: string[] = [];

  if (topCategory && topCategory[1].score >= 2) {
    detectedServices.push(topCategory[0]);
    matchedKeywords = topCategory[1].keywords;
    matchedPatterns = topCategory[1].patterns;

    // Add secondary services if score is close
    sortedCategories.slice(1, 3).forEach(([category, data]) => {
      if (data.score >= topCategory[1].score * 0.5 && data.score >= 2) {
        detectedServices.push(category);
        matchedKeywords = [...matchedKeywords, ...data.keywords];
        matchedPatterns = [...matchedPatterns, ...data.patterns];
      }
    });
  }

  // Calculate confidence
  const maxPossibleScore = 50; // Rough estimate
  const confidence = topCategory
    ? Math.min(1, topCategory[1].score / maxPossibleScore + 0.3)
    : 0.1;

  // Determine urgency
  const urgencyLevel = determineUrgency(text, detectedServices[0]);

  // Generate suggested questions
  const suggestedQuestions = generateSuggestedQuestions(detectedServices[0], text);

  return {
    detectedServices: detectedServices.length > 0 ? detectedServices : (providedCategory ? [providedCategory] : []),
    confidence: Math.round(confidence * 100) / 100,
    suggestedQuestions,
    urgencyLevel,
    matchedKeywords: [...new Set(matchedKeywords)],
    matchedPatterns: [...new Set(matchedPatterns)],
  };
};

/**
 * Determine urgency level based on keywords
 */
const determineUrgency = (text: string, category?: string): 'LOW' | 'MEDIUM' | 'HIGH' => {
  // General urgency indicators
  const generalHighUrgency = ['urgent', 'emergency', 'immediately', 'asap', 'right now', 'critical'];
  const generalMediumUrgency = ['soon', 'today', 'quickly', 'fast'];

  // Check general urgency first
  for (const indicator of generalHighUrgency) {
    if (text.includes(indicator)) return 'HIGH';
  }

  // Check category-specific urgency
  if (category && typedServiceKeywords[category]) {
    const data = typedServiceKeywords[category];

    for (const indicator of data.urgencyIndicators.high) {
      if (text.includes(indicator.toLowerCase())) return 'HIGH';
    }

    for (const indicator of data.urgencyIndicators.medium) {
      if (text.includes(indicator.toLowerCase())) return 'MEDIUM';
    }
  }

  // Check general medium urgency
  for (const indicator of generalMediumUrgency) {
    if (text.includes(indicator)) return 'MEDIUM';
  }

  return 'LOW';
};

/**
 * Generate follow-up questions based on detected service
 */
const generateSuggestedQuestions = (category?: string, text?: string): string[] => {
  const questions: string[] = [];

  switch (category) {
    case 'PLUMBING':
      if (!text?.includes('location') && !text?.includes('where')) {
        questions.push('Where exactly is the plumbing issue?');
      }
      if (text?.includes('leak')) {
        questions.push('How severe is the leak?');
      }
      break;

    case 'ELECTRICAL':
      if (!text?.includes('location')) {
        questions.push('Which room or area has the electrical issue?');
      }
      questions.push('Have you turned off the main switch?');
      break;

    case 'AC_REPAIR':
      questions.push('What brand and type of AC do you have?');
      if (!text?.includes('error') && !text?.includes('problem')) {
        questions.push('When was the AC last serviced?');
      }
      break;

    case 'CARPENTER':
      if (text?.includes('furniture')) {
        questions.push('What type of furniture needs work?');
      }
      break;

    case 'PAINTING':
      questions.push('What is the approximate area to be painted?');
      if (!text?.includes('color')) {
        questions.push('Do you have a color preference?');
      }
      break;

    default:
      questions.push('Can you provide more details about the issue?');
  }

  return questions.slice(0, 3);
};

export default {
  analyzeProblem,
};
