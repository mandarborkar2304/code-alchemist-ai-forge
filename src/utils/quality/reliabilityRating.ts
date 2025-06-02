import { ReliabilityIssue, ScoreGrade } from '@/types';
import { ScoreData } from './types';
import {
  scoreThresholds,
  needsReliabilityWarningFlag,
  ANALYSIS_CONSTANTS
} from './scoreThresholds';
import {
  groupSimilarIssues,
  generateReliabilityImprovements,
  getEffectiveSeverity,
  calculateGroupDeduction
} from './reliabilityHelpers';
import {
  calculateGradeFromScore,
  detectCriticalPattern,
  calculateScaledDeduction
} from './scoringUtils';

/** Main reliability scoring function with unified logic */
export function calculateReliabilityScore(
  issues?: ReliabilityIssue[]
): { score: number; letter: ScoreGrade } {
  if (!issues || issues.length === 0) {
    return { score: 100, letter: 'A' };
  }

  console.log('Calculating reliability score for issues:', issues);

  const groups = groupSimilarIssues(issues);
  let totalDeduction = 0;
  let criticalCrashDetected = false;
  let criticalIssueCount = 0;

  console.log('Grouped issues:', groups);

  for (const group of groups) {
    if (!group.issues || group.issues.length === 0) continue;

    const issue = group.issues[0];
    const originalSeverity = issue.type;
    const effectiveSeverity = getEffectiveSeverity(issue);
    
    console.log(`Processing issue: ${issue.description}, original: ${originalSeverity}, effective: ${effectiveSeverity}`);

    // Count critical issues
    if (effectiveSeverity === 'critical') {
      criticalIssueCount++;
    }

    // Check for confirmed critical crash patterns
    const hasCrashPattern = detectCriticalPattern(issue.description ?? '', issue.codeContext ?? '');
    const isConfirmedCritical = isConfirmedCriticalIssue(issue);
    
    console.log(`Crash pattern detected: ${hasCrashPattern}, Confirmed critical: ${isConfirmedCritical}`);

    if ((effectiveSeverity === 'critical' && hasCrashPattern) || isConfirmedCritical) {
      criticalCrashDetected = true;
      console.log('Critical crash detected - will force D grade');
    }

    const deduction = calculateGroupDeduction(group, effectiveSeverity);
    console.log(`Group deduction: ${deduction}`);
    
    totalDeduction += deduction;
  }

  console.log(`Total deduction: ${totalDeduction}, Critical crashes: ${criticalCrashDetected}, Critical count: ${criticalIssueCount}`);

  // Force D grade for critical crashes or multiple critical issues
  if (criticalCrashDetected || criticalIssueCount >= 2) {
    console.log('Forcing D grade due to critical issues');
    return { score: Math.max(0, 100 - totalDeduction), letter: 'D' };
  }

  // Apply logarithmic scaling and enforce minimum score
  const scaledDeduction = calculateScaledDeduction(totalDeduction, ANALYSIS_CONSTANTS.RELIABILITY.MAX_DEDUCTION);
  let finalScore = Math.max(ANALYSIS_CONSTANTS.RELIABILITY.MINIMUM_SCORE, 100 - scaledDeduction);

  console.log(`Final score: ${finalScore}, Scaled deduction: ${scaledDeduction}`);

  const grade = calculateGradeFromScore(finalScore, scoreThresholds.reliability);
  
  console.log(`Calculated grade: ${grade}`);

  return { score: finalScore, letter: grade };
}

/** Enhanced critical issue detection */
function isConfirmedCriticalIssue(issue: ReliabilityIssue): boolean {
  if (!issue || issue.type !== 'critical') return false;

  const message = (issue.description ?? '').toLowerCase();
  const ctx = (issue.codeContext ?? '').toLowerCase();

  console.log(`Checking critical issue: "${message}" with context: "${ctx}"`);

  return detectCriticalPattern(message, ctx);
}

/** Final reliability rating generator */
export function getReliabilityRating(score: number, issues?: ReliabilityIssue[]): ScoreData {
  const helperScore = calculateReliabilityScore(issues);

  if (helperScore.letter === 'D') {
    return {
      score: 'D',
      description: 'Reliability concerns (severe issues detected)',
      reason: 'Critical crash-prone code paths identified',
      issues: issues?.map(i => i.description) ?? [],
      improvements: generateReliabilityImprovements(groupSimilarIssues(issues ?? [])),
      warningFlag: true
    };
  }

  if (!isFinite(score)) {
    return {
      score: 'C',
      description: 'Reliability could not be determined',
      reason: 'Unable to analyze the code reliability due to invalid input.',
      issues: ['Invalid reliability score provided'],
      improvements: ['Ensure valid metrics are available for analysis'],
      warningFlag: false
    };
  }

  // Use the helper score instead of the input score for more accurate assessment
  const calculatedScore = helperScore.score;
  const rating = helperScore.letter;

  const warningFlag = needsReliabilityWarningFlag(
    rating,
    issues?.map(issue => ({
      type: issue?.type || 'minor',
      impact: issue?.impact || 1
    })) ?? []
  );

  const { description, reason } = generateReliabilityDescription(rating, warningFlag, calculatedScore);
  
  const issuesList = issues?.length ? 
    groupSimilarIssues(issues)
      .flatMap(group => group.issues.slice(0, 1).map(issue => issue.description))
      .filter(Boolean) :
    getDefaultIssuesList(rating);

  const improvements = issues?.length ?
    generateReliabilityImprovements(groupSimilarIssues(issues)) :
    getDefaultImprovementsList(rating);

  return {
    score: rating,
    description,
    reason,
    issues: issuesList,
    improvements,
    warningFlag
  };
}

// Description generator based on final grade
function generateReliabilityDescription(
  rating: ScoreGrade,
  warningFlag: boolean,
  score: number
): { description: string; reason: string } {
  let description = '';
  let reason = '';

  switch (rating) {
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
    default:
      description = 'Reliability concerns';
      reason = 'The code has significant reliability issues that should be addressed.';
  }

  description += ` (${score.toFixed(1)})`;
  if (warningFlag) description += ' ⚠️';

  return { description, reason };
}

function getDefaultIssuesList(rating: ScoreGrade): string[] {
  switch (rating) {
    case 'A':
      return [];
    case 'B':
      return ['Consider adding additional error handling for edge cases.'];
    case 'C':
      return [
        'Some potential failure points may need more robust handling',
        'Consider additional validation for key operations'
      ];
    default:
      return [
        'Several error paths lack proper handling',
        'Critical operations need validation',
        'Consider adding exception handling'
      ];
  }
}

function getDefaultImprovementsList(rating: ScoreGrade): string[] {
  switch (rating) {
    case 'A':
      return ['Maintain robust error handling practices.'];
    case 'B':
      return ['Consider adding validation for edge cases', 'Document error handling approach.'];
    case 'C':
      return [
        'Add try-catch blocks for risky operations',
        'Improve input validation',
        'Add unit tests to cover error scenarios'
      ];
    default:
      return [
        'Refactor critical code paths to ensure exception safety',
        'Add comprehensive logging for failures',
        'Review code for null pointer and division risks'
      ];
  }
}
