
import { ReliabilityIssue } from '@/types';
import { ScoreGrade } from '@/types';
import { ScoreData } from './types';
import { 
  scoreThresholds, 
  issueSeverityWeights, 
  getGradeFromScore, 
  needsReliabilityWarningFlag,
  ANALYSIS_CONSTANTS
} from './scoreThresholds';
import { 
  groupSimilarIssues, 
  getContextReductionFactor, 
  generateReliabilityImprovements,
  determinePathSensitivity
} from './reliabilityHelpers';

// Helper function to safely calculate issue weight
function getIssueWeight(issue: ReliabilityIssue): number {
  if (!issue) return 0;
  
  // Get weight based on issue type or default to 1
  const typeWeight = issue.type && issueSeverityWeights[issue.type] 
    ? issueSeverityWeights[issue.type] 
    : 1;
  
  // Use either the declared impact or a calculated one based on type
  const impactValue = issue.impact && typeof issue.impact === 'number' 
    ? issue.impact / 2 
    : 0;
  
  return Math.max(typeWeight, impactValue);
}

// Helper function to calculate group deduction
function calculateGroupDeduction(
  group: { issues: ReliabilityIssue[] }, 
  contextFactor: number,
  pathFactor: number
): number {
  // Validate input
  if (!group || !Array.isArray(group.issues) || group.issues.length === 0) {
    return 0;
  }
  
  // Calculate aggregate impact and find highest severity
  let groupImpact = 0;
  let highestSeverityIssue = group.issues[0];
  
  // Check each issue safely
  group.issues.forEach(issue => {
    if (!issue) return;
    
    const currentWeight = getIssueWeight(issue);
    const highestWeight = getIssueWeight(highestSeverityIssue);
    
    // Track highest severity issue for reporting
    if (currentWeight > highestWeight) {
      highestSeverityIssue = issue;
    }
    
    // Add to group impact based on issue type and declared impact
    groupImpact += currentWeight;
  });
  
  // Calculate final deduction for this group with enhanced weighting
  let groupDeduction = 0;
  
  if (highestSeverityIssue.type === 'critical') {
    // Critical issues result in substantial score reduction
    // Path sensitivity reduces penalty for unlikely execution paths
    groupDeduction = Math.min(
      ANALYSIS_CONSTANTS.RELIABILITY.CRITICAL_DEDUCTION, 
      10 + (groupImpact * 2)
    ) * contextFactor * pathFactor;
  } else if (highestSeverityIssue.type === 'major') {
    // Major issues have significant impact
    groupDeduction = Math.min(
      ANALYSIS_CONSTANTS.RELIABILITY.MAJOR_DEDUCTION, 
      5 + groupImpact
    ) * contextFactor * pathFactor;
  } else {
    // Minor issues have smaller impact
    groupDeduction = Math.min(
      ANALYSIS_CONSTANTS.RELIABILITY.MINOR_DEDUCTION, 
      2 + (groupImpact / 2)
    ) * contextFactor * pathFactor;
  }
  
  return groupDeduction;
}

// Helper function to check if an issue is confirmed critical
function isConfirmedCriticalIssue(issue: ReliabilityIssue): boolean {
  if (!issue || !issue.description || issue.type !== 'critical') {
    return false;
  }
  
  const desc = issue.description.toLowerCase();
  
  return (
    desc.includes('unchecked exception') || 
    desc.includes('unvalidated input') ||
    desc.includes('hardcoded fault')
  );
}

// Helper function to determine appropriate description and reason
function generateReliabilityDescription(
  rating: ScoreGrade, 
  warningFlag: boolean,
  calculatedScore: number
): { description: string; reason: string } {
  let description: string;
  let reason: string;
  
  switch(rating) {
    case 'A':
      description = warningFlag ? 'Reliable with concerns' : 'Highly reliable';
      reason = warningFlag 
        ? 'The code is generally reliable but contains some concerning patterns.'
        : 'The code properly handles edge cases and potential error conditions.';
      break;
    case 'B':
      description = warningFlag ? 'Moderately reliable with risks' : 'Good reliability';
      reason = warningFlag
        ? 'The code has some significant reliability issues that should be addressed.'
        : 'The code handles most error scenarios but has some potential weak points.';
      break;
    case 'C':
      description = 'Moderate reliability concerns';
      reason = 'The code has several reliability issues that should be addressed.';
      break;
    default: // 'D'
      description = 'Poor reliability';
      reason = 'The code has numerous reliability issues creating a high risk of runtime failures.';
  }
  
  // Add score information for transparency
  description += ` (${calculatedScore.toFixed(1)})`;
  
  // Add warning indicator to description if flagged
  if (warningFlag) {
    description += " ⚠️";
  }
  
  return { description, reason };
}

// Helper function for default issues lists for each rating grade
function getDefaultIssuesList(rating: ScoreGrade): string[] {
  switch(rating) {
    case 'A':
      return [];
    case 'B':
      return ['Some error paths may not be fully handled.'];
    case 'C':
      return [
        'Multiple potential failure points without proper handling',
        'Key edge cases not considered'
      ];
    default: // 'D'
      return [
        'Minimal error handling',
        'Unsafe operations without validation',
        'Multiple potential crash points'
      ];
  }
}

