
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

/** Comprehensive critical patterns with crash-prone code detection */
export const CRITICAL_PATTERNS = [
  // Runtime exceptions and crashes
  'uncaught exception', 'unhandled exception', 'runtime exception', 'runtime error',
  'null pointer', 'nullpointerexception', 'null reference', 'undefined reference',
  'divide by zero', 'division by zero', 'arithmetic exception',
  'array index out of bounds', 'index out of bounds', 'buffer overflow',
  'memory leak', 'out of memory', 'memory access violation',
  'segmentation fault', 'access violation', 'stack overflow',
  'infinite recursion', 'infinite loop', 'deadlock', 'race condition',
  'crash', 'fatal error', 'critical error', 'system failure',
  'thread abort', 'access denied', 'permission denied',
  
  // Code patterns that are crash-prone
  'unvalidated input', 'unchecked cast', 'unsafe operation',
  'resource leak', 'connection not closed', 'file not closed',
  'double free', 'use after free', 'dangling pointer',
  'format string vulnerability', 'sql injection', 'code injection',
  
  // High-risk operations
  'eval(', 'exec(', 'system(', 'shell_exec',
  'file_get_contents', 'unserialize', 'include(',
  'require(', 'import(', 'new Function('
] as const;

/** Enhanced critical pattern detection with comprehensive analysis */
export function detectCriticalPattern(description: string, context: string): boolean {
  if (!description || !context) return false;

  const desc = description.toLowerCase().trim();
  const ctx = context.toLowerCase().trim();

  console.log(`🔍 Pattern detection for: "${desc}" in context: "${ctx}"`);

  // Check for known critical patterns in description or context
  const hasKeywordPattern = CRITICAL_PATTERNS.some(pattern => {
    const inDesc = desc.includes(pattern);
    const inCtx = ctx.includes(pattern);
    const found = inDesc || inCtx;
    if (found) {
      console.log(`🚨 Found critical pattern: "${pattern}" in ${inDesc ? 'description' : 'context'}`);
    }
    return found;
  });

  // Enhanced code analysis for crash-prone patterns
  const codeAnalysis = analyzeCodeForCrashRisks(ctx);
  
  // Additional high-risk patterns in descriptions
  const descriptionAnalysis = analyzeDescriptionForRisks(desc);

  const isCritical = hasKeywordPattern || codeAnalysis.hasRisk || descriptionAnalysis.hasRisk;

  if (isCritical) {
    console.log(`🚨 CRITICAL PATTERN DETECTED!`, {
      keywordPattern: hasKeywordPattern,
      codeRisks: codeAnalysis,
      descriptionRisks: descriptionAnalysis
    });
  }

  return isCritical;
}

/** Analyze code context for crash-prone patterns */
function analyzeCodeForCrashRisks(context: string): { hasRisk: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // Unchecked division operations
  if (context.includes('/') && 
      !context.includes('!= 0') && 
      !context.includes('!== 0') && 
      !context.includes('=== 0') &&
      !context.match(/\/\s*[1-9]/) &&
      !context.includes('try') &&
      !context.includes('if') &&
      !context.includes('Math.floor') &&
      !context.includes('parseInt')) {
    reasons.push('Unchecked division operation');
  }

  // Unchecked array access
  if (/\w+\[\w*\]/.test(context) && 
      !context.includes('.length') && 
      !context.includes('?.') &&
      !context.includes('Array.isArray') &&
      !context.includes('try') &&
      !context.includes('if') &&
      !context.match(/\[\s*\d+\s*\]/)) { // Not literal index
    reasons.push('Unchecked array access');
  }

  // Unchecked null/undefined access
  if (/\w+\.\w+/.test(context) && 
      !context.includes('?.') && 
      !context.includes('??') &&
      !context.includes('null') &&
      !context.includes('undefined') &&
      !context.includes('if') && 
      !context.includes('try') &&
      !context.includes('typeof')) {
    reasons.push('Potential null/undefined access');
  }

  // Unsafe type casting
  if ((context.includes('as ') || context.includes('<') && context.includes('>')) &&
      !context.includes('typeof') &&
      !context.includes('instanceof')) {
    reasons.push('Unsafe type casting');
  }

  // Resource management issues
  if ((context.includes('new ') || context.includes('open') || context.includes('connect')) &&
      !context.includes('close') &&
      !context.includes('dispose') &&
      !context.includes('finally')) {
    reasons.push('Potential resource leak');
  }

  return { hasRisk: reasons.length > 0, reasons };
}

