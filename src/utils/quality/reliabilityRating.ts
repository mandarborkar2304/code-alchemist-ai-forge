
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
  determinePathSensitivity,
  evaluatePatternRisk
} from './reliabilityHelpers';

// Helper function to safely calculate issue weight with enhanced type inference
function getIssueWeight(issue: ReliabilityIssue): number {
  if (!issue) return 0;
  
  // Get weight based on issue type or default to 1
  const typeWeight = issue.type && issueSeverityWeights[issue.type] 
    ? issueSeverityWeights[issue.type] 
    : 1;
  
  // Use either the declared impact or a calculated one based on type
  const impactValue = issue.impact && typeof issue.impact === 'number' 
    ? issue.impact / 3 // Reduced impact by dividing by 3 instead of 2
    : 0;
  
  // Consider code context for more accurate weighting
  let contextMultiplier = 1.0;
  
  // If code context is provided, evaluate based on actual code
  if (issue.codeContext) {
    // Reduce weight for issues in comments, imports, or declarations
    if (
      issue.codeContext.trim().startsWith('//') ||
      issue.codeContext.trim().startsWith('/*') ||
      issue.codeContext.trim().startsWith('*') ||
      issue.codeContext.trim().startsWith('import') ||
      issue.codeContext.trim().startsWith('const') ||
      issue.codeContext.trim().startsWith('let') ||
      issue.codeContext.trim().startsWith('var')
    ) {
      contextMultiplier = 0.3; // Reduced from 0.5 to 0.3
    }
    
    // Validate if this is actually a risk based on pattern
    if (issue.pattern && !evaluatePatternRisk(issue.pattern, issue.codeContext)) {
      contextMultiplier = 0.05; // Significantly reduce weight for false positives (reduced further from 0.1)
    }
  }
  
  return Math.max(typeWeight, impactValue) * contextMultiplier;
}

// Helper function to calculate group deduction with enhanced control flow awareness
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
  let falsePositiveCount = 0;
  
  // Check each issue safely with enhanced detection
  group.issues.forEach(issue => {
    if (!issue) return;
    
    // Check if the issue is likely a false positive
    const isFalsePositive = issue.codeContext && issue.pattern && 
                           !evaluatePatternRisk(issue.pattern, issue.codeContext);
    
    if (isFalsePositive) {
      falsePositiveCount++;
      return; // Skip this issue for impact calculation
    }
    
    const currentWeight = getIssueWeight(issue);
    const highestWeight = getIssueWeight(highestSeverityIssue);
    
    // Track highest severity issue for reporting
    if (currentWeight > highestWeight) {
      highestSeverityIssue = issue;
    }
    
    // Add to group impact based on issue type and declared impact
    groupImpact += currentWeight;
  });
  
  // Adjust for false positives ratio - increased adjustment
  if (group.issues.length > 0 && falsePositiveCount > 0) {
    const falsePositiveRatio = falsePositiveCount / group.issues.length;
    groupImpact *= (1 - falsePositiveRatio * 0.9); // Increased from 0.8 to 0.9
  }
  
  // Calculate final deduction for this group with enhanced weighting
  let groupDeduction = 0;
  
  if (highestSeverityIssue.type === 'critical') {
    // Only penalize heavily if it's a confirmed critical issue
    const isConfirmed = isConfirmedCriticalIssue(highestSeverityIssue);
    
    if (isConfirmed) {
      groupDeduction = Math.min(
        ANALYSIS_CONSTANTS.RELIABILITY.CRITICAL_DEDUCTION, 
        6 + (groupImpact * 1.5) // Further reduced base impact from 8 to 6 and multiplier from 2 to 1.5
      ) * contextFactor * pathFactor;
    } else {
      // Unconfirmed critical issues are treated more like major issues
      groupDeduction = Math.min(
        ANALYSIS_CONSTANTS.RELIABILITY.MAJOR_DEDUCTION, 
        3 + groupImpact // Further reduced from 4 to 3
      ) * contextFactor * pathFactor;
    }
  } else if (highestSeverityIssue.type === 'major') {
    // Major issues have significant impact
    groupDeduction = Math.min(
      ANALYSIS_CONSTANTS.RELIABILITY.MAJOR_DEDUCTION, 
      3 + groupImpact // Further reduced from 4 to 3
    ) * contextFactor * pathFactor;
  } else {
    // Minor issues have smaller impact
    groupDeduction = Math.min(
      ANALYSIS_CONSTANTS.RELIABILITY.MINOR_DEDUCTION, 
      0.8 + (groupImpact / 2.5) // Further reduced from 1 to 0.8 and divisor increased from 2 to 2.5
    ) * contextFactor * pathFactor;
  }
  
  return groupDeduction;
}

