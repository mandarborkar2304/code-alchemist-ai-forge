
import { ScoreData } from './types';
import { scoreThresholds, getGradeFromScore } from './scoreThresholds';

export function getMaintainabilityRating(score: number): ScoreData {
  const rating = getGradeFromScore(score, scoreThresholds.maintainability);
  
  let description = '';
  let reason = '';
  let issuesList: string[] = [];
  let improvements: string[] = [];
  
  if (rating === 'A') {
    description = 'Highly maintainable';
    reason = 'The code follows clean code principles with appropriate abstractions and organization.';
    improvements = ['Continue maintaining high code quality standards.'];
  } else if (rating === 'B') {
    description = 'Good maintainability';
    reason = 'The code is generally well-structured with minor improvement opportunities.';
    issuesList = [
      'Some areas could benefit from better documentation.',
      'Minor code duplication may exist.'
    ];
    improvements = [
      'Enhance documentation for complex logic',
      'Extract common patterns into reusable functions',
      'Review variable names for clarity'
    ];
  } else if (rating === 'C') {
    description = 'Moderate maintainability';
    reason = 'The code has structural issues that moderately impact future maintenance.';
    issuesList = [
      'Inadequate documentation in key areas',
      'Functions exceeding size guidelines',
      'Some code duplication without proper abstraction',
      'Variable naming could be improved'
    ];
    improvements = [
      'Refactor larger functions into smaller, single-purpose components',
      'Extract duplicate code into shared utilities',
      'Improve documentation coverage',
      'Enhance naming conventions for clarity'
    ];
  } else {
    description = 'Poor maintainability';
    reason = 'The code has significant maintainability issues requiring remediation.';
    issuesList = [
      'Functions exceeding recommended sizes',
      'Insufficient or missing documentation',
      'Unclear naming and conventions',
      'Deep nesting of control structures',
      'Substantial code duplication',
      'Magic numbers and hardcoded values'
    ];
    improvements = [
      'Comprehensive refactoring recommended',
      'Break down large functions into smaller units',
      'Add complete documentation',
      'Simplify nested code structures',
      'Create reusable abstractions for duplicate code',
      'Replace magic numbers with named constants'
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