/** Analyze description for high-risk indicators */
function analyzeDescriptionForRisks(description: string): { hasRisk: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  const riskKeywords = [
    'crash', 'hang', 'freeze', 'abort', 'terminate', 'kill',
    'corrupt', 'invalid', 'illegal', 'violation', 'fault',
    'overflow', 'underflow', 'leak', 'deadlock',
    'race', 'unsafe', 'vulnerable', 'exploit'
  ];

  for (const keyword of riskKeywords) {
    if (description.includes(keyword)) {
      reasons.push(`High-risk keyword: ${keyword}`);
    }
  }

  // Pattern matching for error descriptions
  if (/error|exception|fail|broke|wrong/i.test(description)) {
    reasons.push('Error-related description');
  }

  return { hasRisk: reasons.length > 0, reasons };
}

/** Enhanced context factor calculation with reduced impact on critical issues */
export function calculateContextFactor(issues: ReliabilityIssue[]): number {
  if (!Array.isArray(issues) || issues.length === 0) return 1.0;

  const context = issues[0].codeContext?.toLowerCase() || '';
  const severity = issues[0].type;
  let factor = 1.0;

  // For critical issues, apply minimal context reduction
  if (severity === 'critical') {
    console.log('🔥 Critical issue detected - applying minimal context reduction');
    // Only slight reduction for critical issues in test/utility contexts
    if (context.includes('test')) factor *= 0.9;
    if (context.includes('helper') || context.includes('util')) factor *= 0.9;
    return Math.max(0.8, factor); // Never reduce critical issues below 80%
  }

  // Normal context factors for non-critical issues
  if (context.includes('test')) factor *= ANALYSIS_CONSTANTS.FACTORS.TEST_CODE;
  if (context.includes('try') || context.includes('catch')) factor *= ANALYSIS_CONSTANTS.FACTORS.ERROR_HANDLING;
  if (context.includes('helper') || context.includes('util')) factor *= ANALYSIS_CONSTANTS.FACTORS.UTILITY_CODE;
  if (issues.length > 1) factor *= ANALYSIS_CONSTANTS.FACTORS.REPEATED_ISSUES;

  console.log(`Context factor calculated: ${factor} for severity: ${severity}`);
  return factor;
}

/** Enhanced path sensitivity with preserved critical impact */
export function calculatePathSensitivity(issues: ReliabilityIssue[]): number {
  if (!Array.isArray(issues) || issues.length === 0) return 1.0;

  const ctx = issues[0].codeContext || '';
  const desc = issues[0].description.toLowerCase();
  const severity = issues[0].type;

  // For critical issues, maintain high sensitivity
  if (severity === 'critical') {
    console.log('🔥 Critical issue - maintaining high path sensitivity');
    return Math.max(0.9, 1.0); // Critical issues always maintain 90%+ impact
  }

  // Enhanced guarded path detection
  const isGuarded = ctx.includes('try') && ctx.includes('catch') ||
                   ctx.includes('if') && (ctx.includes('null') || ctx.includes('undefined')) ||
                   ctx.includes('switch') || ctx.includes('instanceof') ||
                   ctx.includes('typeof');

  if (isGuarded) return ANALYSIS_CONSTANTS.FACTORS.GUARDED_PATH;
  if (desc.includes('edge case')) return ANALYSIS_CONSTANTS.FACTORS.EDGE_CASE;
  if (desc.includes('validated')) return ANALYSIS_CONSTANTS.FACTORS.VALIDATED_CODE;

  return 1.0;
}

/** Enhanced deduction calculation with proper scaling */
export function calculateScaledDeduction(baseDeduction: number, maxDeduction: number = 100): number {
  if (baseDeduction <= 30) return baseDeduction;
  
  // Apply logarithmic scaling for very large deductions to prevent score floors
  const scaledPortion = 30 + (Math.log(baseDeduction - 29) / Math.log(2)) * 8;
  const result = Math.min(scaledPortion, maxDeduction);
  
  console.log(`Scaled deduction: ${baseDeduction} -> ${result}`);
  return result;
}
