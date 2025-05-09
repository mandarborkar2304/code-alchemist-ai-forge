
import { ScoreGrade, ReliabilityIssue } from '@/types';
import { ScoreData } from './types';
import { getCyclomaticComplexityRating } from './cyclomaticComplexityRating';
import { getMaintainabilityRating } from './maintainabilityRating';
import { getReliabilityRating } from './reliabilityRating';
import { categorizeReliabilityIssues } from './reliabilityHelpers';
import { needsReliabilityWarningFlag } from './scoreThresholds';

// Main export that gets a rating from a score
export const getRatingFromScore = (
  score: number, 
  metricType: 'cyclomaticComplexity' | 'maintainability' | 'reliability',
  issues?: ReliabilityIssue[]
): ScoreData => {
  let result: ScoreData;
  
  switch (metricType) {
    case 'cyclomaticComplexity':
      result = getCyclomaticComplexityRating(score);
      break;
    case 'maintainability':
      result = getMaintainabilityRating(score);
      break;
    case 'reliability':
      result = getReliabilityRating(score, issues);
      break;
    default:
      throw new Error(`Unknown metric type: ${metricType}`);
  }
  
  // Add explicit warning flag for reliability ratings
  if (metricType === 'reliability') {
    const hasWarningFlag = needsReliabilityWarningFlag(
      result.score,
      issues?.map(issue => ({ type: issue.type, impact: issue.impact }))
    );
    
    // Set warning flag if needed (might already be set by getReliabilityRating)
    if (hasWarningFlag && !result.warningFlag) {
      result.warningFlag = true;
      
      // Append warning indicator to description if not already present
      if (!result.description.includes("⚠️")) {
        result.description += " ⚠️";
      }
    }
  }
  
  return result;
};

// Re-export categorizeReliabilityIssues for use elsewhere
export { categorizeReliabilityIssues };
