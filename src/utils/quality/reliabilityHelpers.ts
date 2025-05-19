import { ReliabilityIssue } from '@/types';
import { IssueGroup, CategoryWithIssues } from './types';
import { issueSeverityWeights, ANALYSIS_CONSTANTS } from './scoreThresholds';

/**
 * Normalizes a string by lowercasing, trimming whitespace,
 * and removing line-specific tokens like "line 42" or "at 23".
 */
function normalizeString(input: string): string {
  return typeof input === 'string'
    ? input.toLowerCase().replace(/\s+/g, ' ').replace(/\b(line|at|on)\s+\d+\b/g, '')
    : '';
}

/**
 * Groups similar issues based on category and a normalized description.
 * Helps reduce redundancy in further analysis.
 */
export function groupSimilarIssues(issues: ReliabilityIssue[]): IssueGroup[] {
  if (!Array.isArray(issues)) return [];

  const groups: Record<string, IssueGroup> = {};

  for (const issue of issues) {
    if (!issue) continue;

    // Generate a unique key for similar issues
    const key = `${issue.category || 'unknown'}_${normalizeString(issue.description)}`;

    // Initialize the group if not already
    if (!groups[key]) groups[key] = { key, issues: [] };

    // Add the issue to the group
    groups[key].issues.push(issue);
  }

  return Object.values(groups);
}

/**
 * Computes a reduction factor for the risk score based on the
 * context in which the issue appears (e.g., test code, try-catch block).
 */
export function getContextReductionFactor(issues: ReliabilityIssue[]): number {
  if (!Array.isArray(issues) || issues.length === 0) return 1.0;

  const context = issues[0].codeContext?.toLowerCase() || '';
  let factor = 1.0;

  if (context.includes('test')) factor *= ANALYSIS_CONSTANTS.FACTORS.TEST_CODE;
  if (context.includes('catch') || context.includes('try')) factor *= ANALYSIS_CONSTANTS.FACTORS.ERROR_HANDLING;
  if (context.includes('helper') || context.includes('util')) factor *= ANALYSIS_CONSTANTS.FACTORS.UTILITY_CODE;
  if (issues.length > 1) factor *= ANALYSIS_CONSTANTS.FACTORS.REPEATED_ISSUES;

  return factor;
}

/**
 * Determines whether a code pattern is likely to cause a crash or runtime error.
 * This acts as a safeguard to flag highly risky behavior.
 */

export function evaluatePatternRisk(description: string, context: string): boolean {
  if (!description || !context) return false;

  const desc = normalizeString(description);
  const ctx = context.toLowerCase();

  // Simulated AST-based heuristics (extendable)
  if (desc.includes('null') && ctx.includes('.')) {
    return !ctx.includes('?.') && !ctx.includes('!= null') && !ctx.includes('typeof');
  }

  if (desc.includes('division') || ctx.includes('/')) {
    return !ctx.includes('!= 0') && !ctx.includes('try') && !ctx.includes('catch');
  }

  if (desc.includes('array') && ctx.includes('[')) {
    return !ctx.includes('<') && !ctx.includes('length') && !ctx.includes('try');
  }

  return false;
}

/**
 * Estimates the sensitivity of the issue to specific execution paths.
 * Lower sensitivity means the issue appears on rare or guarded paths.
 */
export function determinePathSensitivity(issues: ReliabilityIssue[]): number {
  if (!Array.isArray(issues) || issues.length === 0) return 1.0;

  const ctx = issues[0].codeContext || '';
  const desc = normalizeString(issues[0].description);

  if (ctx.includes('try') && ctx.includes('catch')) return 0.4;
  if (ctx.includes('if') || ctx.includes('switch') || ctx.includes('instanceof') || ctx.includes('typeof'))
    return ANALYSIS_CONSTANTS.FACTORS.GUARDED_PATH;
  if (desc.includes('edge case')) return ANALYSIS_CONSTANTS.FACTORS.EDGE_CASE;
  if (desc.includes('validated')) return ANALYSIS_CONSTANTS.FACTORS.VALIDATED_CODE;

  return 1.0;
}
/**
 * Returns the severity level of a given issue.
 * Defaults to 'minor' if the type is missing.
 */
