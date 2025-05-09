
import { MetricsResult, ScoreGrade, ReliabilityIssue } from '@/types';

// Function to convert numerical scores to letter grades with descriptions
type MetricType = 'cyclomaticComplexity' | 'maintainability' | 'reliability';

type ScoreData = {
  score: 'A' | 'B' | 'C' | 'D';
  description: string;
  reason: string;
  issues?: string[];
  improvements?: string[];
};

// SonarQube-aligned scoring thresholds
const scoreThresholds = {
  maintainability: {
    A: 90, // A: 90-100 (Highly maintainable)
    B: 80, // B: 80-89 (Good maintainability)
    C: 70, // C: 70-79 (Moderate maintainability)
    D: 0   // D: <70 (Poor maintainability)
  },
  cyclomaticComplexity: {
    // SonarQube-aligned thresholds (McCabe's complexity)
    A: 10,  // A: ≤10 (Low complexity)
    B: 20,  // B: 11-20 (Moderate complexity)
    C: 30,  // C: 21-30 (High complexity)
    D: 31   // D: >30 (Very high complexity)
  },
  reliability: {
    A: 90, // A: 90+ (Highly reliable)
    B: 80, // B: 80-89 (Good reliability)
    C: 70, // C: 70-79 (Moderate reliability)
    D: 0   // D: <70 (Poor reliability)
  }
};

export const getRatingFromScore = (score: number, metricType: MetricType, issues?: ReliabilityIssue[]): ScoreData => {
  let rating: 'A' | 'B' | 'C' | 'D';
  let description = '';
  let reason = '';
  let issuesList: string[] = [];
  let improvements: string[] = [];
  
  // Apply the SonarQube-aligned scoring logic based on metric type
  if (metricType === 'cyclomaticComplexity') {
    // For complexity, using McCabe's algorithm thresholds
    if (score <= scoreThresholds.cyclomaticComplexity.A) {
      rating = 'A';
      description = `Low complexity (CC: ${score})`;
      reason = 'The code has a simple, straightforward flow with minimal decision points.';
      improvements = ['Continue maintaining low complexity as features are added.'];
    } else if (score <= scoreThresholds.cyclomaticComplexity.B) {
      rating = 'B';
      description = `Moderate complexity (CC: ${score})`;
      reason = 'The code has a reasonable number of decision points but remains analyzable.';
      issuesList = ['Moderate cognitive load due to multiple conditions.'];
      improvements = ['Consider breaking down complex methods into smaller, focused functions.'];
    } else if (score <= scoreThresholds.cyclomaticComplexity.C) {
      rating = 'C';
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
      rating = 'D';
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
  } else if (metricType === 'maintainability') {
    // SonarQube-aligned maintainability index scoring
    
    if (score >= scoreThresholds.maintainability.A) {
      rating = 'A';
      description = 'Highly maintainable';
      reason = 'The code follows clean code principles with appropriate abstractions and organization.';
      improvements = ['Continue maintaining high code quality standards.'];
    } else if (score >= scoreThresholds.maintainability.B) {
      rating = 'B';
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
    } else if (score >= scoreThresholds.maintainability.C) {
      rating = 'C';
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
      rating = 'D';
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
  } else { // reliability
    // For reliability, incorporate SonarQube-style bug detection heuristics
    if (issues && issues.length > 0) {
      // Calibrate score based on issue severity
      const hasCriticalIssues = issues.some(issue => issue.type === 'critical');
      const hasMajorIssues = issues.some(issue => issue.type === 'major');
      
      // Add specific issues to the list
      issuesList = issues.map(issue => issue.description);
      
      // Group improvements by category using SonarQube categorization terms
      const runtimeImprovements = issues.filter(i => i.category === 'runtime')
        .map(i => `Fix ${i.description} (Bug)`);
      const exceptionImprovements = issues.filter(i => i.category === 'exception')
        .map(i => `Add proper handling for ${i.description} (Bug)`);
      const structureImprovements = issues.filter(i => i.category === 'structure')
        .map(i => `Refactor ${i.description} (Code Smell)`);
      const readabilityImprovements = issues.filter(i => i.category === 'readability')
        .map(i => `Improve ${i.description} (Code Smell)`);
      
      improvements = [
        ...runtimeImprovements,
        ...exceptionImprovements,
        ...structureImprovements,
        ...readabilityImprovements
      ];
      
      // Apply SonarQube-like impact on reliability score
      if (hasCriticalIssues) {
        score = Math.min(score, scoreThresholds.reliability.B - 1);
      }
      
      if (hasMajorIssues) {
        score = Math.min(score, scoreThresholds.reliability.B);
      }
    }
    
    // Determine the final reliability grade based on SonarQube-aligned thresholds
    if (score >= scoreThresholds.reliability.A) {
      rating = 'A';
      description = 'Highly reliable';
      reason = 'The code properly handles edge cases and potential error conditions.';
      if (improvements.length === 0) {
        improvements = ['Maintain robust error handling practices.'];
      }
    } else if (score >= scoreThresholds.reliability.B) {
      rating = 'B';
      description = 'Good reliability';
      reason = 'The code handles most error scenarios but has some potential weak points.';
      if (issuesList.length === 0) {
        issuesList = ['Some error paths may not be fully handled.'];
      }
      if (improvements.length === 0) {
        improvements = ['Enhance error handling coverage', 'Add additional input validation.'];
      }
    } else if (score >= scoreThresholds.reliability.C) {
      rating = 'C';
      description = 'Moderate reliability';
      reason = 'The code has several reliability issues that should be addressed.';
      if (issuesList.length === 0) {
        issuesList = [
          'Multiple potential failure points without proper handling',
          'Key edge cases not considered'
        ];
      }
      if (improvements.length === 0) {
        improvements = [
          'Implement try-catch blocks for risky operations',
          'Validate inputs more thoroughly',
          'Handle edge cases explicitly'
        ];
      }
    } else {
      rating = 'D';
      description = 'Poor reliability';
      reason = 'The code has numerous reliability issues creating a high risk of runtime failures.';
      if (issuesList.length === 0) {
        issuesList = [
          'Minimal error handling',
          'Unsafe operations without validation',
          'Multiple potential crash points'
        ];
      }
      if (improvements.length === 0) {
        improvements = [
          'Implement comprehensive error handling',
          'Validate all inputs and parameters',
          'Handle all potential error states explicitly'
        ];
      }
    }
  }
  
  return {
    score: rating,
    description,
    reason,
    issues: issuesList,
    improvements
  };
};

// Helper function to categorize and group reliability issues using SonarQube-like categories
export const categorizeReliabilityIssues = (issues: ReliabilityIssue[]) => {
  const categories = [
    { name: 'Bugs - Critical', issues: issues.filter(i => i.category === 'runtime' && i.type === 'critical') },
    { name: 'Bugs - Exception Handling', issues: issues.filter(i => i.category === 'exception') },
    { name: 'Code Smells - Structure', issues: issues.filter(i => i.category === 'structure') },
    { name: 'Code Smells - Maintainability', issues: issues.filter(i => i.category === 'readability') }
  ].filter(category => category.issues.length > 0);
  
  return categories;
};
