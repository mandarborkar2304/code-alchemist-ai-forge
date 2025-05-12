import { ScoreData } from './types';
import { ScoreGrade } from '@/types';
import { scoreThresholds, getGradeFromScore, ANALYSIS_CONSTANTS } from './scoreThresholds';

// Estimate nesting depth based on complexity score.
// This simulates how many nested blocks (if/else, loops) might exist in the code.
function estimateNestingDepth(score: number): number {
  if (score < 0 || !isFinite(score)) return 1;

  if (score <= 5) return Math.floor(Math.max(1, score / 2));
  if (score <= 10) return 2 + Math.floor((score - 5) / 2);
  if (score <= 20) return 5 + Math.floor((score - 10) / 2);
  return 10 + Math.floor((score - 20) / 3);
}

// Estimate number of nested loops or conditional constructs.
// This helps approximate logic density beyond decision points.
function estimateNestedLoops(score: number): number {
  if (score < 0 || !isFinite(score)) return 0;

  return Math.max(0, Math.floor(score / 7) - 1); // Nested loop after ~7 decisions
}

// Calculate penalty factor based on complexity score to simulate
// the impact of deep nesting and multiple control layers.
function calculateNestingPenaltyFactor(score: number): number {
  if (score < 0 || !isFinite(score)) return 1.0;

  if (score <= 5) return 1.0;    // No penalty
  if (score <= 10) return 1.05;  // 5% penalty
  if (score <= 20) return 1.15;  // 15% penalty
  return 1.3;                    // 30% penalty
}

// Generate human-readable description, reason, and suggestions based on final grade
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

    default: // Grade D
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

// Main function to analyze cyclomatic complexity and return a detailed rating report
export function getCyclomaticComplexityRating(score: number): ScoreData {
  // Handle missing or invalid scores gracefully
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

  // Ensure the score is non-negative
  const safeScore = Math.max(0, score);

  // Initial grade based on unadjusted complexity
  const baseRating = getGradeFromScore(safeScore, scoreThresholds.cyclomaticComplexity);

  // Estimate logic structure traits
  const estimatedNestingDepth = estimateNestingDepth(safeScore);
  const estimatedNestedLoops = estimateNestedLoops(safeScore);
  const nestingPenaltyFactor = calculateNestingPenaltyFactor(safeScore);

  let adjustedScore = safeScore;

  // Apply penalty if nesting or loop complexity is high
  if (
    estimatedNestedLoops > 1 ||
    estimatedNestingDepth > ANALYSIS_CONSTANTS.NESTING_DEPTH.HIGH
  ) {
    adjustedScore = Math.min(100, safeScore * nestingPenaltyFactor); // Cap to prevent runaway values
  }

  // Final rating after considering penalties
  let finalRating = adjustedScore !== safeScore
    ? getGradeFromScore(adjustedScore, scoreThresholds.cyclomaticComplexity)
    : baseRating;

  // Cap unrealistic upgrades due to math-based penalty
  if (
    (estimatedNestedLoops >= 3 || estimatedNestingDepth > 6) &&
    baseRating === 'D' &&
    finalRating === 'C'
  ) {
    finalRating = 'D'; // Don't allow bump from D to C if nesting is still severe
  } else if (
    estimatedNestedLoops >= 2 &&
    baseRating === 'D' &&
    finalRating === 'B'
  ) {
    finalRating = 'C'; // Don't allow D to jump directly to B
  }

  // Create a detailed explanation report
  const { description, reason, issuesList, improvements } =
    generateDescriptionForRating(safeScore, finalRating, estimatedNestingDepth, estimatedNestedLoops);

  // Notify if score adjustment was applied
  if (adjustedScore !== safeScore) {
    issuesList.push('Complexity score was increased due to nesting penalties.');
  }

  // Return full analysis result
  return {
    score: finalRating,
    description,
    reason,
    issues: issuesList,
    improvements
  };
}
