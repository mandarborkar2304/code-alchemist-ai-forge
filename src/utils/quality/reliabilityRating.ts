import { ReliabilityIssue, ScoreGrade } from '@/types';
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
  determinePathSensitivity,
  evaluatePatternRisk,
  generateReliabilityImprovements,
  getEffectiveSeverity
} from './reliabilityHelpers';

/** Enhanced unified helper-based scoring logic with proper critical issue handling */
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
    const hasCrashPattern = evaluatePatternRisk(issue.description ?? '', issue.codeContext ?? '');
    const isConfirmedCritical = isConfirmedCriticalIssue(issue);
    
    console.log(`Crash pattern detected: ${hasCrashPattern}, Confirmed critical: ${isConfirmedCritical}`);

    if ((effectiveSeverity === 'critical' && hasCrashPattern) || isConfirmedCritical) {
      criticalCrashDetected = true;
      console.log('Critical crash detected - will force D grade');
    }

    const contextFactor = getContextReductionFactor(group.issues);
    const pathFactor = determinePathSensitivity(group.issues);
    const deduction = calculateGroupDeduction(group, contextFactor, pathFactor, effectiveSeverity);
    
    console.log(`Group deduction: ${deduction} (context: ${contextFactor}, path: ${pathFactor})`);
    
    totalDeduction += deduction;
  }

  console.log(`Total deduction: ${totalDeduction}, Critical crashes: ${criticalCrashDetected}, Critical count: ${criticalIssueCount}`);

  // Force D grade for critical crashes or multiple critical issues
  if (criticalCrashDetected || criticalIssueCount >= 2) {
    console.log('Forcing D grade due to critical issues');
    return { score: Math.max(0, 100 - totalDeduction), letter: 'D' };
  }

  const cappedDeduction = Math.min(totalDeduction, ANALYSIS_CONSTANTS.RELIABILITY.MAX_DEDUCTION);
  const finalScore = Math.max(0, 100 - cappedDeduction);

  console.log(`Final score: ${finalScore}, Capped deduction: ${cappedDeduction}`);

  const grade = getGradeFromScore(finalScore, scoreThresholds.reliability);
  
  console.log(`Calculated grade: ${grade}`);

  return { score: finalScore, letter: grade };
}

