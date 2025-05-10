
import { ScoreData } from './types';
import { ScoreGrade } from '@/types';
import { scoreThresholds, getGradeFromScore, ANALYSIS_CONSTANTS } from './scoreThresholds';

// Helper function for estimating nesting depth from complexity score
function estimateNestingDepth(score: number): number {
  // Guard against invalid inputs
  if (score < 0 || !isFinite(score)) {
    return 1; // Default safe value
  }
  
  if (score <= 5) {
    return Math.floor(Math.max(1, score / 2));
  } else if (score <= 10) {
    return 2 + Math.floor((score - 5) / 2);
  } else if (score <= 20) {
    return 5 + Math.floor((score - 10) / 2);
  } else {
    return 10 + Math.floor((score - 20) / 3);
  }
}

// Helper function for estimating nested loop severity
function estimateNestedLoops(score: number): number {
  // Guard against invalid inputs
  if (score < 0 || !isFinite(score)) {
    return 0; // Default safe value
  }
  
  return Math.max(0, Math.floor(score / 7) - 1);
}

// Helper function to calculate nesting penalty factor
function calculateNestingPenaltyFactor(score: number): number {
  // Guard against invalid inputs
  if (score < 0 || !isFinite(score)) {
    return 1.0; // Default neutral value
  }
  
  if (score <= 5) {
    return 1.0; // No penalty for very low complexity
  } else if (score <= 10) {
    return 1.05; // 5% penalty for low complexity
  } else if (score <= 20) {
    return 1.15; // 15% penalty for moderate complexity
  } else {
    return 1.3; // 30% penalty for high complexity
  }
}

// Helper to generate description based on rating
function generateDescriptionForRating(
  score: number, 
  rating: ScoreGrade, 
  nestingDepth: number, 
  nestedLoops: number
): {
  description: string;
  reason: string;
  issuesList: string[];
  improvements: string[];
} {
  let description: string;
  let reason: string;
  let issuesList: string[] = [];
  let improvements: string[] = [];

  switch (rating) {
    case 'A':
      description = `Very low complexity (CC: ${score})`;
      reason = 'The code has a simple, straightforward flow with minimal decision points.';
      improvements = ['Continue maintaining low complexity as features are added.'];
      break;
    case 'B':
      description = `Low complexity (CC: ${score})`;
      reason = 'The code has a reasonable number of decision points but remains easily analyzable.';
      
      if (nestingDepth > ANALYSIS_CONSTANTS.NESTING_DEPTH.LOW) {
        issuesList.push(`Estimated nesting depth of ${nestingDepth} levels in some areas.`);
      }
      
      if (nestedLoops > 0) {
        issuesList.push(`Estimated ${nestedLoops} nested loops or conditions.`);
      }
      
      if (issuesList.length === 0) {
        issuesList = ['Low cognitive load with manageable decision points.'];
      }
      
      improvements = [
        'Continue using small, focused functions.',
        'Consider reducing nesting depth where applicable.'
      ];
      break;
    case 'C':
      description = `Moderate complexity (CC: ${score})`;
      reason = 'The code has many decision points, making it somewhat difficult to maintain and test thoroughly.';
      
      if (nestingDepth > ANALYSIS_CONSTANTS.NESTING_DEPTH.MODERATE) {
        issuesList.push(`Deep nesting detected with approximately ${nestingDepth} levels.`);
      }
      
      if (nestedLoops > 1) {
        issuesList.push(`Multiple nested loops detected (approximately ${nestedLoops}).`);
      }
      
      if (issuesList.length === 0) {
        issuesList = [
          'Moderate number of branches and conditions',
          'Code requires thorough testing to ensure coverage'
        ];
      }
      
      improvements = [
        'Refactor complex methods into smaller, single-responsibility functions',
        'Replace nested conditions with guard clauses',
        'Consider implementing a state machine or strategy pattern for complex logic'
      ];
      break;
    default: // 'D'
      description = `High complexity (CC: ${score})`;
      reason = 'The code has an excessive number of decision points, making it error-prone and difficult to understand.';
      
      if (nestingDepth > ANALYSIS_CONSTANTS.NESTING_DEPTH.HIGH) {
        issuesList.push(`Excessive nesting depth of approximately ${nestingDepth} levels.`);
      }
      
      if (nestedLoops > 2) {
        issuesList.push(`${nestedLoops} levels of nested loops detected, creating exponential complexity.`);
      }
      
      if (issuesList.length === 0) {
        issuesList = [
          'High complexity exceeds recommended thresholds',
          'Difficult to test and maintain with confidence',
          'High risk of undiscovered bugs and regressions'
        ];
      }
      
      improvements = [
        'Critical refactoring required',
        'Decompose logic into multiple smaller functions',
        'Consider architectural changes to simplify control flow',
        'Implement divide-and-conquer approach to reduce nesting',
        'Replace nested loops with more efficient algorithms or data structures'
      ];
  }

  return { description, reason, issuesList, improvements };
}

// Main function for cyclomatic complexity rating
export function getCyclomaticComplexityRating(score: number): ScoreData {
  // Validate input
  if (score === undefined || score === null || !isFinite(score)) {
    console.warn('Invalid complexity score:', score);
    return {
      score: 'D',
      description: 'Invalid complexity',
      reason: 'Unable to analyze the code complexity due to invalid input.',
      issues: ['Invalid complexity score provided'],
      improvements: ['Ensure valid metrics are available for analysis']
    };
  }
  
  // Use safe non-negative value
  const safeScore = Math.max(0, score);
  
  // Get base rating using standard thresholds
  const baseRating = getGradeFromScore(safeScore, scoreThresholds.cyclomaticComplexity);
  
  // Generate analysis data using helper functions
  const estimatedNestingDepth = estimateNestingDepth(safeScore);
  const estimatedNestedLoops = estimateNestedLoops(safeScore);
  const nestingPenaltyFactor = calculateNestingPenaltyFactor(safeScore);
  
  // Apply penalty for nested control structures if needed
  let adjustedScore = safeScore;
  if (estimatedNestedLoops > 1) {
    // Safe multiplication with safeguard against infinity
    adjustedScore = Math.min(100, safeScore * nestingPenaltyFactor);
  }
  
  // Re-evaluate rating with adjusted score if needed
  let finalRating = adjustedScore !== safeScore ? 
    getGradeFromScore(adjustedScore, scoreThresholds.cyclomaticComplexity) : 
    baseRating;
  
  // If nested loops are causing severely complex code but base rating is good,
  // cap the rating improvement
  if (estimatedNestedLoops >= 3 && baseRating === 'D' && finalRating === 'C') {
    finalRating = 'D'; // Severely nested code should remain rated D
  }
  
  // Generate detailed report
  const { description, reason, issuesList, improvements } = 
    generateDescriptionForRating(safeScore, finalRating, estimatedNestingDepth, estimatedNestedLoops);
  
  return {
    score: finalRating,
    description,
    reason,
    issues: issuesList,
    improvements
  };
}
