
import { MetricsResult, ScoreGrade, ReliabilityIssue } from '@/types';

// Function to convert numerical scores to letter grades with descriptions
type MetricType = 'cyclomaticComplexity' | 'maintainability' | 'reliability';

type ScoreData = {
  score: 'A' | 'B' | 'C' | 'D';
  description: string;
  reason: string;
  issues?: string[] | ReliabilityIssue[];
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
    A: 90, // A: 90-100 (Highly reliable)
    B: 75, // B: 75-89 (Good reliability) - Adjusted to match SonarQube
    C: 60, // C: 60-74 (Moderate reliability) - Adjusted to match SonarQube
    D: 0   // D: <60 (Poor reliability) - Adjusted to match SonarQube
  }
};

// SonarQube-aligned issue severity weights
const issueSeverityWeights = {
  critical: 3, // Blocker issues (critical)
  major: 1,    // Major issues
  minor: 0     // Minor issues (no deduction)
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
    // Enhanced SonarQube-style reliability scoring with context awareness
    if (issues && issues.length > 0) {
      // Group similar issues to avoid duplicate penalties
      const groupedIssues = groupSimilarIssues(issues);
      
      // Calculate adjusted score using SonarQube-style severity weighting
      const baseScore = 100; // Start with perfect score
      let deductions = 0;
      
      // Apply weighted deductions based on grouped issues
      groupedIssues.forEach(group => {
        // Take the highest severity issue in the group
        const highestSeverityIssue = group.issues.reduce((highest, current) => {
          const currentWeight = issueSeverityWeights[current.type] || 0;
          const highestWeight = issueSeverityWeights[highest.type] || 0;
          return currentWeight > highestWeight ? current : highest;
        }, group.issues[0]);
        
        // Apply deduction based on severity weight and context
        const severityWeight = issueSeverityWeights[highestSeverityIssue.type] || 0;
        
        // Apply context-based reduction factors
        const contextFactor = getContextReductionFactor(group.issues);
        
        // Calculate final deduction for this group
        const groupDeduction = severityWeight * contextFactor;
        deductions += groupDeduction;
      });
      
      // Ensure deductions don't exceed reasonable limits
      const cappedDeductions = Math.min(deductions, 40); // Cap max deductions to 40 points
      
      // Calculate final reliability score
      score = baseScore - cappedDeductions;
      
      // Build issues list and improvements from grouped issues
      issuesList = groupedIssues.flatMap(group => 
        group.issues.slice(0, 1).map(issue => issue.description)
      );
      
      improvements = generateReliabilityImprovements(groupedIssues);
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

// Helper function to group similar issues to avoid duplicate penalties
function groupSimilarIssues(issues: ReliabilityIssue[]) {
  const groups: { key: string; issues: ReliabilityIssue[] }[] = [];
  
  // Group by category and similar description
  issues.forEach(issue => {
    // Create a normalized key for grouping similar issues
    const normalizedDescription = issue.description
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\b(line|at|on)\s+\d+\b/g, ''); // Remove line numbers
      
    const groupKey = `${issue.category}_${normalizedDescription}`;
    
    // Find existing group or create new one
    const existingGroup = groups.find(group => group.key === groupKey);
    if (existingGroup) {
      existingGroup.issues.push(issue);
    } else {
      groups.push({ key: groupKey, issues: [issue] });
    }
  });
  
  return groups;
}

// Helper function to determine context-based reduction factor
function getContextReductionFactor(issues: ReliabilityIssue[]): number {
  // Default factor
  let factor = 1.0;
  
  // Adjust factor based on context
  const firstIssue = issues[0];
  
  // Check for issues in test files
  if (firstIssue.description.toLowerCase().includes('test')) {
    factor *= 0.5; // Reduce impact by 50% for test code
  }
  
  // Check for issues in error handling blocks
  if (firstIssue.description.toLowerCase().includes('catch') || 
      firstIssue.description.toLowerCase().includes('try')) {
    factor *= 0.7; // Reduce impact by 30% for error handling code
  }
  
  // Check for issues in helper functions
  if (firstIssue.description.toLowerCase().includes('helper') || 
      firstIssue.description.toLowerCase().includes('util')) {
    factor *= 0.8; // Reduce impact by 20% for utility code
  }
  
  // Lower impact for issues that appear in multiple similar locations
  if (issues.length > 1) {
    factor *= 0.9; // Slight reduction for repeated similar issues
  }
  
  return factor;
}

// Generate improvement recommendations based on grouped issues
function generateReliabilityImprovements(groupedIssues: { key: string; issues: ReliabilityIssue[] }[]): string[] {
  const improvements: string[] = [];
  
  // Generate specific improvements based on issue categories
  const runtimeIssues = groupedIssues.filter(g => g.issues[0].category === 'runtime');
  const exceptionIssues = groupedIssues.filter(g => g.issues[0].category === 'exception');
  const structureIssues = groupedIssues.filter(g => g.issues[0].category === 'structure');
  const readabilityIssues = groupedIssues.filter(g => g.issues[0].category === 'readability');
  
  if (runtimeIssues.length > 0) {
    improvements.push('Fix potential runtime errors by adding proper validation');
    if (runtimeIssues.length > 1) {
      improvements.push('Implement defensive programming practices to handle edge cases');
    }
  }
  
  if (exceptionIssues.length > 0) {
    improvements.push('Add try-catch blocks around risky operations');
    if (exceptionIssues.length > 1) {
      improvements.push('Create a centralized error handling strategy');
    }
  }
  
  if (structureIssues.length > 0) {
    improvements.push('Improve code structure to reduce complexity');
    if (structureIssues.length > 1) {
      improvements.push('Extract complex logic into smaller, well-named functions');
    }
  }
  
  if (readabilityIssues.length > 0) {
    improvements.push('Enhance code readability with better naming and comments');
  }
  
  // Add general recommendation if there are multiple issue types
  if ((runtimeIssues.length + exceptionIssues.length + structureIssues.length + readabilityIssues.length) > 2) {
    improvements.push('Consider a comprehensive code review to address all reliability concerns');
  }
  
  return improvements;
}

// Helper function to categorize and group reliability issues using SonarQube-like categories
export const categorizeReliabilityIssues = (issues: ReliabilityIssue[]) => {
  // Enhanced categorization with SonarQube terminology
  const categories = [
    { 
      name: 'Bugs - Critical', 
      issues: issues.filter(i => i.category === 'runtime' && i.type === 'critical'),
      severity: 'critical'
    },
    { 
      name: 'Bugs - Exception Handling', 
      issues: issues.filter(i => i.category === 'exception'),
      severity: 'major'
    },
    { 
      name: 'Code Smells - Structure', 
      issues: issues.filter(i => i.category === 'structure'),
      severity: i => i.type
    },
    { 
      name: 'Code Smells - Maintainability', 
      issues: issues.filter(i => i.category === 'readability'),
      severity: 'minor'
    }
  ].filter(category => category.issues.length > 0);
  
  return categories;
};