/** Enhanced critical issue detection with more aggressive patterns */
function isConfirmedCriticalIssue(issue: ReliabilityIssue): boolean {
  if (!issue || issue.type !== 'critical') return false;

  const message = (issue.description ?? '').toLowerCase();
  const ctx = (issue.codeContext ?? '').toLowerCase();

  console.log(`Checking critical issue: "${message}" with context: "${ctx}"`);

  // Aggressive critical pattern detection
  const criticalPatterns = [
    'uncaught exception',
    'unhandled exception',
    'runtime exception',
    'null pointer',
    'nullpointerexception',
    'divide by zero',
    'division by zero',
    'array index out of bounds',
    'buffer overflow',
    'memory leak',
    'segmentation fault',
    'access violation',
    'stack overflow',
    'infinite recursion',
    'deadlock',
    'race condition',
    'sql injection',
    'xss',
    'csrf',
    'hardcoded credential',
    'password in plain text',
    'security vulnerability',
    'crash',
    'fatal error',
    'critical error',
    'system failure'
  ];

  const descConfirmed = criticalPatterns.some(pattern => message.includes(pattern));

  // Enhanced code context analysis
  const hasUncheckedDivision = 
    ctx.includes('/') && 
    !ctx.includes('!= 0') && 
    !ctx.includes('!== 0') && 
    !ctx.includes('> 0') && 
    !ctx.includes('< 0') && 
    !ctx.match(/\/\s*[1-9]\d*/) && // not dividing by literal non-zero
    !ctx.includes('try') &&
    !ctx.includes('if');

  const hasUncheckedArrayAccess = 
    /\w+\[\w+\]/.test(ctx) && 
    !ctx.includes('.length') && 
    !ctx.includes('?.') &&
    !/for\s*\(/.test(ctx) && 
    !ctx.includes('try') && 
    !/\[\d+\]/.test(ctx) &&
    !ctx.includes('if');

  const hasUncheckedNull = 
    /\w+\.\w+/.test(ctx) && 
    !ctx.includes('?.') && 
    !ctx.includes('??') &&
    !ctx.includes('if') && 
    !ctx.includes('===') && 
    !ctx.includes('!==') &&
    !ctx.includes('try') &&
    !ctx.includes('typeof');

  const isConfirmed = descConfirmed || hasUncheckedDivision || hasUncheckedArrayAccess || hasUncheckedNull;
  
  console.log(`Critical issue confirmed: ${isConfirmed} (desc: ${descConfirmed}, div: ${hasUncheckedDivision}, array: ${hasUncheckedArrayAccess}, null: ${hasUncheckedNull})`);
  
  return isConfirmed;
}

/** Enhanced group deduction calculation with severity-aware penalties */
function calculateGroupDeduction(
  group: { issues: ReliabilityIssue[] },
  contextFactor: number,
  pathFactor: number,
  effectiveSeverity: string
): number {
  if (!group || !Array.isArray(group.issues) || group.issues.length === 0) return 0;

  const issueCount = group.issues.length;
  const severityWeight = issueSeverityWeights[effectiveSeverity] ?? 1;
  
  console.log(`Group deduction calc: count=${issueCount}, severity=${effectiveSeverity}, weight=${severityWeight}`);

  let baseDeduction = 0;

  // Enhanced severity-based deductions
  switch (effectiveSeverity) {
    case 'critical':
      // Critical issues should have significant impact
      baseDeduction = Math.min(50, 25 + (issueCount * 10));
      break;
    case 'major':
      baseDeduction = Math.min(25, 10 + (issueCount * 5));
      break;
    case 'minor':
      baseDeduction = Math.min(10, 2 + (issueCount * 1.5));
      break;
    default:
      baseDeduction = issueCount * 2;
  }

  // Apply context and path factors (but don't let them reduce critical issues too much)
  let adjustedDeduction = baseDeduction;
  
  if (effectiveSeverity === 'critical') {
    // For critical issues, apply reduced context/path factors to maintain impact
    adjustedDeduction *= Math.max(0.5, contextFactor * pathFactor);
  } else {
    adjustedDeduction *= contextFactor * pathFactor;
  }

  console.log(`Base deduction: ${baseDeduction}, Adjusted: ${adjustedDeduction}`);
  
  return Math.max(0, adjustedDeduction);
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

  let calculatedScore = Math.max(0, Math.min(score, 100));
  let issuesList: string[] = [];
  let improvements: string[] = [];
  let warningFlag = false;

  if (issues && issues.length > 0) {
    const validated = issues.filter(issue =>
      issue.pattern && issue.codeContext
        ? Number(evaluatePatternRisk(issue.pattern, issue.codeContext)) >= ANALYSIS_CONSTANTS.RELIABILITY.LOW_RISK_THRESHOLD
        : true
    );

    const grouped = groupSimilarIssues(validated);
    const baseScore = 100;
    let deductions = 0;

    const criticals = validated.filter(isConfirmedCriticalIssue);
    if (criticals.length > 0) {
      return {
        score: 'D',
        description: 'Reliability concerns (critical issues)',
        reason: 'One or more critical issues that may cause crashes were detected.',
        issues: issues.map(i => i.description),
        improvements: generateReliabilityImprovements(grouped),
        warningFlag: true
      };
    }

    for (const group of grouped) {
      const contextFactor = getContextReductionFactor(group.issues);
      const pathFactor = determinePathSensitivity(group.issues);
      deductions += calculateGroupDeduction(group, contextFactor, pathFactor, getEffectiveSeverity(group.issues[0]));
    }

    if (deductions > 20) {
      deductions = 20 + (Math.log(deductions - 19) / Math.log(2)) * 5;
    }

    const capped = Math.min(deductions, ANALYSIS_CONSTANTS.RELIABILITY.MAX_DEDUCTION);
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
    })) ?? []
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
