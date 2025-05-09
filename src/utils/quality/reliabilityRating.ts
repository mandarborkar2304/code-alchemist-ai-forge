
import { ReliabilityIssue } from '@/types';
import { ScoreData } from './types';
import { scoreThresholds, issueSeverityWeights, getGradeFromScore } from './scoreThresholds';
import { 
  groupSimilarIssues, 
  getContextReductionFactor, 
  generateReliabilityImprovements
} from './reliabilityHelpers';

export function getReliabilityRating(score: number, issues?: ReliabilityIssue[]): ScoreData {
  let calculatedScore = score;
  let issuesList: string[] = [];
  let improvements: string[] = [];
  
  // Process issues if provided
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
    calculatedScore = baseScore - cappedDeductions;
    
    // Build issues list and improvements from grouped issues
    issuesList = groupedIssues.flatMap(group => 
      group.issues.slice(0, 1).map(issue => issue.description)
    );
    
    improvements = generateReliabilityImprovements(groupedIssues);
  }
  
  // Determine the grade based on the calculated score
  const rating = getGradeFromScore(calculatedScore, scoreThresholds.reliability);
  
  // Determine descriptions and additional information based on the rating
  let description = '';
  let reason = '';
  
  if (rating === 'A') {
    description = 'Highly reliable';
    reason = 'The code properly handles edge cases and potential error conditions.';
    if (improvements.length === 0) {
      improvements = ['Maintain robust error handling practices.'];
    }
  } else if (rating === 'B') {
    description = 'Good reliability';
    reason = 'The code handles most error scenarios but has some potential weak points.';
    if (issuesList.length === 0) {
      issuesList = ['Some error paths may not be fully handled.'];
    }
    if (improvements.length === 0) {
      improvements = ['Enhance error handling coverage', 'Add additional input validation.'];
    }
  } else if (rating === 'C') {
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
  
  return {
    score: rating,
    description,
    reason,
    issues: issuesList,
    improvements
  };
}
