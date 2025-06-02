import { ReliabilityIssue } from '@/types';
import { IssueGroup, CategoryWithIssues } from './types';
import { 
  detectCriticalPattern,
  SEVERITY_WEIGHTS 
} from './scoringUtils';
import { ANALYSIS_CONSTANTS } from './scoreThresholds';

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

/** Enhanced effective severity with stricter critical escalation */
export function getEffectiveSeverity(issue: ReliabilityIssue): string {
  const base = issue?.type || 'minor';
  const risky = detectCriticalPattern(issue.description, issue.codeContext || '');

  console.log(`Effective severity: "${issue.description}" -> base=${base}, risky=${risky}`);

  // Don't escalate if already critical
  if (base === 'critical') return base;
  
  // Only escalate if we detect genuine crash patterns
  if (risky) {
    console.log(`⚠️ Escalating ${base} to critical due to risky pattern`);
    return 'critical';
  }
  
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

/** Enhanced group deduction calculation with stronger critical impact */
export function calculateGroupDeduction(
  group: { issues: ReliabilityIssue[] },
  effectiveSeverity: string
): number {
  if (!group || !Array.isArray(group.issues) || group.issues.length === 0) return 0;

  const issueCount = group.issues.length;
  const severityWeight = SEVERITY_WEIGHTS[effectiveSeverity] ?? 1;

  console.log(`Calculating deduction: count=${issueCount}, severity=${effectiveSeverity}, weight=${severityWeight}`);

  let baseDeduction = 0;

  // Enhanced severity-based deductions with stronger critical impact
  switch (effectiveSeverity) {
    case 'critical':
      // Much stronger impact for critical issues
      baseDeduction = Math.min(60, 30 + (issueCount * 15));
      console.log(`Critical deduction: base=${30}, count_bonus=${issueCount * 15}, total=${baseDeduction}`);
      break;
    case 'major':
      baseDeduction = Math.min(30, 12 + (issueCount * 6));
      console.log(`Major deduction: base=${12}, count_bonus=${issueCount * 6}, total=${baseDeduction}`);
      break;
    case 'minor':
      baseDeduction = Math.min(15, 3 + (issueCount * 2));
      console.log(`Minor deduction: base=${3}, count_bonus=${issueCount * 2}, total=${baseDeduction}`);
      break;
    default:
      baseDeduction = issueCount * 3;
      console.log(`Default deduction: ${baseDeduction}`);
  }

  // Reduced context factors for critical issues to maintain impact
  let contextFactor = 1.0;
  if (effectiveSeverity === 'critical') {
    // For critical issues, apply minimal context reduction
    contextFactor = 0.9; // Only 10% reduction max
    console.log('Applied minimal context factor for critical issue');
  } else {
    // Apply normal context factors for non-critical issues
    const context = group.issues[0]?.codeContext?.toLowerCase() || '';
    if (context.includes('test')) contextFactor *= 0.8;
    if (context.includes('try') || context.includes('catch')) contextFactor *= 0.7;
    if (context.includes('helper') || context.includes('util')) contextFactor *= 0.8;
    console.log(`Applied context factor: ${contextFactor}`);
  }

  const finalDeduction = Math.max(0, baseDeduction * contextFactor);

  console.log(`Final deduction: ${baseDeduction} * ${contextFactor} = ${finalDeduction}`);
  
  return finalDeduction;
}
