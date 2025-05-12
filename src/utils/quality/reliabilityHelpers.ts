
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
  if (desc.includes('test') || (firstIssue.codeContext && firstIssue.codeContext.includes('test'))) {
    factor *= ANALYSIS_CONSTANTS.FACTORS.TEST_CODE; // Reduce impact for test code
  }
  
  // Check for issues in error handling blocks
  if (desc.includes('catch') || desc.includes('try') || 
      (firstIssue.codeContext && (firstIssue.codeContext.includes('catch') || firstIssue.codeContext.includes('try')))) {
    factor *= ANALYSIS_CONSTANTS.FACTORS.ERROR_HANDLING; // Reduce impact for error handling code
  }
  
  // Check for issues in helper functions
  if (desc.includes('helper') || desc.includes('util') || 
      (firstIssue.codeContext && (firstIssue.codeContext.includes('helper') || firstIssue.codeContext.includes('util')))) {
    factor *= ANALYSIS_CONSTANTS.FACTORS.UTILITY_CODE; // Reduce impact for utility code
  }
  
  // Lower impact for issues that appear in multiple similar locations
  if (issues.length > 1) {
    factor *= ANALYSIS_CONSTANTS.FACTORS.REPEATED_ISSUES; // Slight reduction for repeated issues
  }
  
  return factor;
}

// Enhanced helper to evaluate actual risk in detection patterns with regex-based matching
export function evaluatePatternRisk(issuePattern: string, codeContext: string): boolean {
  // Skip empty inputs
  if (!issuePattern || !codeContext) {
    return false;
  }

  // 1. Null/undefined references - only flag if actual dereferencing
  if (issuePattern.includes('null-unsafe') || issuePattern.includes('undefined')) {
    // Don't flag line 1 or imports for null refs
    if (codeContext.trim().startsWith('import') || codeContext.trim().match(/^(\/\/|\/\*|\*)/)) {
      return false;
    }
    
    // Don't flag declaration statements without dereferencing
    if (codeContext.trim().match(/^(const|let|var)\s+\w+\s*=/)) {
      return false;
    }
    
    // Don't flag parameter declarations
    if (codeContext.trim().match(/^\s*\w+\s*:/)) {
      return false;
    }
    
    // Only flag actual property/method access without checks
    const hasNullDereference = codeContext.match(/(\w+)\.\w+/) && 
                              !codeContext.includes('?.') && 
                              !codeContext.includes('??') &&
                              !codeContext.includes('!==') && 
                              !codeContext.includes('!=') &&
                              !codeContext.includes('if (') &&
                              !codeContext.includes('typeof');
                              
    return Boolean(hasNullDereference);
  }
  
  // 2. Division by zero - only flag if division is present without validation
  if (issuePattern.includes('division') || issuePattern.includes('divide')) {
    // Check if division operation exists
    const hasDivisionOp = codeContext.match(/\/\s*(\w+|\d+)/);
    if (!hasDivisionOp) return false;
    
    // Extract divisor
    const divisorMatch = codeContext.match(/\/\s*(\w+)/);
    if (!divisorMatch) {
      // Check if dividing by a literal number
      const literalMatch = codeContext.match(/\/\s*(\d+)/);
      if (literalMatch && literalMatch[1] !== '0') {
        return false; // Not a risk if dividing by non-zero literal
      }
      return literalMatch && literalMatch[1] === '0'; // Only flag literal division by zero
    }
    
    const divisor = divisorMatch[1];
    
    // Don't flag if there's validation for non-zero
    const hasValidation = codeContext.includes(`${divisor} !== 0`) || 
                         codeContext.includes(`${divisor} != 0`) || 
                         codeContext.includes(`${divisor} > 0`) ||
                         codeContext.includes(`if (${divisor})`) ||
                         codeContext.includes('try') ||
                         codeContext.includes('catch');
                         
    return !hasValidation;
  }
  
  // 3. Array bounds - only flag if accessing indices without validation
  if (issuePattern.includes('array') || issuePattern.includes('bounds')) {
    // Check if array indexing exists
    const hasArrayAccess = codeContext.match(/(\w+)\s*\[\s*(\w+|\d+)\s*\]/);
    if (!hasArrayAccess) return false;
    
    const array = hasArrayAccess[1];
    const index = hasArrayAccess[2];
    
    // Don't flag numeric literals within reasonable range
    if (index.match(/^\d+$/) && parseInt(index) < 1000) {
      return false;
    }
    
    // Don't flag if bounds checking exists
    const hasBoundsCheck = codeContext.includes(`${index} < ${array}.length`) || 
                          codeContext.includes(`${array}.length > ${index}`) || 
                          codeContext.includes(`${index} >= 0`) ||
                          codeContext.match(new RegExp(`for.*${index}.*${array}\\.length`)) ||
                          codeContext.includes('try') ||
                          codeContext.includes('catch');
                          
    // Don't flag if loop control variable
    const isLoopVariable = codeContext.match(new RegExp(`for.*${index}\\s*=.*${index}\\+\\+`));
    
    return !hasBoundsCheck && !isLoopVariable;
  }
  
  // 4. Input validation - only flag if it can lead to runtime exceptions
  if (issuePattern.includes('input') || issuePattern.includes('validation')) {
    // Check if there's user input handling
    const hasUserInput = codeContext.includes('input') || 
                        codeContext.includes('param') || 
                        codeContext.includes('arg');
    
    if (!hasUserInput) return false;
    
    // Check if there are risky operations that need validation
    const hasRiskyOps = codeContext.includes('.parse') || 
                       codeContext.includes('JSON') || 
                       codeContext.match(/\[\s*\w+\s*\]/) ||
                       codeContext.includes('/');
                       
    // Avoid flagging if there's no risky operation
    if (!hasRiskyOps) return false;
                       
    // Check if there's some validation
    const hasValidation = codeContext.includes('if') || 
                         codeContext.includes('typeof') || 
                         codeContext.includes('instanceof') || 
                         codeContext.includes('===') || 
                         codeContext.includes('!==') ||
                         codeContext.includes('try');
                         
    return hasRiskyOps && !hasValidation;
  }
  
  return true; // Default case - keep the original flagging
}

