
import { ReliabilityIssue } from '@/types';
import { IssueGroup, CategoryWithIssues } from './types';
import { issueSeverityWeights, ANALYSIS_CONSTANTS } from './scoreThresholds';

// Helper function to safely normalize strings for comparison
function normalizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\b(line|at|on)\s+\d+\b/g, ''); // Remove line numbers
}

// Helper function to group similar issues to avoid duplicate penalties
export function groupSimilarIssues(issues: ReliabilityIssue[]): IssueGroup[] {
  // Validate input
  if (!Array.isArray(issues)) {
    console.warn('Invalid issues array provided to groupSimilarIssues');
    return [];
  }
  
  const groups: IssueGroup[] = [];
  
  // Group by category and similar description
  issues.forEach(issue => {
    if (!issue) return; // Skip null/undefined issues
    
    // Create a normalized key for grouping similar issues
    const normalizedDescription = normalizeString(issue.description);
    const category = issue.category || 'unknown';
    const groupKey = `${category}_${normalizedDescription}`;
    
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
export function getContextReductionFactor(issues: ReliabilityIssue[]): number {
  // Validate input
  if (!Array.isArray(issues) || issues.length === 0) {
    return 1.0; // Default factor for invalid input
  }
  
  // Default factor
  let factor = 1.0;
  
  // Adjust factor based on context
  const firstIssue = issues[0];
  if (!firstIssue) return factor;
  
  const desc = normalizeString(firstIssue.description);
  
  // Check for issues in test files
  if (desc.includes('test')) {
    factor *= ANALYSIS_CONSTANTS.FACTORS.TEST_CODE; // Reduce impact for test code
  }
  
  // Check for issues in error handling blocks
  if (desc.includes('catch') || desc.includes('try')) {
    factor *= ANALYSIS_CONSTANTS.FACTORS.ERROR_HANDLING; // Reduce impact for error handling code
  }
  
  // Check for issues in helper functions
  if (desc.includes('helper') || desc.includes('util')) {
    factor *= ANALYSIS_CONSTANTS.FACTORS.UTILITY_CODE; // Reduce impact for utility code
  }
  
  // Lower impact for issues that appear in multiple similar locations
  if (issues.length > 1) {
    factor *= ANALYSIS_CONSTANTS.FACTORS.REPEATED_ISSUES; // Slight reduction for repeated issues
  }
  
  return factor;
}

// Helper function to determine path sensitivity factor
export function determinePathSensitivity(issues: ReliabilityIssue[]): number {
  // Validate input
  if (!Array.isArray(issues) || issues.length === 0) {
    return 1.0; // Default factor for invalid input
  }
  
  // Default factor - assume all paths are equally likely
  let pathFactor = 1.0;
  
  const firstIssue = issues[0];
  if (!firstIssue) return pathFactor;
  
  const desc = normalizeString(firstIssue.description);
  
  // Reduce penalty for issues in rarely executed exception paths
  if (desc.includes('exception path') || desc.includes('rare condition')) {
    pathFactor *= ANALYSIS_CONSTANTS.FACTORS.RARE_PATH; // Reduction for unlikely execution paths
  }
  
  // Reduce penalty for issues that only occur in edge cases
  if (desc.includes('edge case') || desc.includes('boundary condition')) {
    pathFactor *= ANALYSIS_CONSTANTS.FACTORS.EDGE_CASE; // Reduction for edge case paths
  }
  
  // Reduce penalty for issues protected by validation logic
  if (desc.includes('validated') || desc.includes('checked')) {
    pathFactor *= ANALYSIS_CONSTANTS.FACTORS.VALIDATED_CODE; // Reduced penalty for validated contexts
  }
  
  // Increase factor for issues in main execution paths
  if (desc.includes('main path') || desc.includes('always executed')) {
    pathFactor = 1.0; // No reduction for main execution path issues
  }
  
  // Increase factor for unvalidated inputs in critical operations
  if ((desc.includes('unvalidated') || desc.includes('unchecked')) && 
      (desc.includes('input') || desc.includes('parameter'))) {
    pathFactor = ANALYSIS_CONSTANTS.FACTORS.UNVALIDATED_INPUT; // Increased penalty for unvalidated inputs
  }
  
  return pathFactor;
}

// Generate improvement recommendations based on issue types
function generateImprovementsByIssueType(groups: IssueGroup[], category: string): string[] {
  const improvements: string[] = [];
  const filteredGroups = groups.filter(g => g.issues[0]?.category === category);
  
  if (filteredGroups.length === 0) return improvements;
  
  switch (category) {
    case 'runtime':
      improvements.push('Fix potential runtime errors by adding proper validation');
      if (filteredGroups.length > 1) {
        improvements.push('Implement defensive programming practices to handle edge cases');
      }
      break;
    case 'exception':
      improvements.push('Add try-catch blocks around risky operations');
      if (filteredGroups.length > 1) {
        improvements.push('Create a centralized error handling strategy');
      }
      break;
    case 'structure':
      improvements.push('Improve code structure to reduce complexity');
      if (filteredGroups.length > 1) {
        improvements.push('Extract complex logic into smaller, well-named functions');
      }
      break;
    case 'readability':
      improvements.push('Enhance code readability with better naming and comments');
      break;
    default:
      // No specific improvements for unknown categories
  }
  
  return improvements;
}

// Generate improvement recommendations based on grouped issues
export function generateReliabilityImprovements(groupedIssues: IssueGroup[]): string[] {
  // Validate input
  if (!Array.isArray(groupedIssues)) {
    return ['Implement comprehensive error handling and validation'];
  }
  
  // Start with an empty improvements array
  const improvements: string[] = [];
  
  // Generate specific improvements based on issue categories
  const categories = ['runtime', 'exception', 'structure', 'readability'];
  categories.forEach(category => {
    const categoryImprovements = generateImprovementsByIssueType(groupedIssues, category);
    improvements.push(...categoryImprovements);
  });
  
  // Add general recommendation if there are multiple issue types
  const issueTypes = new Set(groupedIssues.map(g => g.issues[0]?.category).filter(Boolean));
  
  if (issueTypes.size > 2) {
    improvements.push('Consider a comprehensive code review to address all reliability concerns');
  }
  
  return improvements;
}

// Helper function to safely determine issue severity
function getSeverityLevel(issue: ReliabilityIssue): string {
  if (!issue) return 'minor';
  return issue.type || 'minor';
}

// Helper function to categorize and group reliability issues
export function categorizeReliabilityIssues(issues: ReliabilityIssue[]): CategoryWithIssues[] {
  // Validate input
  if (!Array.isArray(issues)) {
    return [];
  }
  
  // Enhanced categorization with SonarQube terminology
  const categories: CategoryWithIssues[] = [
    { 
      name: 'Bugs - Critical', 
      issues: issues.filter(i => i?.category === 'runtime' && i?.type === 'critical'),
      severity: 'critical'
    },
    { 
      name: 'Bugs - Exception Handling', 
      issues: issues.filter(i => i?.category === 'exception'),
      severity: 'major'
    },
    { 
      name: 'Code Smells - Structure', 
      issues: issues.filter(i => i?.category === 'structure'),
      severity: i => getSeverityLevel(i)
    },
    { 
      name: 'Code Smells - Maintainability', 
      issues: issues.filter(i => i?.category === 'readability'),
      severity: 'minor'
    }
  ].filter(category => category.issues && category.issues.length > 0);
  
  return categories;
}