// Helper function for default improvements list for each rating grade
function getDefaultImprovementsList(rating: ScoreGrade): string[] {
  switch(rating) {
    case 'A':
      return ['Maintain robust error handling practices.'];
    case 'B':
      return ['Enhance error handling coverage', 'Add additional input validation.'];
    case 'C':
      return [
        'Implement try-catch blocks for risky operations',
        'Validate inputs more thoroughly',
        'Handle edge cases explicitly'
      ];
    default: // 'D'
      return [
        'Implement comprehensive error handling',
        'Validate all inputs and parameters',
        'Handle all potential error states explicitly'
      ];
  }
}

// Main function for reliability rating assessment
export function getReliabilityRating(score: number, issues?: ReliabilityIssue[]): ScoreData {
  // Validate input
  if (score === undefined || score === null || !isFinite(score)) {
    console.warn('Invalid reliability score:', score);
    return {
      score: 'D',
      description: 'Invalid reliability',
      reason: 'Unable to analyze the code reliability due to invalid input.',
      issues: ['Invalid reliability score provided'],
      improvements: ['Ensure valid metrics are available for analysis'],
      warningFlag: false
    };
  }
  
  // Use safe non-negative value
  let calculatedScore = Math.max(0, score);
  let issuesList: string[] = [];
  let improvements: string[] = [];
  let warningFlag = false;
  
  // Process issues if provided
  if (issues && Array.isArray(issues) && issues.length > 0) {
    // Group similar issues to avoid duplicate penalties
    const groupedIssues = groupSimilarIssues(issues);
    
    // Calculate adjusted score using enhanced SonarQube-style severity weighting
    const baseScore = 100; // Start with perfect score
    let deductions = 0;
    
    // Apply weighted deductions based on grouped issues with enhanced criticality model
    groupedIssues.forEach(group => {
      // Calculate context and path factors
      const contextFactor = getContextReductionFactor(group.issues);
      const pathFactor = determinePathSensitivity(group.issues);
      
      // Calculate group deduction using helper function
      const groupDeduction = calculateGroupDeduction(group, contextFactor, pathFactor);
      deductions += groupDeduction;
    });
    
    // Ensure deductions scale properly - critical issues should result in at least C rating
    if (deductions > 0) {
      const hasCriticalIssues = issues.some(i => i?.type === 'critical');
      
      if (hasCriticalIssues) {
        // Check for confirmed critical issues vs. potential ones
        const confirmedCriticalIssues = issues.filter(isConfirmedCriticalIssue);
        
        if (confirmedCriticalIssues.length > 0) {
          // Ensure at least 30 points deduction for confirmed critical issues
          deductions = Math.max(deductions, 30);
        } else {
          // Potential but unconfirmed critical issues get reduced penalty
          deductions = Math.max(deductions, 20);
        }
      }
      
      const hasMajorIssues = issues.some(i => i?.type === 'major');
      if (hasMajorIssues && deductions < 15) {
        // Ensure at least 15 points deduction for any major issues
        deductions = Math.max(deductions, 15);
      }
    }
    
    // Apply scoring mode configuration - strict vs. conservative
    // In a real implementation, this would come from a configuration
    const isStrictMode = false; 
    
    if (!isStrictMode) {
      // In conservative mode, cap deductions more generously
      deductions = deductions * ANALYSIS_CONSTANTS.FACTORS.CONSERVATIVE_MODE;
    }
    
    // Ensure deductions don't exceed reasonable limits
    // Cap max deductions to prevent unreasonably low scores
    const cappedDeductions = Math.min(deductions, ANALYSIS_CONSTANTS.RELIABILITY.MAX_DEDUCTION); 
    
    // Calculate final reliability score with minimum value of 1
    calculatedScore = Math.max(1, baseScore - cappedDeductions);
    
    // Build issues list from grouped issues
    issuesList = groupedIssues
      .flatMap(group => group.issues.slice(0, 1).map(issue => issue.description))
      .filter(Boolean);
    
    // Generate improvements from grouped issues
    improvements = generateReliabilityImprovements(groupedIssues);
  }
  
  // Determine the grade based on the calculated score
  const rating = getGradeFromScore(calculatedScore, scoreThresholds.reliability);
  
  // Check if the score warrants a warning flag
  warningFlag = needsReliabilityWarningFlag(
    rating,
    issues?.map(issue => ({ 
      type: issue?.type || 'minor', 
      impact: issue?.impact || 1 
    }))
  );
  
  // Generate descriptions based on rating
  const { description, reason } = generateReliabilityDescription(
    rating, 
    warningFlag,
    calculatedScore
  );
  
  // Use default lists if none were generated
  if (issuesList.length === 0) {
    issuesList = getDefaultIssuesList(rating);
  }
  
  if (improvements.length === 0) {
    improvements = getDefaultImprovementsList(rating);
  }
  
  return {
    score: rating,
    description,
    reason,
    issues: issuesList,
    improvements,
    warningFlag
  };
}
