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

function getIssueWeight(issue: ReliabilityIssue): number {
  if (!issue) return 0;

  const typeWeight = issue.type && issueSeverityWeights[issue.type] 
    ? issueSeverityWeights[issue.type] 
    : 1;

  const impactValue = issue.impact && typeof issue.impact === 'number' 
    ? issue.impact / 3 
    : 0;

  let contextMultiplier = 1.0;

  if (issue.codeContext) {
    const trimmedContext = issue.codeContext.trim();
    if (
      trimmedContext.startsWith('//') ||
      trimmedContext.startsWith('/*') ||
      trimmedContext.startsWith('*') ||
      trimmedContext.startsWith('import') ||
      trimmedContext.startsWith('const') ||
      trimmedContext.startsWith('let') ||
      trimmedContext.startsWith('var')
    ) {
      contextMultiplier = 0.3;
    }

    if (issue.pattern && !evaluatePatternRisk(issue.pattern, issue.codeContext)) {
      contextMultiplier = 0.05;
    }
  }

  return Math.max(typeWeight, impactValue) * contextMultiplier;
}

function calculateGroupDeduction(
  group: { issues: ReliabilityIssue[] }, 
  contextFactor: number,
  pathFactor: number
): number {
  if (!group || !Array.isArray(group.issues) || group.issues.length === 0) return 0;

  let groupImpact = 0;
  let highestSeverityIssue = group.issues[0];
  let falsePositiveCount = 0;

  group.issues.forEach(issue => {
    if (!issue) return;

    const isFalsePositive = issue.codeContext && issue.pattern && 
                             !evaluatePatternRisk(issue.pattern, issue.codeContext);

    if (isFalsePositive) {
      falsePositiveCount++;
      return;
    }

    const currentWeight = getIssueWeight(issue);
    const highestWeight = getIssueWeight(highestSeverityIssue);

    if (currentWeight > highestWeight) {
      highestSeverityIssue = issue;
    }

    groupImpact += currentWeight;
  });

  if (group.issues.length > 0 && falsePositiveCount > 0) {
    const falsePositiveRatio = falsePositiveCount / group.issues.length;
    groupImpact *= (1 - falsePositiveRatio * 0.9);
  }

  let groupDeduction = 0;

  if (highestSeverityIssue.type === 'critical') {
    const isConfirmed = isConfirmedCriticalIssue(highestSeverityIssue);
    if (isConfirmed) {
      groupDeduction = Math.min(
        ANALYSIS_CONSTANTS.RELIABILITY.CRITICAL_DEDUCTION, 
        6 + (groupImpact * 1.5)
      ) * contextFactor * pathFactor;
    } else {
      groupDeduction = Math.min(
        ANALYSIS_CONSTANTS.RELIABILITY.MAJOR_DEDUCTION, 
        3 + groupImpact
      ) * contextFactor * pathFactor;
    }
  } else if (highestSeverityIssue.type === 'major') {
    groupDeduction = Math.min(
      ANALYSIS_CONSTANTS.RELIABILITY.MAJOR_DEDUCTION, 
      3 + groupImpact
    ) * contextFactor * pathFactor;
  } else {
    groupDeduction = Math.min(
      ANALYSIS_CONSTANTS.RELIABILITY.MINOR_DEDUCTION, 
      0.8 + (groupImpact / 2.5)
    ) * contextFactor * pathFactor;
  }

  return groupDeduction;
}

