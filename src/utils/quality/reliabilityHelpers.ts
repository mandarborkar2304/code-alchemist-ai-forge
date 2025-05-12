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

  // Null/undefined dereference risk
  if (desc.includes('null') || desc.includes('undefined')) {
    return /(\w+)\.\w+/.test(ctx) &&
      !ctx.includes('?.') &&
      !ctx.includes('!= null') &&
      !ctx.includes('!== null') &&
      !ctx.includes('typeof');
  }

  // Division by zero
  if (desc.includes('divide') || desc.includes('division')) {
    const divisorMatch = ctx.match(/\/\s*(\w+)/);
    if (divisorMatch) {
      const divisor = divisorMatch[1];
      return !ctx.includes(`${divisor} !== 0`) &&
        !ctx.includes(`${divisor} > 0`) &&
        !ctx.includes('try') &&
        !ctx.includes('catch');
    }
    return ctx.includes('/ 0');
  }

  // Array out-of-bounds access
  if (desc.includes('array') || desc.includes('bounds')) {
    const match = ctx.match(/(\w+)\s*\[\s*(\w+|\d+)\s*\]/);
    if (match) {
      const [_, array, index] = match;
      const indexIsNumber = /^\d+$/.test(index);
      if (indexIsNumber && parseInt(index) < 1000) return false; // likely safe
      return !ctx.includes(`${index} < ${array}.length`) &&
        !ctx.includes(`${array}.length > ${index}`) &&
        !ctx.includes('try') &&
        !ctx.includes('catch');
    }
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
  if (ctx.includes('if') || ctx.includes('switch')) return ANALYSIS_CONSTANTS.FACTORS.GUARDED_PATH;
  if (ctx.includes('typeof') || ctx.includes('instanceof')) return ANALYSIS_CONSTANTS.FACTORS.GUARDED_PATH;

  if (desc.includes('exception path')) return ANALYSIS_CONSTANTS.FACTORS.RARE_PATH;
  if (desc.includes('edge case')) return ANALYSIS_CONSTANTS.FACTORS.EDGE_CASE;
  if (desc.includes('validated')) return ANALYSIS_CONSTANTS.FACTORS.VALIDATED_CODE;

  return 1.0;
}

/**
 * Returns the severity level of a given issue.
 * Defaults to 'minor' if the type is missing.
 */
function getSeverityLevel(issue: ReliabilityIssue): string {
  return issue?.type || 'minor';
}

/**
 * Categorizes reliability issues into predefined groups
 * to aid visualization and reporting.
 */
export function categorizeReliabilityIssues(issues: ReliabilityIssue[]): CategoryWithIssues[] {
  if (!Array.isArray(issues)) return [];

  const categories: CategoryWithIssues[] = [
    {
      name: 'Bugs - Critical',
      issues: issues.filter(i => i.category === 'runtime' && i.type === 'critical'),
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
      severity: (i) => getSeverityLevel(i),
    },
    {
      name: 'Code Smells - Maintainability',
      issues: issues.filter(i => i.category === 'readability'),
      severity: 'minor',
    }
  ];

  // Only return categories that have issues
  return categories.filter(cat => cat.issues.length > 0);
}

/**
 * Suggests possible improvements based on issue categories.
 * These are high-level action items for developers.
 */
export function generateReliabilityImprovements(groupedIssues: IssueGroup[]): string[] {
  if (!Array.isArray(groupedIssues) || groupedIssues.length === 0) return [];

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
  let hasCriticalCrash = false;

  for (const group of grouped) {
    const severityWeight = issueSeverityWeights[getSeverityLevel(group.issues[0])] || 1;
    const riskFactor = getContextReductionFactor(group.issues) * determinePathSensitivity(group.issues);
    const isCrash = evaluatePatternRisk(group.issues[0].description, group.issues[0].codeContext || '');

    // If this is a known crash pattern and marked critical, downgrade immediately
    if (isCrash && getSeverityLevel(group.issues[0]) === 'critical') hasCriticalCrash = true;

    // Weighted score = count × severity × context/path adjustment
    weightedTotal += group.issues.length * severityWeight * riskFactor;
  }

  // Fail-safe: any critical crash-like bug triggers a failing grade
  if (hasCriticalCrash) return { score: weightedTotal, letter: 'D' };

  // Map weighted score to letter grade
  if (weightedTotal < 5) return { score: weightedTotal, letter: 'A' };
  if (weightedTotal < 10) return { score: weightedTotal, letter: 'B' };
  if (weightedTotal < 15) return { score: weightedTotal, letter: 'C' };
  return { score: weightedTotal, letter: 'D' };
}
