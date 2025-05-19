import { ReliabilityIssue } from '@/types';
import { IssueGroup, CategoryWithIssues } from './types';
import { issueSeverityWeights, ANALYSIS_CONSTANTS } from './scoreThresholds';

/** Normalize issue descriptions for consistent grouping. */
function normalizeString(input: string): string {
  return typeof input === 'string'
    ? input.toLowerCase().replace(/\s+/g, ' ').replace(/\b(line|at|on)\s+\d+\b/g, '')
    : '';
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

/** Pattern risk heuristic to simulate static analysis for crashes like NPE, divide-by-zero, and out-of-bounds. */
export function evaluatePatternRisk(description: string, context: string): boolean {
  if (!description || !context) return false;

  const desc = normalizeString(description);
  const ctx = context.toLowerCase();

  // Null pointer access pattern
  if (desc.includes('null') && ctx.includes('.')) {
    return !ctx.includes('?.') && !ctx.includes('!= null') && !ctx.includes('typeof');
  }

  // Division by zero pattern
  if (desc.includes('division') || ctx.includes('/')) {
    return !ctx.includes('!= 0') && !ctx.includes('try') && !ctx.includes('catch');
  }

  // Array index out of bounds
  if (desc.includes('array') && ctx.includes('[')) {
    return !ctx.includes('<') && !ctx.includes('length') && !ctx.includes('try');
  }

  return false;
}

/** Computes issue severity dynamically, accounting for risky crash-like patterns. */
function getEffectiveSeverity(issue: ReliabilityIssue): string {
  const base = issue?.type || 'minor';
  const risky = evaluatePatternRisk(issue.description, issue.codeContext || '');
  return risky ? 'critical' : base;
}

/** Groups reliability issues by category for visualization/reporting. */
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

  return improvements.length > 0 ? improvements : ['Consider applying additional reliability checks.'];
}

/** Final scoring logic for reliability based on severity, context, and crash flags. */
export function calculateReliabilityScore(issues: ReliabilityIssue[]): { score: number, letter: string } {
  const grouped = groupSimilarIssues(issues);
  let weightedTotal = 0;
  let criticalCrashDetected = false;

  for (const group of grouped) {
    const rep = group.issues[0];
    const severity = getEffectiveSeverity(rep);
    const severityWeight = issueSeverityWeights[severity] || 1;
    const contextFactor = getContextReductionFactor(group.issues);
    const pathFactor = determinePathSensitivity(group.issues);
    const isCrash = evaluatePatternRisk(rep.description, rep.codeContext || '');

    const impact = group.issues.length * severityWeight * contextFactor * pathFactor;
    weightedTotal += impact;

    if (isCrash) criticalCrashDetected = true;
  }

  // Immediate fail if crash detected
  if (criticalCrashDetected) return { score: weightedTotal, letter: 'D' };

  // Tiered scoring system
  if (weightedTotal < 5) return { score: weightedTotal, letter: 'A' };
  if (weightedTotal < 15) return { score: weightedTotal, letter: 'B' };
  if (weightedTotal < 25) return { score: weightedTotal, letter: 'C' };
  return { score: weightedTotal, letter: 'D' };
}
