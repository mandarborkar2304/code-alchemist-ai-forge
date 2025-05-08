
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

// Industry-aligned scoring thresholds (SonarQube-like)
const scoreThresholds = {
  maintainability: {
    A: 90, // A: 90+
    B: 80, // B: 80-89
    C: 70, // C: 70-79
    D: 0   // D: <70
  },
  cyclomaticComplexity: {
    // Revised thresholds based on industry standards (SonarQube-like)
    A: 5,   // A: ≤5 (Low complexity)
    B: 10,  // B: 6-10 (Moderate complexity)
    C: 14,  // C: 11-14 (High complexity)
    D: 15   // D: 15+ (Very high complexity)
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
  
  // Apply the appropriate scoring logic based on metric type
  if (metricType === 'cyclomaticComplexity') {
    // For complexity, lower is better - using tightened thresholds
    if (score <= scoreThresholds.cyclomaticComplexity.A) {
      rating = 'A';
      description = `Low complexity (CC: ${score})`;
      reason = 'The code has a simple, straightforward flow with few decision points.';
      improvements = ['Continue maintaining low complexity as features are added.'];
    } else if (score <= scoreThresholds.cyclomaticComplexity.B) {
      rating = 'B';
      description = `Moderate complexity (CC: ${score})`;
      reason = 'The code has a moderate number of decision points but remains reasonably easy to understand.';
      issuesList = ['Multiple conditions increase cognitive load.'];
      improvements = ['Consider extracting complex conditions into well-named helper methods.'];
    } else if (score <= scoreThresholds.cyclomaticComplexity.C) {
      rating = 'C';
      description = `High complexity (CC: ${score})`;
      reason = 'The code has many decision points and paths, making it harder to test fully.';
      issuesList = [
        'High number of branches and conditions',
        'Code requires thorough testing to ensure all paths work correctly'
      ];
      improvements = [
        'Break down complex methods into smaller, focused functions',
        'Replace nested conditions with guard clauses',
        'Consider a state machine or strategy pattern for complex logic'
      ];
    } else {
      rating = 'D';
      description = `Very high complexity (CC: ${score})`;
      reason = 'The code has an excessive number of decision points and paths, making it difficult to understand and maintain.';
      issuesList = [
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
  } else if (metricType === 'maintainability') {
    // Refined maintainability scoring with balanced penalties and SonarQube alignment
    
    // For maintainability, higher is better
    if (score >= scoreThresholds.maintainability.A) {
      rating = 'A';
      description = 'Highly maintainable';
      reason = 'The code is well-structured, modular, and follows good design principles.';
      improvements = ['Continue maintaining high code quality standards.'];
    } else if (score >= scoreThresholds.maintainability.B) {
      rating = 'B';
      description = 'Good maintainability';
      reason = 'The code is generally well-structured with some minor improvement opportunities.';
      issuesList = [
        'Some areas could benefit from better documentation or structure.',
        'Minor code duplication may exist.'
      ];
      improvements = [
        'Add more comments to complex logic',
        'Extract repeated patterns into helper functions',
        'Consider using more descriptive naming'
      ];
    } else if (score >= scoreThresholds.maintainability.C) {
      rating = 'C';
      description = 'Moderate maintainability';
      reason = 'The code has some structural or modularity issues that hinder maintenance.';
      issuesList = [
        'Insufficient comments or documentation',
        'Some functions exceed recommended size limits',
        'Some code duplication without abstraction',
        'Unclear variable naming in places'
      ];
      improvements = [
        'Break down larger functions into smaller, single-purpose ones',
        'Extract common functionality into shared utilities',
        'Improve documentation coverage',
        'Enhance variable naming for clarity'
      ];
    } else {
      rating = 'D';
      description = 'Poor maintainability';
      reason = 'The code has significant structure issues that make maintenance difficult.';
      issuesList = [
        'Functions exceeding size thresholds',
        'Minimal or no documentation',
        'Unclear naming conventions',
        'Excessive nesting of control structures',
        'Significant code duplication',
        'Magic numbers and hardcoded values'
      ];
      improvements = [
        'Refactoring recommended',
        'Break down large functions into smaller, focused units',
        'Add comprehensive documentation',
        'Simplify deeply nested code',
        'Extract duplicate code into reusable functions',
        'Replace magic numbers with named constants'
      ];
    }
  } else { // reliability
    // For reliability, incorporate the specific issues found
    if (issues && issues.length > 0) {
      // Check for critical issues that should prevent an A rating
      const hasCriticalIssues = issues.some(issue => issue.type === 'critical');
      const hasMajorIssues = issues.some(issue => issue.type === 'major');
      const hasInputValidation = issues.some(issue => issue.description.includes('input validation'));
      const hasErrorHandling = issues.some(issue => issue.description.includes('error handling'));
      
      // Add specific issues to the list
      issuesList = issues.map(issue => issue.description);
      
      // Group improvements by category
      const runtimeImprovements = issues.filter(i => i.category === 'runtime')
        .map(i => `Fix ${i.description}`);
      const exceptionImprovements = issues.filter(i => i.category === 'exception')
        .map(i => `Add try-catch for ${i.description}`);
      const structureImprovements = issues.filter(i => i.category === 'structure')
        .map(i => `Refactor ${i.description}`);
      
      improvements = [
        ...runtimeImprovements,
        ...exceptionImprovements,
        ...structureImprovements
      ];
      
      // A reliability score can't be 'A' with any critical issues
      if (hasCriticalIssues) {
        score = Math.min(score, scoreThresholds.reliability.B - 1);
      }
      
      // Major issues should cap at 'B' at best
      if (hasMajorIssues) {
        score = Math.min(score, scoreThresholds.reliability.B);
      }
      
      // Ensure code with missing input validation or error handling can't get an A
      if (!hasInputValidation || !hasErrorHandling) {
        score = Math.min(score, scoreThresholds.reliability.B - 1);
      }
    }
    
    // Now determine the final reliability grade
    if (score >= scoreThresholds.reliability.A) {
      rating = 'A';
      description = 'Highly reliable';
      reason = 'The code handles errors and edge cases effectively.';
      if (improvements.length === 0) {
        improvements = ['Continue maintaining robust error handling.'];
      }
    } else if (score >= scoreThresholds.reliability.B) {
      rating = 'B';
      description = 'Good reliability';
      reason = 'The code handles most errors but could be improved in some areas.';
      if (issuesList.length === 0) {
        issuesList = ['Some error paths may not be fully handled.'];
      }
      if (improvements.length === 0) {
        improvements = ['Add more comprehensive error handling', 'Consider edge cases more thoroughly.'];
      }
    } else if (score >= scoreThresholds.reliability.C) {
      rating = 'C';
      description = 'Moderate reliability';
      reason = 'The code has significant gaps in error handling.';
      if (issuesList.length === 0) {
        issuesList = [
          'Multiple potential error points without proper handling',
          'Some edge cases not considered'
        ];
      }
      if (improvements.length === 0) {
        improvements = [
          'Add try-catch blocks around risky operations',
          'Validate inputs more thoroughly',
          'Handle edge cases explicitly'
        ];
      }
    } else {
      rating = 'D';
      description = 'Poor reliability';
      reason = 'The code is prone to errors and failures.';
      if (issuesList.length === 0) {
        issuesList = [
          'Minimal or no error handling',
          'Assumptions about inputs without validation',
          'Multiple potential crash points'
        ];
      }
      if (improvements.length === 0) {
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
    issues: issuesList,
    improvements
  };
};

// Helper function to categorize and group reliability issues
export const categorizeReliabilityIssues = (issues: ReliabilityIssue[]) => {
  const categories = [
    { name: 'Runtime Critical', issues: issues.filter(i => i.category === 'runtime' && i.type === 'critical') },
    { name: 'Exception Handling', issues: issues.filter(i => i.category === 'exception') },
    { name: 'Code Structure', issues: issues.filter(i => i.category === 'structure') },
    { name: 'Code Readability', issues: issues.filter(i => i.category === 'readability') }
  ].filter(category => category.issues.length > 0);
  
  return categories;
};