function isConfirmedCriticalIssue(issue: ReliabilityIssue): boolean {
  if (!issue || !issue.description || issue.type !== 'critical') return false;

  const desc = issue.description.toLowerCase();
  const codeContext = issue.codeContext || '';

  const descriptionBasedConfirmation = 
    desc.includes('uncaught exception') || 
    desc.includes('unvalidated user input') ||
    desc.includes('hardcoded credential') ||
    desc.includes('sql injection') ||
    desc.includes('resource leak');

  if (codeContext) {
    const hasUncheckedDivision = codeContext.includes('/') && 
                                  !codeContext.includes('!= 0') && 
                                  !codeContext.includes('!== 0') &&
                                  !codeContext.includes('> 0') &&
                                  !codeContext.match(/\/\s*\d+/) &&
                                  !codeContext.includes('try');

    const hasUncheckedArrayAccess = codeContext.match(/\[\w+\]/) && 
                                    !codeContext.includes('.length') &&
                                    !codeContext.match(/for\s*\(/) &&
                                    !codeContext.includes('try') &&
                                    !codeContext.match(/\[\d+\]/);

    const hasUncheckedNull = codeContext.match(/\w+\.\w+/) &&
                              !codeContext.includes('?') && 
                              !codeContext.includes('if') && 
                              !codeContext.includes('===') &&
                              !codeContext.includes('try');

    if (hasUncheckedDivision || hasUncheckedArrayAccess || hasUncheckedNull) {
      return true;
    }

    if (issue.pattern && !evaluatePatternRisk(issue.pattern, codeContext)) {
      return false;
    }

    return descriptionBasedConfirmation;
  }

  return descriptionBasedConfirmation && desc.includes('confirmed');
}

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
    default:
      description = 'Reliability concerns';
      reason = 'The code has significant reliability issues that should be addressed.';
  }

  description += ` (${calculatedScore.toFixed(1)})`;

  if (warningFlag) {
    description += ' ⚠️';
  }

  return { description, reason };
}

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
    default:
      return [
        'Several error paths lack proper handling',
        'Critical operations need validation',
        'Consider adding exception handling'
      ];
  }
}

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
    default:
      return [
        'Implement error handling for critical operations',
        'Add validation for inputs and parameters',
        'Consider a defensive programming approach'
      ];
  }
}

export function getReliabilityRating(score: number, issues?: ReliabilityIssue[]): ScoreData {
  if (score === undefined || score === null || !isFinite(score)) {
    console.warn('Invalid reliability score:', score);
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

  if (issues && Array.isArray(issues) && issues.length > 0) {
    const validatedIssues = issues.filter(issue => {
      if (issue && issue.pattern && issue.codeContext) {
        return evaluatePatternRisk(issue.pattern, issue.codeContext);
      }
      return true;
    });

    const groupedIssues = groupSimilarIssues(validatedIssues);
    const baseScore = 100;
    let deductions = 0;

    const confirmedCriticalIssues = validatedIssues.filter(isConfirmedCriticalIssue);
    const confirmedCriticalCount = confirmedCriticalIssues.length;

    groupedIssues.forEach(group => {
      const contextFactor = getContextReductionFactor(group.issues);
      const pathFactor = determinePathSensitivity(group.issues);
      const groupDeduction = calculateGroupDeduction(group, contextFactor, pathFactor);
      deductions += groupDeduction;
    });

    if (deductions > 20) {
      const logBase = 2.0;
      deductions = 20 + (Math.log(deductions - 19) / Math.log(logBase)) * 5;
    }

    if (confirmedCriticalCount > 0) {
      deductions = Math.min(deductions * (1 + confirmedCriticalCount * 0.15), ANALYSIS_CONSTANTS.RELIABILITY.MAX_DEDUCTION);
      deductions = Math.max(deductions, 12 + (confirmedCriticalCount * 4));
    } else {
      const majorIssueCount = validatedIssues.filter(i => i?.type === 'major').length;
      if (majorIssueCount > 0) {
        deductions = Math.max(deductions, 6 + (majorIssueCount * 1.5));
      }
    }

    const isStrictMode = false;

    if (!isStrictMode) {
      deductions *= ANALYSIS_CONSTANTS.FACTORS.CONSERVATIVE_MODE;
    }

    const cappedDeductions = Math.min(deductions, ANALYSIS_CONSTANTS.RELIABILITY.MAX_DEDUCTION);

    calculatedScore = Math.max(scoreThresholds.reliability.D, baseScore - cappedDeductions);

    issuesList = groupedIssues
      .flatMap(group => {
        const validIssues = group.issues.filter(issue => 
          !issue.pattern || !issue.codeContext || 
          evaluatePatternRisk(issue.pattern, issue.codeContext)
        );
        return validIssues.slice(0, 1).map(issue => issue.description);
      })
      .filter(Boolean);

    improvements = generateReliabilityImprovements(groupedIssues);
  } else {
    calculatedScore = 95;
  }

  calculatedScore = Math.max(calculatedScore, scoreThresholds.reliability.D);

  const rating = getGradeFromScore(calculatedScore, scoreThresholds.reliability);

  warningFlag = needsReliabilityWarningFlag(
    rating,
    issues?.map(issue => ({ 
      type: issue?.type || 'minor', 
      impact: issue?.impact || 1 
    }))
  );

  const { description, reason } = generateReliabilityDescription(rating, warningFlag, calculatedScore);

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