function getEffectiveSeverity(issue: ReliabilityIssue): string {
  const base = issue?.type || 'minor';
  const risky = evaluatePatternRisk(issue.description, issue.codeContext || '');
  return risky ? 'critical' : base;
}


/**
 * Categorizes reliability issues into predefined groups
 * to aid visualization and reporting.
 */
export function categorizeReliabilityIssues(issues: ReliabilityIssue[]): CategoryWithIssues[] {
  if (!Array.isArray(issues)) return [];

  return [
    {
      name: 'Bugs - Critical',
      issues: issues.filter(i => i.category === 'runtime' && getEffectiveSeverity(i) === 'critical'),
      severity: 'critical',
    },
    {
      name: 'Bugs - Exception Handling',
      issues: issues.filter(i => i.category === 'exception'),
      severity: 'major',
    },
    {
      name: 'Code Smells - Structure',
      issues: issues.filter(i => i.category === 'structure'),
      severity: i => getEffectiveSeverity(i),
    },
    {
      name: 'Code Smells - Maintainability',
      issues: issues.filter(i => i.category === 'readability'),
      severity: 'minor',
    }
  ].filter(cat => cat.issues.length > 0);
}

/**
 * Suggests possible improvements based on issue categories.
 * These are high-level action items for developers.
 */
export function generateReliabilityImprovements(groupedIssues: IssueGroup[]): string[] {
  const improvements: string[] = [];

  const add = (condition: boolean, suggestion: string) => {
    if (condition && !improvements.includes(suggestion)) improvements.push(suggestion);
  };

  groupedIssues.forEach(group => {
    const type = group.issues[0]?.category;
    switch (type) {
      case 'runtime':
        add(true, 'Implement validation and checks for runtime issues.');
        break;
      case 'exception':
        add(true, 'Ensure consistent exception handling using try-catch blocks.');
        break;
      case 'structure':
        add(true, 'Refactor code to improve structural reliability.');
        break;
      case 'readability':
        add(true, 'Improve clarity and documentation to prevent misunderstandings.');
        break;
    }
  });

  return improvements.length > 0 ? improvements : ['Consider applying additional reliability checks.'];
}
/**
 * Calculates an overall reliability score based on the issue groups,
 * risk factors, and pattern analysis. Issues that match known crash patterns
 * and are marked critical will result in an automatic failing grade.
 */
export function calculateReliabilityScore(issues: ReliabilityIssue[]): { score: number, letter: string } {
  const grouped = groupSimilarIssues(issues);
  let weightedTotal = 0;
  let criticalCrashDetected = false;

  for (const group of grouped) {
    const representative = group.issues[0];
    const severity = getEffectiveSeverity(representative);
    const severityWeight = issueSeverityWeights[severity] || 1;

    const riskFactor = getContextReductionFactor(group.issues) * determinePathSensitivity(group.issues);
    const isCrash = evaluatePatternRisk(representative.description, representative.codeContext || '');

    const effectiveCount = group.issues.length; // Removed capping — let real weight apply
    const rawImpact = effectiveCount * severityWeight * riskFactor;

    weightedTotal += rawImpact;

    // Count it as a crash-prone issue even if severity is not yet flagged
    if (isCrash) {
      criticalCrashDetected = true;
    }
  }

  // Fail hard if risky crash-prone issue exists, regardless of severity
  if (criticalCrashDetected) return { score: weightedTotal, letter: 'D' };

  // Stricter letter grading
  if (weightedTotal < 5) return { score: weightedTotal, letter: 'A' };
  if (weightedTotal < 15) return { score: weightedTotal, letter: 'B' };
  if (weightedTotal < 25) return { score: weightedTotal, letter: 'C' };
  return { score: weightedTotal, letter: 'D' };
}