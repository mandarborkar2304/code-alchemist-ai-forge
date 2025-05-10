
// Export all quality rating functions
export * from './scoreThresholds';
export * from './types';

// Import required types
import { ScoreData } from './types';
import { ScoreGrade } from '@/types';

// Import and re-export functions
import { getReliabilityRating } from './reliabilityRating';
import { getCyclomaticComplexityRating } from './cyclomaticComplexityRating';
import { getMaintainabilityRating } from './maintainabilityRating';
import { categorizeReliabilityIssues } from './reliabilityHelpers';

// Export rating functions
export {
  getReliabilityRating,
  getCyclomaticComplexityRating,
  getMaintainabilityRating,
  categorizeReliabilityIssues
};

// Helper function to get rating from numerical score
export function getRatingFromScore(score: number, category: 'reliability' | 'cyclomaticComplexity' | 'maintainability'): ScoreData {
  switch (category) {
    case 'reliability':
      return getReliabilityRating(score);
    case 'cyclomaticComplexity':
      return getCyclomaticComplexityRating(score);
    case 'maintainability':
      return getMaintainabilityRating(score);
    default:
      return {
        score: 'C' as ScoreGrade,
        description: 'Unknown metric',
        reason: 'No rating available for the requested metric',
        issues: [],
        improvements: []
      };
  }
}
