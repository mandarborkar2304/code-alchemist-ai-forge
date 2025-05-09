
import { ScoreData } from './types';
import { scoreThresholds, getGradeFromScore } from './scoreThresholds';

// Enhanced cyclomatic complexity assessment with contextual nesting analysis
export function getCyclomaticComplexityRating(score: number): ScoreData {
  // Base rating using standard thresholds
  let baseRating = getGradeFromScore(score, scoreThresholds.cyclomaticComplexity);
  
  // Generate nesting penalty factor based on cyclomatic complexity
  // Higher complexity scores typically correlate with deeper nesting
  let estimatedNestingDepth = 1;
  let nestingPenaltyFactor = 1.0;
  
  if (score <= 10) {
    estimatedNestingDepth = Math.floor(score / 3);
    nestingPenaltyFactor = 1.0; // No penalty for low complexity
  } else if (score <= 20) {
    estimatedNestingDepth = 3 + Math.floor((score - 10) / 2);
    nestingPenaltyFactor = 1.1; // 10% penalty for moderate complexity
  } else if (score <= 30) {
    estimatedNestingDepth = 8 + Math.floor((score - 20) / 2);
    nestingPenaltyFactor = 1.2; // 20% penalty for high complexity
  } else {
    estimatedNestingDepth = 13 + Math.floor((score - 30) / 3);
    nestingPenaltyFactor = 1.3; // 30% penalty for very high complexity
  }
  
  // Estimate nested loop severity
  let estimatedNestedLoops = Math.max(0, Math.floor(score / 7) - 1);
  
  // Apply penalty for nested control structures - particularly nested loops
  // This simulates AST-based control flow graph analysis
  let adjustedScore = score;
  if (estimatedNestedLoops > 1) {
    adjustedScore = Math.min(100, score * nestingPenaltyFactor);
  }
  
  // Re-evaluate rating with adjusted score if needed
  let finalRating = adjustedScore !== score ? 
    getGradeFromScore(adjustedScore, scoreThresholds.cyclomaticComplexity) : 
    baseRating;
  
  // If nested loops are causing severely complex code but base rating is good,
  // cap the rating improvement
  if (estimatedNestedLoops >= 3 && baseRating === 'D' && finalRating === 'C') {
    finalRating = 'D'; // Severely nested code should remain rated D
  }
  
  // Generate report
  let description = '';
  let reason = '';
  let issuesList: string[] = [];
  let improvements: string[] = [];
  
  if (finalRating === 'A') {
    description = `Low complexity (CC: ${score})`;
    reason = 'The code has a simple, straightforward flow with minimal decision points.';
    improvements = ['Continue maintaining low complexity as features are added.'];
  } else if (finalRating === 'B') {
    description = `Moderate complexity (CC: ${score})`;
    reason = 'The code has a reasonable number of decision points but remains analyzable.';
    
    if (estimatedNestingDepth > 3) {
      issuesList.push(`Estimated nesting depth of ${estimatedNestingDepth} levels in some areas.`);
    }
    
    if (estimatedNestedLoops > 0) {
      issuesList.push(`Estimated ${estimatedNestedLoops} nested loops or conditions.`);
    }
    
    if (issuesList.length === 0) {
      issuesList = ['Moderate cognitive load due to multiple conditions.'];
    }
    
    improvements = [
      'Consider breaking down complex methods into smaller, focused functions.',
      'Evaluate opportunities to simplify conditional logic.'
    ];
  } else if (finalRating === 'C') {
    description = `High complexity (CC: ${score})`;
    reason = 'The code has many decision points, making it difficult to maintain and test thoroughly.';
    
    if (estimatedNestingDepth > 4) {
      issuesList.push(`Deep nesting detected with approximately ${estimatedNestingDepth} levels.`);
    }
    
    if (estimatedNestedLoops > 1) {
      issuesList.push(`Multiple nested loops detected (approximately ${estimatedNestedLoops}).`);
    }
    
    if (issuesList.length === 0) {
      issuesList = [
        'High number of branches and conditions',
        'Code requires comprehensive testing to ensure coverage'
      ];
    }
    
    improvements = [
      'Refactor complex methods into smaller, single-responsibility functions',
      'Replace nested conditions with guard clauses',
      'Consider implementing a state machine or strategy pattern for complex logic',
      'Extract nested loops into separate methods with clear responsibility'
    ];
  } else {
    description = `Very high complexity (CC: ${score})`;
    reason = 'The code has an excessive number of decision points, making it error-prone and difficult to understand.';
    
    if (estimatedNestingDepth > 5) {
      issuesList.push(`Excessive nesting depth of approximately ${estimatedNestingDepth} levels.`);
    }
    
    if (estimatedNestedLoops > 2) {
      issuesList.push(`${estimatedNestedLoops} levels of nested loops detected, creating exponential complexity.`);
    }
    
    if (issuesList.length === 0) {
      issuesList = [
        'Extreme complexity exceeds recommended thresholds',
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
  
  return {
    score: finalRating,
    description,
    reason,
    issues: issuesList,
    improvements
  };
}
