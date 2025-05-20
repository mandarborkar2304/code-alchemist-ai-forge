import { ReliabilityIssue, ScoreGrade } from '@/types';
import { calculateReliabilityScore } from './reliabilityHelpers';
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

// Calculates weight for an issue
function getIssueWeight(issue: ReliabilityIssue): number {
  if (!issue) return 0;

  const typeWeight = issueSeverityWeights[issue.type] ?? 1;
  const impactValue = typeof issue.impact === 'number' ? issue.impact / 3 : 0;

  let contextMultiplier = 1.0;
  const ctx = issue.codeContext?.trim() ?? '';

  if (
    ctx.startsWith('//') ||
    ctx.startsWith('/*') ||
    ctx.startsWith('*') ||
    ctx.startsWith('import') ||
    ctx.startsWith('const') ||
    ctx.startsWith('let') ||
    ctx.startsWith('var')
  ) {
    contextMultiplier = 0.3;
  }

  if (issue.pattern && !evaluatePatternRisk(issue.pattern, ctx)) {
    contextMultiplier = 0.05;
  }

  return Math.max(typeWeight, impactValue) * contextMultiplier;
}

// Detects confirmed critical issues with aggressive heuristics
function isConfirmedCriticalIssue(issue: ReliabilityIssue): boolean {
  if (!issue || issue.type !== 'critical') return false;

  const message = issue.description?.toLowerCase() || '';
  const ctx = issue.codeContext?.toLowerCase() || '';

  const descConfirmed =
    message.includes('uncaught exception') ||
    message.includes('unvalidated user input') ||
    message.includes('hardcoded credential') ||
    message.includes('sql injection') ||
    message.includes('resource leak') ||
    message.includes('divide by zero') ||
    message.includes('/ 0') ||
    message.includes('null pointer') ||
    message.includes('array index out of bounds') ||
    message.includes('crash') ||
    message.includes('runtime exception') ||
    message.includes('unhandled');

  const hasUncheckedDivision =
    ctx.includes('/') &&
    !ctx.includes('!= 0') &&
    !ctx.includes('!== 0') &&
    !ctx.includes('> 0') &&
    !ctx.match(/\/\s*\d+/) &&
    !ctx.includes('try');

  const hasUncheckedArrayAccess =
    ctx.match(/\[\w+\]/) &&
    !ctx.includes('.length') &&
    !ctx.match(/for\s*\(/) &&
    !ctx.includes('try') &&
    !ctx.match(/\[\d+\]/);

  const hasUncheckedNull =
    ctx.match(/\w+\.\w+/) &&
    !ctx.includes('?') &&
    !ctx.includes('if') &&
    !ctx.includes('===') &&
    !ctx.includes('try');

  return descConfirmed || hasUncheckedDivision || hasUncheckedArrayAccess || hasUncheckedNull;
}

// Deduction logic based on group impact and criticality
function calculateGroupDeduction(
  group: { issues: ReliabilityIssue[] },
  contextFactor: number,
  pathFactor: number
): number {
  if (!group || !Array.isArray(group.issues) || group.issues.length === 0) return 0;

  let groupImpact = 0;
  let highestSeverityIssue = group.issues[0];
  let falsePositives = 0;

  for (const issue of group.issues) {
    if (!issue) continue;

    const isFalsePositive =
      issue.pattern && issue.codeContext && !evaluatePatternRisk(issue.pattern, issue.codeContext);

    if (isFalsePositive) {
      falsePositives++;
      continue;
    }

    const weight = getIssueWeight(issue);
    const highestWeight = getIssueWeight(highestSeverityIssue);

    if (weight > highestWeight) highestSeverityIssue = issue;

    groupImpact += weight;
  }

  if (falsePositives > 0) {
    const ratio = falsePositives / group.issues.length;
    groupImpact *= 1 - ratio * 0.9;
  }

  let deduction = 0;

  if (highestSeverityIssue.type === 'critical') {
    deduction = isConfirmedCriticalIssue(highestSeverityIssue)
      ? Math.min(40, 10 + groupImpact * 2.5)
      : Math.min(ANALYSIS_CONSTANTS.RELIABILITY.MAJOR_DEDUCTION, 3 + groupImpact);
  } else if (highestSeverityIssue.type === 'major') {
    deduction = Math.min(ANALYSIS_CONSTANTS.RELIABILITY.MAJOR_DEDUCTION, 3 + groupImpact);
  } else {
    deduction = Math.min(ANALYSIS_CONSTANTS.RELIABILITY.MINOR_DEDUCTION, 0.8 + groupImpact / 2.5);
  }

  return deduction * contextFactor * pathFactor;
}

// Main reliability scoring function
export function getReliabilityRating(score: number, code: string, language: string, issues?: ReliabilityIssue[]): ScoreData {
  const helperScore = calculateReliabilityScore(issues, code, language, );

  // Early downgrade if helperScore letter is 'D'
  if (helperScore.letter === 'D') {
    return {
      score: 'D',
      description: 'Reliability concerns (severe issues detected)',
      reason: 'Critical crash-prone code paths identified',
      issues: issues.map(i => i.description),
      improvements: generateReliabilityImprovements(groupSimilarIssues(issues)),
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

  let calculatedScore = Math.max(0, score);
  let issuesList: string[] = [];
  let improvements: string[] = [];
  let warningFlag = false;

  if (issues && issues.length > 0) {
    const validated = issues.filter(issue =>
      issue.pattern && issue.codeContext
        ? evaluatePatternRisk(issue.pattern, issue.codeContext)
        : true
    );

    const grouped = groupSimilarIssues(validated);
    const baseScore = 100;
    let deductions = 0;

    const criticals = validated.filter(isConfirmedCriticalIssue);
    const criticalCount = criticals.length;

    // Fix Option 2: Immediate downgrade if criticals exist
    if (criticalCount > 0) {
      return {
        score: 'D',
        description: 'Reliability concerns (critical issues)',
        reason: 'One or more critical issues that may cause crashes were detected.',
        issues: issues.map(i => i.description),
        improvements: generateReliabilityImprovements(groupSimilarIssues(issues)),
        warningFlag: true
      };
    }

    for (const group of grouped) {
      const contextFactor = getContextReductionFactor(group.issues);
      const pathFactor = determinePathSensitivity(group.issues);
      deductions += calculateGroupDeduction(group, contextFactor, pathFactor);
    }

    if (deductions > 20) {
      const scaled = 20 + (Math.log(deductions - 19) / Math.log(2)) * 5;
      deductions = scaled;
    }

    // Note: Removed conservative scaling per Fix Option 3
    // deductions *= ANALYSIS_CONSTANTS.FACTORS.CONSERVATIVE_MODE; // now = 1.0

    const capped = Math.min(deductions, ANALYSIS_CONSTANTS.RELIABILITY.MAX_DEDUCTION);

    // 🧪 Debug log output for sanity check
    console.log({
      baseScore,
      deductions,
      criticalCount,
      capped,
      finalScore: baseScore - capped
    });

    // ❗️Removed score floor override to allow falling below D
    calculatedScore = baseScore - capped;

    issuesList = grouped
      .flatMap(group => group.issues.slice(0, 1).map(issue => issue.description))
      .filter(Boolean);

    improvements = generateReliabilityImprovements(grouped);
  } else {
    calculatedScore = 95;
  }

  const rating = getGradeFromScore(calculatedScore, scoreThresholds.reliability);

  warningFlag = needsReliabilityWarningFlag(
    rating,
    issues?.map(issue => ({
      type: issue?.type || 'minor',
      impact: issue?.impact || 1
    }))
  );

  const { description, reason } = generateReliabilityDescription(rating, warningFlag, calculatedScore);

  if (issuesList.length === 0) issuesList = getDefaultIssuesList(rating);
  if (improvements.length === 0) improvements = getDefaultImprovementsList(rating);

  return {
    score: rating,
    description,
    reason,
    issues: issuesList,
    improvements,
    warningFlag
  };
}

// Helpers for descriptions and recommendations
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
        'Implement input validation',
        'Add guards for potential edge cases'
      ];
    default:
      return [
        'Implement error handling for critical operations',
        'Add validation for inputs and parameters',
        'Consider a defensive programming approach'
      ];
  }
}