// Enhanced helper function to check if an issue is confirmed critical with stronger verification
function isConfirmedCriticalIssue(issue: ReliabilityIssue): boolean {
  if (!issue || !issue.description || issue.type !== 'critical') {
    return false;
  }
  
  const desc = issue.description.toLowerCase();
  const codeContext = issue.codeContext || '';
  
  // First check description-based criteria with more specific keywords
  const descriptionBasedConfirmation = 
    desc.includes('uncaught exception') || 
    desc.includes('unvalidated user input') ||
    desc.includes('hardcoded credential') ||
    desc.includes('sql injection') ||
    desc.includes('resource leak');
  
  // If we have code context, perform more precise analysis
  if (codeContext) {
    // Check for specific patterns that confirm critical issues
    const hasUncheckedDivision = codeContext.includes('/') && 
                                !codeContext.includes('!= 0') && 
                                !codeContext.includes('!== 0') &&
                                !codeContext.includes('> 0') &&
                                !codeContext.match(/\/\s*\d+/) && // Exclude division by literal numbers
                                !codeContext.includes('try');
                                
    const hasUncheckedArrayAccess = codeContext.match(/\[\w+\]/) && 
                                   !codeContext.includes('.length') &&
                                   !codeContext.match(/for\s*\(/) &&
                                   !codeContext.includes('try') &&
                                   !codeContext.match(/\[\d+\]/); // Exclude access by literal index
                                   
    const hasUncheckedNull = codeContext.match(/\w+\.\w+/) &&
                            !codeContext.includes('?') && 
                            !codeContext.includes('if') && 
                            !codeContext.includes('===') &&
                            !codeContext.includes('try');
                            
    // Specifically identified critical patterns that are verified
    if (hasUncheckedDivision || hasUncheckedArrayAccess || hasUncheckedNull) {
      return true;
    }
    
    // Skip pattern-based verification for false positives
    if (issue.pattern && !evaluatePatternRisk(issue.pattern, codeContext)) {
      return false;
    }
    
    // Return description-based confirmation only if we have code context but no specific patterns
    return descriptionBasedConfirmation;
  }
  
  // If no code context, be more conservative with description-based flags
  return descriptionBasedConfirmation && desc.includes('confirmed');
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
      description = warningFlag ? 'Reliable with minor concerns' : 'Highly reliable';
      reason = warningFlag 
        ? 'The code is reliable with a few minor issues that could be improved.'
        : 'The code properly handles edge cases and potential error conditions.';
      break;
    case 'B':
      description = warningFlag ? 'Good reliability with some risks' : 'Good reliability';
      reason = warningFlag
        ? 'The code is generally reliable but has some potential weak points.'
        : 'The code handles most error scenarios with good practices.';
      break;
    case 'C':
      description = 'Moderate reliability';
      reason = 'The code has areas where reliability could be improved.';
      break;
    default: // 'D'
      description = 'Reliability concerns';
      reason = 'The code has significant reliability issues that should be addressed.';
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
      return ['Consider adding additional error handling for edge cases.'];
    case 'C':
      return [
        'Some potential failure points may need more robust handling',
        'Consider additional validation for key operations'
      ];
    default: // 'D'
      return [
        'Several error paths lack proper handling',
        'Critical operations need validation',
        'Consider adding exception handling'
      ];
  }
}

// Helper function for default improvements list for each rating grade
function getDefaultImprovementsList(rating: ScoreGrade): string[] {
  switch(rating) {
    case 'A':
      return ['Maintain robust error handling practices.'];
    case 'B':
      return ['Consider adding validation for edge cases', 'Document error handling approach.'];
    case 'C':
      return [
        'Add try-catch blocks for risky operations',
        'Implement input validation',
        'Add guards for potential edge cases'
      ];
    default: // 'D'
      return [
        'Implement error handling for critical operations',
        'Add validation for inputs and parameters',
        'Consider a defensive programming approach'
      ];
  }
}

