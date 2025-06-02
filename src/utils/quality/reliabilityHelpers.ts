import { ReliabilityIssue } from '@/types';
import { IssueGroup, CategoryWithIssues } from './types';
import { issueSeverityWeights, ANALYSIS_CONSTANTS } from './scoreThresholds';

/** Cache for string normalization. */
const normalizeCache = new Map<string, string>();

/** Normalize issue descriptions for consistent grouping. */
function normalizeString(input: string): string {
  if (!input) return '';
  if (normalizeCache.has(input)) return normalizeCache.get(input)!;

  const norm = input
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\b(line|at|on)\s+\d+\b/g, '')
    .trim();

  normalizeCache.set(input, norm);
  return norm;
}

/** Group issues by normalized description and category to reduce redundancy. */
export function groupSimilarIssues(issues: ReliabilityIssue[]): IssueGroup[] {
  if (!Array.isArray(issues)) return [];

  const groups: Record<string, IssueGroup> = {};

  for (const issue of issues) {
    if (!issue) continue;
    const key = `${issue.category || 'unknown'}_${normalizeString(issue.description)}`;
    if (!groups[key]) groups[key] = { key, issues: [] };
    groups[key].issues.push(issue);
  }

  return Object.values(groups);
}

/** Adjusts issue impact score based on contextual hints. */
export function getContextReductionFactor(issues: ReliabilityIssue[]): number {
  if (!Array.isArray(issues) || issues.length === 0) return 1.0;

  const context = issues[0].codeContext?.toLowerCase() || '';
  let factor = 1.0;

  if (context.includes('test')) factor *= ANALYSIS_CONSTANTS.FACTORS.TEST_CODE;
  if (context.includes('try') || context.includes('catch')) factor *= ANALYSIS_CONSTANTS.FACTORS.ERROR_HANDLING;
  if (context.includes('helper') || context.includes('util')) factor *= ANALYSIS_CONSTANTS.FACTORS.UTILITY_CODE;
  if (issues.length > 1) factor *= ANALYSIS_CONSTANTS.FACTORS.REPEATED_ISSUES;

  return factor;
}

/** Estimates path sensitivity to reflect how likely the issue affects production behavior. */
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

/** Pattern risk heuristic for null, zero division, and bounds errors. */
export function evaluatePatternRisk(description: string, context: string): boolean {
  if (!description || !context) return false;

  const desc = normalizeString(description);
  const ctx = context.toLowerCase();

  const isNullRisk =
    desc.includes('null') &&
    /\w+\s*\.\s*\w+/.test(ctx) &&
    !ctx.includes('?.') &&
    !ctx.includes('!= null') &&
    !ctx.includes('typeof');

  const isDivideByZeroRisk =
    (desc.includes('division') || ctx.includes('/')) &&
    !ctx.includes('!= 0') &&
    !ctx.includes('try') &&
    !ctx.includes('catch');

  const isOutOfBoundsRisk =
    desc.includes('array') &&
    ctx.includes('[') &&
    !ctx.includes('<') &&
    !ctx.includes('length') &&
    !ctx.includes('try');

  return isNullRisk || isDivideByZeroRisk || isOutOfBoundsRisk;
}

/** Computes issue severity dynamically, accounting for risky crash-like patterns. */
export function getEffectiveSeverity(issue: ReliabilityIssue): string {
  const base = issue?.type || 'minor';
  const risky = evaluatePatternRisk(issue.description, issue.codeContext || '');

  if (!risky) return base;
  if (base === 'minor') return 'major';
  if (base === 'major') return 'critical';
  return base;
}

/** Groups reliability issues by category for visualization/reporting. */
export function categorizeReliabilityIssues(issues: ReliabilityIssue[]): CategoryWithIssues[] {
  if (!Array.isArray(issues)) return [];

  const criticalBugs = issues.filter(
    i => i.category === 'runtime' && getEffectiveSeverity(i) === 'critical'
  );
  const exceptionIssues = issues.filter(i => i.category === 'exception');
  const structuralSmells = issues.filter(i => i.category === 'structure');
  const maintainabilitySmells = issues.filter(i => i.category === 'readability');

  const result: CategoryWithIssues[] = [];

  if (criticalBugs.length > 0) {
    result.push({
      name: 'Bugs - Critical',
      issues: criticalBugs,
      severity: 'critical',
    });
  }

  if (exceptionIssues.length > 0) {
    result.push({
      name: 'Bugs - Exception Handling',
      issues: exceptionIssues,
      severity: 'major',
    });
  }

  if (structuralSmells.length > 0) {
    result.push({
      name: 'Code Smells - Structure',
      issues: structuralSmells,
      severity: 'varies',
    });
  }

  if (maintainabilitySmells.length > 0) {
    result.push({
      name: 'Code Smells - Maintainability',
      issues: maintainabilitySmells,
      severity: 'minor',
    });
  }

  return result;
}

/** Suggests general action items based on detected issue categories. */
export function generateReliabilityImprovements(groupedIssues: IssueGroup[]): string[] {
  const improvements: string[] = [];
  const add = (condition: boolean, suggestion: string) => {
    if (condition && !improvements.includes(suggestion)) improvements.push(suggestion);
  };

  for (const group of groupedIssues) {
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
  }

  return improvements.length > 0
    ? improvements
    : ['Consider applying additional reliability checks.'];
}

/** Final scoring logic for reliability based on severity, context, and crash flags. */
export function calculateReliabilityScore(
  issues: ReliabilityIssue[]
): { score: number; letter: string } {
  const grouped = groupSimilarIssues(issues);
  let weightedTotal = 0;
  let criticalCrashDetected = false;

  for (const group of grouped) {
    const rep = group.issues[0];
    const severity = getEffectiveSeverity(rep);
    const severityWeight = issueSeverityWeights[severity] || 1;
    const contextFactor = getContextReductionFactor(group.issues);
    const pathFactor = determinePathSensitivity(group.issues);
    const groupHasCrash = group.issues.some(i =>
      evaluatePatternRisk(i.description, i.codeContext || '')
    );

    const rawImpact = group.issues.length * severityWeight * contextFactor * pathFactor;
    const impact = Math.min(rawImpact, 10); // capped to avoid score explosion
    weightedTotal += impact;

    if (groupHasCrash) criticalCrashDetected = true;
  }

  if (criticalCrashDetected) return { score: weightedTotal, letter: 'D' };
  if (weightedTotal < 5) return { score: weightedTotal, letter: 'A' };
  if (weightedTotal < 15) return { score: weightedTotal, letter: 'B' };
  if (weightedTotal < 25) return { score: weightedTotal, letter: 'C' };
  return { score: weightedTotal, letter: 'D' };
}