
import { ScoreGrade, ReliabilityIssue } from '@/types';
import { ScoreData } from './types';
import { getCyclomaticComplexityRating } from './cyclomaticComplexityRating';
import { getMaintainabilityRating } from './maintainabilityRating';
import { getReliabilityRating } from './reliabilityRating';
import { categorizeReliabilityIssues } from './reliabilityHelpers';
import { needsReliabilityWarningFlag } from './scoreThresholds';

// Validate input parameters for getRatingFromScore function
function validateRatingInputs(
  score: number, 
  metricType: string
): { isValid: boolean, error?: string } {
  // Check if score is valid
  if (score === undefined || score === null || !isFinite(score)) {
    return { 
      isValid: false, 
      error: `Invalid score provided: ${score}` 
    };
  }
  
  // Check if metric type is valid
  const validMetricTypes = [
    'cyclomaticComplexity', 
    'maintainability', 
    'reliability'
  ];
  
  if (!validMetricTypes.includes(metricType)) {
    return { 
      isValid: false, 
      error: `Invalid metric type: ${metricType}` 
    };
  }
  
  return { isValid: true };
}

// Main export that gets a rating from a score
export const getRatingFromScore = (
  score: number, 
  metricType: 'cyclomaticComplexity' | 'maintainability' | 'reliability',
  issues?: ReliabilityIssue[]
): ScoreData => {
  // Validate inputs
  const validation = validateRatingInputs(score, metricType);
  if (!validation.isValid) {
    console.warn(validation.error);
    return {
      score: 'D',
      description: 'Invalid rating',
      reason: `Unable to calculate rating: ${validation.error}`,
      issues: [`Error: ${validation.error}`],
      improvements: ['Provide valid input parameters for analysis']
    };
  }
  
  // Use a safe non-negative score value
  const safeScore = Math.max(0, score);
  
  // Call the appropriate rating function based on metric type
  let result: ScoreData;
  
  switch (metricType) {
    case 'cyclomaticComplexity':
      result = getCyclomaticComplexityRating(safeScore);
      break;
    case 'maintainability':
      result = getMaintainabilityRating(safeScore);
      break;
    case 'reliability':
      // For reliability, also pass the issues if available
      result = getReliabilityRating(
        safeScore, 
        Array.isArray(issues) ? issues : undefined
      );
      break;
    default:
      // This should never happen due to validation, but TypeScript needs it
      throw new Error(`Unsupported metric type: ${metricType}`);
  }
  
  // Add explicit warning flag for reliability ratings if needed
  if (metricType === 'reliability' && Array.isArray(issues)) {
    const hasWarningFlag = needsReliabilityWarningFlag(
      result.score,
      issues?.map(issue => ({ 
        type: issue?.type || 'minor', 
        impact: issue?.impact || 1 
      }))
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

// Re-export helper functions for use elsewhere
export { categorizeReliabilityIssues };