// Helper function to determine path sensitivity factor with improved control flow analysis
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
  const codeContext = firstIssue.codeContext || '';
  
  // Use advanced path analysis if context is available
  if (codeContext) {
    // Check for branch conditions that would prevent execution
    const hasBranchingConditions = codeContext.includes('if (') || 
                                  codeContext.includes('else ') || 
                                  codeContext.includes('switch(');
                                  
    // Check for type guards that would prevent errors
    const hasTypeGuards = codeContext.includes('typeof ') || 
                         codeContext.includes('instanceof ') || 
                         codeContext.match(/!=\s*null/) || 
                         codeContext.match(/!==\s*null/);
                         
    // Check for other safety mechanisms
    const hasTryCatch = codeContext.includes('try') && codeContext.includes('catch');
    
    // Apply appropriate factor reduction
    if (hasTryCatch) {
      pathFactor *= 0.4; // Significant reduction for code in try-catch
    }
    else if (hasBranchingConditions || hasTypeGuards) {
      pathFactor *= ANALYSIS_CONSTANTS.FACTORS.GUARDED_PATH;
    }
  } else {
    // If no context, use description-based heuristics as before
    // Reduce penalty for issues in rarely executed exception paths
    if (desc.includes('exception path') || desc.includes('rare condition')) {
      pathFactor *= ANALYSIS_CONSTANTS.FACTORS.RARE_PATH; 
    }
    
    // Reduce penalty for issues that only occur in edge cases
    if (desc.includes('edge case') || desc.includes('boundary condition')) {
      pathFactor *= ANALYSIS_CONSTANTS.FACTORS.EDGE_CASE;
    }
    
    // Reduce penalty for issues protected by validation logic
    if (desc.includes('validated') || desc.includes('checked')) {
      pathFactor *= ANALYSIS_CONSTANTS.FACTORS.VALIDATED_CODE;
    }
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
      if (filteredGroups.length === 1) {
        improvements.push('Add validation for potential runtime issues');
      } else if (filteredGroups.length > 1) {
        improvements.push('Implement defensive programming to prevent runtime errors');
      }
      break;
    case 'exception':
      if (filteredGroups.length === 1) {
        improvements.push('Consider adding exception handling');
      } else if (filteredGroups.length > 1) {
        improvements.push('Implement a consistent error handling strategy');
      }
      break;
    case 'structure':
      if (filteredGroups.length > 0) {
        improvements.push('Enhance code structure to improve reliability');
      }
      break;
    case 'readability':
      if (filteredGroups.length > 0) {
        improvements.push('Improve code clarity to reduce potential for errors');
      }
      break;
    default:
      // No specific improvements for unknown categories
  }
  
  return improvements;
}

// Generate improvement recommendations based on grouped issues
export function generateReliabilityImprovements(groupedIssues: IssueGroup[]): string[] {
  // Validate input
  if (!Array.isArray(groupedIssues) || groupedIssues.length === 0) {
    return [];
  }
  
  // Start with an empty improvements array
  const improvements: string[] = [];
  
  // Generate specific improvements based on issue categories
  const categories = ['runtime', 'exception', 'structure', 'readability'];
  categories.forEach(category => {
    const categoryImprovements = generateImprovementsByIssueType(groupedIssues, category);
    improvements.push(...categoryImprovements);
  });
  
  return improvements.length > 0 ? improvements : ['Consider implementing additional validation where appropriate'];
}

// Helper function to safely determine issue severity
function getSeverityLevel(issue: ReliabilityIssue): string {
  if (!issue) return 'minor';
  return issue.type || 'minor';
}

// Helper function to categorize and group reliability issues
export function categorizeReliabilityIssues(issues: ReliabilityIssue[]): CategoryWithIssues[] {
  // Validate input
  if (!Array.isArray(issues) || issues.length === 0) {
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
