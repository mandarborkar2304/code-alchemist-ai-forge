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
  detectCriticalPattern
} from './scoringUtils';

/** Main reliability scoring function with enhanced critical issue handling */
export function calculateReliabilityScore(
  issues?: ReliabilityIssue[]
): { score: number; letter: ScoreGrade } {
  if (!issues || issues.length === 0) {
    console.log('No issues found, returning perfect score');
    return { score: 100, letter: 'A' };
  }

  console.log('=== Starting Reliability Score Calculation ===');
  console.log('Input issues:', issues.map(i => ({ desc: i.description, type: i.type, category: i.category })));

  const groups = groupSimilarIssues(issues);
  let totalDeduction = 0;
  let criticalIssueCount = 0;
  let hasCrashRisk = false;

  console.log('Grouped into', groups.length, 'groups');

  for (const group of groups) {
    if (!group.issues || group.issues.length === 0) continue;

    const issue = group.issues[0];
    const originalSeverity = issue.type;
    const effectiveSeverity = getEffectiveSeverity(issue);
    
    console.log(`\n--- Processing Group ---`);
    console.log(`Issue: "${issue.description}"`);
    console.log(`Original severity: ${originalSeverity} -> Effective: ${effectiveSeverity}`);
    console.log(`Group size: ${group.issues.length}`);

    // Count critical issues and detect crash risks
    if (effectiveSeverity === 'critical') {
      criticalIssueCount++;
      
      // Check for confirmed crash patterns
      const hasCrashPattern = detectCriticalPattern(issue.description ?? '', issue.codeContext ?? '');
      if (hasCrashPattern) {
        hasCrashRisk = true;
        console.log('🔥 CRASH RISK DETECTED');
      }
    }

    const deduction = calculateGroupDeduction(group, effectiveSeverity);
    console.log(`Deduction for this group: ${deduction}`);
    
    totalDeduction += deduction;
  }

  console.log(`\n=== Scoring Summary ===`);
  console.log(`Total base deduction: ${totalDeduction}`);
  console.log(`Critical issues count: ${criticalIssueCount}`);
  console.log(`Has crash risk: ${hasCrashRisk}`);

  // Enhanced critical issue handling - force lower grades for serious problems
  let finalScore = 100 - totalDeduction;
  let forcedGrade: ScoreGrade | null = null;

  // Force D grade for confirmed crash risks or multiple critical issues
  if (hasCrashRisk || criticalIssueCount >= 2) {
    forcedGrade = 'D';
    finalScore = Math.min(finalScore, 35); // Cap at 35 for D grade
    console.log('🚨 Forcing D grade due to critical risks');
  }
  // Force C grade for single critical issue
  else if (criticalIssueCount >= 1) {
    forcedGrade = 'C';
    finalScore = Math.min(finalScore, 50); // Cap at 50 for C grade
    console.log('⚠️ Forcing C grade due to critical issue');
  }

  // Apply minimum score constraint
  finalScore = Math.max(ANALYSIS_CONSTANTS.RELIABILITY.MINIMUM_SCORE, finalScore);

  console.log(`Final score after constraints: ${finalScore}`);

  // Determine grade
  const calculatedGrade = calculateGradeFromScore(finalScore, scoreThresholds.reliability);
  const finalGrade = forcedGrade || calculatedGrade;

  console.log(`Calculated grade: ${calculatedGrade}, Final grade: ${finalGrade}`);
  console.log('=== End Reliability Calculation ===\n');

  return { score: finalScore, letter: finalGrade };
}

/** Enhanced critical issue detection */
function isConfirmedCriticalIssue(issue: ReliabilityIssue): boolean {
  if (!issue || issue.type !== 'critical') return false;

  const message = (issue.description ?? '').toLowerCase();
  const ctx = (issue.codeContext ?? '').toLowerCase();

  return detectCriticalPattern(message, ctx);
}

/** Final reliability rating generator with enhanced critical handling */
export function getReliabilityRating(score: number, issues?: ReliabilityIssue[]): ScoreData {
  const helperScore = calculateReliabilityScore(issues);

  // Always use the calculated score for more accurate assessment
  const finalScore = helperScore.score;
  const rating = helperScore.letter;

  console.log(`Final rating: ${rating} (${finalScore})`);

  // Force specific messaging for critical issues
  if (rating === 'D') {
    return {
      score: 'D',
      description: 'Critical reliability issues detected',
      reason: 'Code contains crash-prone patterns or multiple critical issues that pose significant reliability risks.',
      issues: issues?.map(i => i.description).filter(Boolean) ?? [],
      improvements: generateReliabilityImprovements(groupSimilarIssues(issues ?? [])),
      warningFlag: true
    };
  }

  if (rating === 'C') {
    return {
      score: 'C',
      description: 'Reliability concerns require attention',
      reason: 'Critical issues detected that could impact system stability and require immediate attention.',
      issues: issues?.map(i => i.description).filter(Boolean) ?? [],
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

  const warningFlag = needsReliabilityWarningFlag(
    rating,
    issues?.map(issue => ({
      type: issue?.type || 'minor',
      impact: issue?.impact || 1
    })) ?? []
  );

  const { description, reason } = generateReliabilityDescription(rating, warningFlag, finalScore);
  
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
