
// Export all quality rating functions
export * from './scoreThresholds';
export * from './types';

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
export function getRatingFromScore(score: number, category: 'reliability' | 'cyclomaticComplexity' | 'maintainability'): string {
  switch (category) {
    case 'reliability':
      return getReliabilityRating(score).score;
    case 'cyclomaticComplexity':
      return getCyclomaticComplexityRating(score).score;
    case 'maintainability':
      return getMaintainabilityRating(score).score;
    default:
      return 'C';
  }
}
