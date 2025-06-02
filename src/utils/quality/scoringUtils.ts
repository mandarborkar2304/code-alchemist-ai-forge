import { ScoreGrade, ReliabilityIssue } from '@/types';
import { ANALYSIS_CONSTANTS } from './scoreThresholds';

/** Unified grade calculation from score */
export function calculateGradeFromScore(
  score: number, 
  thresholds: Record<ScoreGrade, number>
): ScoreGrade {
  if (score === undefined || score === null || isNaN(score)) {
    console.warn('Invalid score provided to calculateGradeFromScore:', score);
    return 'C';
  }

  const sortedGrades: ScoreGrade[] = ['A', 'B', 'C'];
  for (const grade of sortedGrades) {
    if (score >= thresholds[grade]) return grade;
  }
  return 'D';
}

/** Unified severity weight mapping */
export const SEVERITY_WEIGHTS = {
  critical: ANALYSIS_CONSTANTS.SEVERITY.CRITICAL,
  major: ANALYSIS_CONSTANTS.SEVERITY.MAJOR,
  minor: ANALYSIS_CONSTANTS.SEVERITY.MINOR
} as const;

/** Enhanced critical pattern detection with more comprehensive patterns */
export const CRITICAL_PATTERNS = [
  'uncaught exception', 'unhandled exception', 'runtime exception',
  'null pointer', 'nullpointerexception', 'divide by zero', 'division by zero',
  'array index out of bounds', 'buffer overflow', 'memory leak',
  'segmentation fault', 'access violation', 'stack overflow',
  'infinite recursion', 'deadlock', 'race condition', 'crash', 'fatal error',
  'arithmetic exception', 'out of memory', 'thread abort', 'access denied'
] as const;

/** Enhanced critical pattern detection */
export function detectCriticalPattern(description: string, context: string): boolean {
  if (!description || !context) return false;

  const desc = description.toLowerCase();
  const ctx = context.toLowerCase();

  console.log(`Pattern detection for: "${desc}" in context: "${ctx}"`);

  // Check for known critical patterns
  const hasKeyword = CRITICAL_PATTERNS.some(pattern => {
    const found = desc.includes(pattern) || ctx.includes(pattern);
    if (found) console.log(`🔍 Found critical pattern: "${pattern}"`);
    return found;
  });

  // Enhanced code analysis with more aggressive detection
  const hasUncheckedDivision = 
    ctx.includes('/') && 
    !ctx.includes('!= 0') && 
    !ctx.includes('!== 0') && 
    !ctx.match(/\/\s*[1-9]/) &&
    !ctx.includes('try') &&
    !ctx.includes('if');

  const hasUncheckedArrayAccess = 
    /\w+\[\w+\]/.test(ctx) && 
    !ctx.includes('.length') && 
    !ctx.includes('?.') &&
    !ctx.includes('try') &&
    !ctx.includes('if');

  const hasUncheckedNull = 
    /\w+\.\w+/.test(ctx) && 
    !ctx.includes('?.') && 
    !ctx.includes('??') &&
    !ctx.includes('if') && 
    !ctx.includes('try');

  // Additional risky patterns
  const hasUnhandledException = desc.includes('exception') && !ctx.includes('try');
  const hasMemoryIssue = desc.includes('memory') || desc.includes('overflow');
  const hasRuntimeError = desc.includes('runtime') && desc.includes('error');

  const isRisky = hasKeyword || hasUncheckedDivision || hasUncheckedArrayAccess || 
                  hasUncheckedNull || hasUnhandledException || hasMemoryIssue || hasRuntimeError;

  if (isRisky) {
    console.log(`🚨 Critical pattern detected! Reasons:`, {
      hasKeyword,
      hasUncheckedDivision,
      hasUncheckedArrayAccess,
      hasUncheckedNull,
      hasUnhandledException,
      hasMemoryIssue,
      hasRuntimeError
    });
  }

  return isRisky;
}

/** Unified context factor calculation */
export function calculateContextFactor(issues: ReliabilityIssue[]): number {
  if (!Array.isArray(issues) || issues.length === 0) return 1.0;

  const context = issues[0].codeContext?.toLowerCase() || '';
  let factor = 1.0;

  if (context.includes('test')) factor *= ANALYSIS_CONSTANTS.FACTORS.TEST_CODE;
  if (context.includes('try') || context.includes('catch')) factor *= ANALYSIS_CONSTANTS.FACTORS.ERROR_HANDLING;
  if (context.includes('helper') || context.includes('util')) factor *= ANALYSIS_CONSTANTS.FACTORS.UTILITY_CODE;
  if (issues.length > 1) factor *= ANALYSIS_CONSTANTS.FACTORS.REPEATED_ISSUES;

  return factor;
}

/** Unified path sensitivity calculation */
export function calculatePathSensitivity(issues: ReliabilityIssue[]): number {
  if (!Array.isArray(issues) || issues.length === 0) return 1.0;

  const ctx = issues[0].codeContext || '';
  const desc = issues[0].description.toLowerCase();

  // For critical issues, maintain higher sensitivity
  if (issues[0].type === 'critical') {
    return Math.max(0.7, 1.0);
  }

  if (ctx.includes('try') && ctx.includes('catch')) return 0.4;
  if (ctx.includes('if') || ctx.includes('switch') || ctx.includes('instanceof')) return ANALYSIS_CONSTANTS.FACTORS.GUARDED_PATH;
  if (desc.includes('edge case')) return ANALYSIS_CONSTANTS.FACTORS.EDGE_CASE;
  if (desc.includes('validated')) return ANALYSIS_CONSTANTS.FACTORS.VALIDATED_CODE;

  return 1.0;
}

/** Unified deduction calculation with logarithmic scaling */
export function calculateScaledDeduction(baseDeduction: number, maxDeduction: number = 100): number {
  if (baseDeduction <= 20) return baseDeduction;
  
  // Apply logarithmic scaling for large deductions
  const scaledPortion = 20 + (Math.log(baseDeduction - 19) / Math.log(2)) * 5;
  return Math.min(scaledPortion, maxDeduction);
}
