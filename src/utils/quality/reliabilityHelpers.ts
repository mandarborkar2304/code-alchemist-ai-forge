
import { ReliabilityIssue } from '@/types';
import { IssueGroup, CategoryWithIssues } from './types';
import { issueSeverityWeights } from './scoreThresholds';

// Helper function to group similar issues to avoid duplicate penalties
export function groupSimilarIssues(issues: ReliabilityIssue[]): IssueGroup[] {
  const groups: IssueGroup[] = [];
  
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
export function getContextReductionFactor(issues: ReliabilityIssue[]): number {
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

// NEW: Helper function to determine path sensitivity factor
export function determinePathSensitivity(issues: ReliabilityIssue[]): number {
  // Default factor - assume all paths are equally likely
  let pathFactor = 1.0;
  
  const firstIssue = issues[0];
  const desc = firstIssue.description.toLowerCase();
  
  // Reduce penalty for issues in rarely executed exception paths
  if (desc.includes('exception path') || desc.includes('rare condition')) {
    pathFactor *= 0.6; // Significant reduction for unlikely execution paths
  }
  
  // Reduce penalty for issues that only occur in edge cases
  if (desc.includes('edge case') || desc.includes('boundary condition')) {
    pathFactor *= 0.8; // Moderate reduction for edge case paths
  }
  
  // Reduce penalty for issues protected by validation logic
  if (desc.includes('validated') || desc.includes('checked')) {
    pathFactor *= 0.7; // Reduced penalty for issues in validated contexts
  }
  
  // Increase factor for issues in main execution paths
  if (desc.includes('main path') || desc.includes('always executed')) {
    pathFactor = 1.0; // No reduction for main execution path issues
  }
  
  // Increase factor for unvalidated inputs in critical operations
  if ((desc.includes('unvalidated') || desc.includes('unchecked')) && 
      (desc.includes('input') || desc.includes('parameter'))) {
    pathFactor = 1.2; // Increased penalty for unvalidated inputs
  }
  
  return pathFactor;
}

// Generate improvement recommendations based on grouped issues
export function generateReliabilityImprovements(groupedIssues: IssueGroup[]): string[] {
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
export function categorizeReliabilityIssues(issues: ReliabilityIssue[]): CategoryWithIssues[] {
  // Enhanced categorization with SonarQube terminology
  const categories: CategoryWithIssues[] = [
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
}
