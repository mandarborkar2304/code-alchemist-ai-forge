
import { ReliabilityIssue } from '@/types';
import { IssueGroup, CategoryWithIssues } from './types';
import { 
  calculateContextFactor, 
  calculatePathSensitivity, 
  detectCriticalPattern,
  SEVERITY_WEIGHTS 
} from './scoringUtils';

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

/** Enhanced effective severity with unified pattern detection */
export function getEffectiveSeverity(issue: ReliabilityIssue): string {
  const base = issue?.type || 'minor';
  const risky = detectCriticalPattern(issue.description, issue.codeContext || '');

  console.log(`Effective severity calc: base=${base}, risky=${risky}`);

  if (!risky) return base;
  
  // Escalate severity for risky patterns
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

/** Enhanced group deduction calculation using unified utilities */
export function calculateGroupDeduction(
  group: { issues: ReliabilityIssue[] },
  effectiveSeverity: string
): number {
  if (!group || !Array.isArray(group.issues) || group.issues.length === 0) return 0;

  const issueCount = group.issues.length;
  const severityWeight = SEVERITY_WEIGHTS[effectiveSeverity] ?? 1;
  const contextFactor = calculateContextFactor(group.issues);
  const pathFactor = calculatePathSensitivity(group.issues);

  console.log(`Group deduction calc: count=${issueCount}, severity=${effectiveSeverity}, weight=${severityWeight}`);

  let baseDeduction = 0;

  // Enhanced severity-based deductions
  switch (effectiveSeverity) {
    case 'critical':
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

  // Apply context and path factors
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
