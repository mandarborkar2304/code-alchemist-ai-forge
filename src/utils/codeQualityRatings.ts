
// Function to convert numerical scores to letter grades with descriptions
type MetricType = 'cyclomaticComplexity' | 'maintainability' | 'reliability';

type ScoreData = {
  score: 'A' | 'B' | 'C' | 'D';
  description: string;
  reason: string;
  issues?: string[];
  improvements?: string[];
};

// Updated scoring thresholds for SonarQube-like alignment
const scoreThresholds = {
  maintainability: {
    A: 90, // A: 90+
    B: 80, // B: 80-89
    C: 70, // C: 70-79
    D: 0   // D: <70
  },
  cyclomaticComplexity: {
    // Lower is better for complexity
    A: 10,  // A: ≤10
    B: 20,  // B: 11-20
    C: 30,  // C: 21-30
    D: Infinity // D: >30
  },
  reliability: {
    A: 90, // A: 90+
    B: 80, // B: 80-89
    C: 70, // C: 70-79
    D: 0   // D: <70
  }
};

export const getRatingFromScore = (score: number, metricType: MetricType): ScoreData => {
  let rating: 'A' | 'B' | 'C' | 'D';
  let description = '';
  let reason = '';
  let issues: string[] = [];
  let improvements: string[] = [];
  
  // Apply the appropriate scoring logic based on metric type
  if (metricType === 'cyclomaticComplexity') {
    // For complexity, lower is better
    if (score <= scoreThresholds.cyclomaticComplexity.A) {
      rating = 'A';
      description = 'Low complexity';
      reason = 'The code has a simple, straightforward flow.';
      improvements = ['Continue maintaining low complexity as features are added.'];
    } else if (score <= scoreThresholds.cyclomaticComplexity.B) {
      rating = 'B';
      description = 'Moderate complexity';
      reason = 'The code has a moderate number of decision points.';
      issues = ['Multiple nested conditions increase cognitive load.'];
      improvements = ['Consider extracting complex conditions into well-named helper methods.'];
    } else if (score <= scoreThresholds.cyclomaticComplexity.C) {
      rating = 'C';
      description = 'High complexity';
      reason = 'The code has many decision points and paths.';
      issues = [
        'High number of branches and conditions',
        'Code may be difficult to understand and test'
      ];
      improvements = [
        'Break down complex methods into smaller, focused functions',
        'Replace nested conditions with guard clauses',
        'Consider a state machine or strategy pattern for complex logic'
      ];
    } else {
      rating = 'D';
      description = 'Very high complexity';
      reason = 'The code has an excessive number of decision points and paths.';
      issues = [
        'Extremely high number of branches and conditions',
        'Difficult to understand, test, and maintain',
        'High risk of bugs and regressions'
      ];
      improvements = [
        'Urgent refactoring recommended',
        'Decompose into multiple simpler methods',
        'Consider architectural changes to simplify flow'
      ];
    }
  } else {
    // For maintainability and reliability, higher is better
    const thresholds = metricType === 'maintainability' ? 
      scoreThresholds.maintainability : 
      scoreThresholds.reliability;
    
    if (score >= thresholds.A) {
      rating = 'A';
      if (metricType === 'maintainability') {
        description = 'Highly maintainable';
        reason = 'The code is well-structured, documented, and easy to modify.';
        improvements = ['Continue maintaining high code quality standards.'];
      } else { // reliability
        description = 'Highly reliable';
        reason = 'The code handles errors and edge cases effectively.';
        improvements = ['Continue maintaining robust error handling.'];
      }
    } else if (score >= thresholds.B) {
      rating = 'B';
      if (metricType === 'maintainability') {
        description = 'Good maintainability';
        reason = 'The code is generally well-structured but has some minor issues.';
        issues = ['Some areas could benefit from better documentation or structure.'];
        improvements = ['Add more comments to complex logic', 'Consider extracting reusable components.'];
      } else { // reliability
        description = 'Good reliability';
        reason = 'The code handles most errors but could be improved in some areas.';
        issues = ['Some error paths may not be fully handled.'];
        improvements = ['Add more comprehensive error handling', 'Consider edge cases more thoroughly.'];
      }
    } else if (score >= thresholds.C) {
      rating = 'C';
      if (metricType === 'maintainability') {
        description = 'Moderate maintainability';
        reason = 'The code has significant structural or documentation issues.';
        issues = [
          'Insufficient comments',
          'Some functions are too large',
          'Variable naming could be improved'
        ];
        improvements = [
          'Break down large functions into smaller ones',
          'Add more comprehensive documentation',
          'Improve variable naming for clarity'
        ];
      } else { // reliability
        description = 'Moderate reliability';
        reason = 'The code has significant gaps in error handling.';
        issues = [
          'Multiple potential error points without proper handling',
          'Some edge cases not considered'
        ];
        improvements = [
          'Add try-catch blocks around risky operations',
          'Validate inputs more thoroughly',
          'Handle edge cases explicitly'
        ];
      }
    } else {
      rating = 'D';
      if (metricType === 'maintainability') {
        description = 'Poor maintainability';
        reason = 'The code is difficult to understand and modify.';
        issues = [
          'Very large functions',
          'Minimal or no comments',
          'Unclear variable names',
          'Deep nesting of control structures'
        ];
        improvements = [
          'Urgent refactoring recommended',
          'Break down monolithic functions',
          'Add comprehensive documentation',
          'Restructure deeply nested code'
        ];
      } else { // reliability
        description = 'Poor reliability';
        reason = 'The code is prone to errors and failures.';
        issues = [
          'Minimal or no error handling',
          'Assumptions about inputs without validation',
          'Multiple potential crash points'
        ];
        improvements = [
          'Add comprehensive error handling throughout',
          'Validate all inputs and function parameters',
          'Handle all potential error states explicitly'
        ];
      }
    }
  }
  
  return {
    score: rating,
    description,
    reason,
    issues,
    improvements
  };
};