// Main function for reliability rating assessment with enhanced control flow and type inference
export function getReliabilityRating(score: number, issues?: ReliabilityIssue[]): ScoreData {
  // Validate input
  if (score === undefined || score === null || !isFinite(score)) {
    console.warn('Invalid reliability score:', score);
    return {
      score: 'C', // Default to C instead of D for invalid input
      description: 'Reliability could not be determined',
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
    // Filter out probable false positives before grouping
    const validatedIssues = issues.filter(issue => {
      // Skip issues that are likely false positives based on our enhanced detection
      if (issue && issue.pattern && issue.codeContext) {
        return evaluatePatternRisk(issue.pattern, issue.codeContext);
      }
      return true; // Keep issues without context data
    });
    
    // Group similar issues to avoid duplicate penalties
    const groupedIssues = groupSimilarIssues(validatedIssues);
    
    // Calculate adjusted score using enhanced SonarQube-style severity weighting
    const baseScore = 100; // Start with perfect score
    let deductions = 0;
    
    // Count confirmed critical issues
    const confirmedCriticalIssues = validatedIssues.filter(isConfirmedCriticalIssue);
    const confirmedCriticalCount = confirmedCriticalIssues.length;
    
    // Apply weighted deductions based on grouped issues with enhanced criticality model
    groupedIssues.forEach(group => {
      // Calculate context and path factors
      const contextFactor = getContextReductionFactor(group.issues);
      const pathFactor = determinePathSensitivity(group.issues);
      
      // Calculate group deduction using helper function
      const groupDeduction = calculateGroupDeduction(group, contextFactor, pathFactor);
      deductions += groupDeduction;
    });
    
    // Apply stronger logarithmic scaling to deductions to avoid excessive penalties
    if (deductions > 20) { // Lowered threshold from 30 to 20
      const logBase = 2.0; // Increased from 1.5 to 2.0 for more aggressive scaling
      const scaledDeduction = 20 + (Math.log(deductions - 19) / Math.log(logBase)) * 5;
      deductions = scaledDeduction;
    }
    
    // Ensure deductions scale properly based on confirmed critical issues
    if (confirmedCriticalCount > 0) {
      // Scale deduction based on number of critical issues, but avoid automatic D rating
      const criticalMultiplier = 1 + (confirmedCriticalCount * 0.15); // Reduced from 0.2 to 0.15
      deductions = Math.min(deductions * criticalMultiplier, ANALYSIS_CONSTANTS.RELIABILITY.MAX_DEDUCTION);
      
      // Ensure at least moderate penalty for confirmed critical issues
      deductions = Math.max(deductions, 12 + (confirmedCriticalCount * 4)); // Reduced from 15+5 to 12+4
    } else {
      // Check for major issues
      const majorIssueCount = validatedIssues.filter(i => i?.type === 'major').length;
      if (majorIssueCount > 0) {
        // Ensure some penalty for major issues but don't be too harsh
        deductions = Math.max(deductions, 6 + (majorIssueCount * 1.5)); // Reduced from 8+2 to 6+1.5
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
    
    // Calculate final reliability score with minimum value based on threshold
    // Use the D threshold from scoreThresholds instead of hardcoded value
    calculatedScore = Math.max(scoreThresholds.reliability.D, baseScore - cappedDeductions);
    
    // Build issues list from grouped issues, focusing on validated issues
    issuesList = groupedIssues
      .flatMap(group => {
        // Get first issue from the group, but ensure it's not a false positive
        const validIssues = group.issues.filter(issue => 
          !issue.pattern || !issue.codeContext || 
          evaluatePatternRisk(issue.pattern, issue.codeContext)
        );
        
        return validIssues.slice(0, 1).map(issue => issue.description);
      })
      .filter(Boolean);
    
    // Generate improvements from grouped issues
    improvements = generateReliabilityImprovements(groupedIssues);
  } else {
    // If no issues provided, use a default base score with slight deduction
    calculatedScore = 95; // Default high score with no issues
  }
  
  // Ensure score meets threshold requirements
  calculatedScore = Math.max(calculatedScore, scoreThresholds.reliability.D);
  
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
