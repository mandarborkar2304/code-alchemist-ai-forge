
import { ScoreData } from './types';
import { scoreThresholds, getGradeFromScore } from './scoreThresholds';

export function getCyclomaticComplexityRating(score: number): ScoreData {
  const rating = getGradeFromScore(score, scoreThresholds.cyclomaticComplexity);
  
  let description = '';
  let reason = '';
  let issuesList: string[] = [];
  let improvements: string[] = [];
  
  if (rating === 'A') {
    description = `Low complexity (CC: ${score})`;
    reason = 'The code has a simple, straightforward flow with minimal decision points.';
    improvements = ['Continue maintaining low complexity as features are added.'];
  } else if (rating === 'B') {
    description = `Moderate complexity (CC: ${score})`;
    reason = 'The code has a reasonable number of decision points but remains analyzable.';
    issuesList = ['Moderate cognitive load due to multiple conditions.'];
    improvements = ['Consider breaking down complex methods into smaller, focused functions.'];
  } else if (rating === 'C') {
    description = `High complexity (CC: ${score})`;
    reason = 'The code has many decision points, making it difficult to maintain and test thoroughly.';
    issuesList = [
      'High number of branches and conditions',
      'Code requires comprehensive testing to ensure coverage'
    ];
    improvements = [
      'Refactor complex methods into smaller, single-responsibility functions',
      'Replace nested conditions with guard clauses',
      'Consider implementing a state machine or strategy pattern for complex logic'
    ];
  } else {
    description = `Very high complexity (CC: ${score})`;
    reason = 'The code has an excessive number of decision points, making it error-prone and difficult to understand.';
    issuesList = [
      'Extreme complexity exceeds recommended thresholds',
      'Difficult to test and maintain with confidence',
      'High risk of undiscovered bugs and regressions'
    ];
    improvements = [
      'Critical refactoring required',
      'Decompose logic into multiple smaller functions',
      'Consider architectural changes to simplify control flow'
    ];
  }
  
  return {
    score: rating,
    description,
    reason,
    issues: issuesList,
    improvements
  };
}
