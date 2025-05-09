
import { ReliabilityIssue } from '@/types';
import { ScoreData } from './types';
import { scoreThresholds, issueSeverityWeights, getGradeFromScore, needsReliabilityWarningFlag } from './scoreThresholds';
import { 
  groupSimilarIssues, 
  getContextReductionFactor, 
  generateReliabilityImprovements
} from './reliabilityHelpers';

export function getReliabilityRating(score: number, issues?: ReliabilityIssue[]): ScoreData {
  let calculatedScore = score;
  let issuesList: string[] = [];
  let improvements: string[] = [];
  let warningFlag = false;
  
  // Process issues if provided
  if (issues && issues.length > 0) {
    // Group similar issues to avoid duplicate penalties
    const groupedIssues = groupSimilarIssues(issues);
    
    // Calculate adjusted score using enhanced SonarQube-style severity weighting
    const baseScore = 100; // Start with perfect score
    let deductions = 0;
    
    // Apply weighted deductions based on grouped issues with enhanced criticality model
    groupedIssues.forEach(group => {
      // Calculate aggregate impact from all issues in the group
      let groupImpact = 0;
      let highestSeverityIssue = group.issues[0];
      
      // Find the highest severity issue and sum up impact scores
      group.issues.forEach(issue => {
        const currentWeight = issueSeverityWeights[issue.type] || 1;
        const highestWeight = issueSeverityWeights[highestSeverityIssue.type] || 1;
        
        // Track highest severity issue for reporting
        if (currentWeight > highestWeight) {
          highestSeverityIssue = issue;
        }
        
        // Add to group impact based on issue type and declared impact
        groupImpact += Math.max(currentWeight, issue.impact / 2);
      });
      
      // Apply context-based reduction factors
      const contextFactor = getContextReductionFactor(group.issues);
      
      // Calculate final deduction for this group with enhanced weighting
      // Critical issues get higher deductions (up to 20 points for a single critical issue)
      let groupDeduction = 0;
      
      if (highestSeverityIssue.type === 'critical') {
        // Critical issues result in substantial score reduction
        groupDeduction = Math.min(20, 10 + (groupImpact * 2)) * contextFactor;
      } else if (highestSeverityIssue.type === 'major') {
        // Major issues have significant impact
        groupDeduction = Math.min(15, 5 + groupImpact) * contextFactor;
      } else {
        // Minor issues have smaller impact
        groupDeduction = Math.min(5, 2 + (groupImpact / 2)) * contextFactor;
      }
      
      deductions += groupDeduction;
    });
    
    // Ensure deductions scale properly - critical issues should result in at least C rating
    if (deductions > 0) {
      const hasCriticalIssues = issues.some(i => i.type === 'critical');
      
      if (hasCriticalIssues) {
        // Ensure at least 30 points deduction for any critical issues
        deductions = Math.max(deductions, 30);
      }
      
      const hasMajorIssues = issues.some(i => i.type === 'major');
      if (hasMajorIssues && deductions < 15) {
        // Ensure at least 15 points deduction for any major issues
        deductions = Math.max(deductions, 15);
      }
    }
    
    // Ensure deductions don't exceed reasonable limits
    const cappedDeductions = Math.min(deductions, 60); // Cap max deductions to 60 points (allowing D rating)
    
    // Calculate final reliability score
    calculatedScore = Math.max(1, baseScore - cappedDeductions); // Ensure score is at least 1
    
    // Build issues list and improvements from grouped issues
    issuesList = groupedIssues.flatMap(group => 
      group.issues.slice(0, 1).map(issue => issue.description)
    );
    
    improvements = generateReliabilityImprovements(groupedIssues);
    
    // Check if the score warrants a warning flag (e.g., critical issues present but score still good)
    warningFlag = needsReliabilityWarningFlag(
      getGradeFromScore(calculatedScore, scoreThresholds.reliability),
      issues
    );
  }
  
  // Determine the grade based on the calculated score
  const rating = getGradeFromScore(calculatedScore, scoreThresholds.reliability);
  
  // Determine descriptions and additional information based on the rating
  let description = '';
  let reason = '';
  
  if (rating === 'A') {
    description = warningFlag ? 'Reliable with concerns' : 'Highly reliable';
    reason = warningFlag 
      ? 'The code is generally reliable but contains some concerning patterns.'
      : 'The code properly handles edge cases and potential error conditions.';
    if (improvements.length === 0) {
      improvements = ['Maintain robust error handling practices.'];
    }
  } else if (rating === 'B') {
    description = warningFlag ? 'Moderately reliable with risks' : 'Good reliability';
    reason = warningFlag
      ? 'The code has some significant reliability issues that should be addressed.'
      : 'The code handles most error scenarios but has some potential weak points.';
    if (issuesList.length === 0) {
      issuesList = ['Some error paths may not be fully handled.'];
    }
    if (improvements.length === 0) {
      improvements = ['Enhance error handling coverage', 'Add additional input validation.'];
    }
  } else if (rating === 'C') {
    description = 'Moderate reliability concerns';
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
  
  // Add warning indicator to description if flagged
  if (warningFlag) {
    description += " ⚠️";
  }
  
  return {
    score: rating,
    description,
    reason,
    issues: issuesList,
    improvements,
    warningFlag // Add the warning flag to the return data
  };
}
