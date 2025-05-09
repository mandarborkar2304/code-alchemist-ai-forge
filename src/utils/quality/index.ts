
import { ScoreGrade, ReliabilityIssue } from '@/types';
import { ScoreData } from './types';
import { getCyclomaticComplexityRating } from './cyclomaticComplexityRating';
import { getMaintainabilityRating } from './maintainabilityRating';
import { getReliabilityRating } from './reliabilityRating';
import { categorizeReliabilityIssues } from './reliabilityHelpers';

// Main export that replaces the original getRatingFromScore function
export const getRatingFromScore = (
  score: number, 
  metricType: 'cyclomaticComplexity' | 'maintainability' | 'reliability',
  issues?: ReliabilityIssue[]
): ScoreData => {
  switch (metricType) {
    case 'cyclomaticComplexity':
      return getCyclomaticComplexityRating(score);
    case 'maintainability':
      return getMaintainabilityRating(score);
    case 'reliability':
      return getReliabilityRating(score, issues);
    default:
      throw new Error(`Unknown metric type: ${metricType}`);
  }
};

// Re-export categorizeReliabilityIssues for use elsewhere
export { categorizeReliabilityIssues };
