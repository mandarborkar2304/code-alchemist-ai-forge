
import { ReliabilityIssue } from '@/types';
import { IssueGroup, CategoryWithIssues } from './types';
import { 
  detectCriticalPattern,
  SEVERITY_WEIGHTS,
  calculateScaledDeduction
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
    .replace(/\b(function|method|class)\s+\w+/g, 'function')
    .trim();

  normalizeCache.set(input, norm);
  return norm;
}

/** Enhanced issue grouping that preserves critical severity information */
export function groupSimilarIssues(issues: ReliabilityIssue[]): IssueGroup[] {
  if (!Array.isArray(issues)) return [];

  const groups: Record<string, IssueGroup> = {};

  for (const issue of issues) {
    if (!issue) continue;
    
    // Enhanced grouping that considers severity for critical issues
    const normalizedDesc = normalizeString(issue.description);
    const severity = getEffectiveSeverity(issue);
    
    // For critical issues, create separate groups to prevent dilution
    const key = severity === 'critical' 
      ? `critical_${issue.category || 'unknown'}_${normalizedDesc}_${Math.random().toString(36).substr(2, 5)}`
      : `${issue.category || 'unknown'}_${normalizedDesc}`;
    
    if (!groups[key]) groups[key] = { key, issues: [] };
    groups[key].issues.push(issue);
  }

  const result = Object.values(groups);
  console.log(`Grouped ${issues.length} issues into ${result.length} groups`);
  return result;
}

/** Enhanced effective severity with comprehensive pattern detection */
export function getEffectiveSeverity(issue: ReliabilityIssue): string {
  if (!issue) return 'minor';
  
  const base = issue.type || 'minor';
  const description = issue.description || '';
  const context = issue.codeContext || '';

  console.log(`🔍 Evaluating severity for: "${description.substring(0, 50)}..."`);
  console.log(`Base severity: ${base}`);

  // Don't escalate if already critical
  if (base === 'critical') {
    console.log('✅ Already critical, no escalation needed');
    return base;
  }
  
  // Enhanced critical pattern detection
  const isCriticalPattern = detectCriticalPattern(description, context);
  
  // Additional escalation criteria
  const hasHighImpactKeywords = /crash|hang|corrupt|fatal|abort|terminate/i.test(description);
  const hasUnsafeOperation = /unsafe|unvalidated|unchecked|unguarded/i.test(description);
  const hasMemoryIssue = /memory|buffer|pointer|reference|leak/i.test(description);
  const hasExceptionRisk = /exception|error|fail/i.test(description) && 
                          !/handled|caught|expected/i.test(description);

  const shouldEscalate = isCriticalPattern || hasHighImpactKeywords || 
                        (hasUnsafeOperation && (hasMemoryIssue || hasExceptionRisk));

  if (shouldEscalate) {
    console.log(`⚠️ ESCALATING ${base} -> critical due to:`, {
      criticalPattern: isCriticalPattern,
      highImpactKeywords: hasHighImpactKeywords,
      unsafeOperation: hasUnsafeOperation,
      memoryIssue: hasMemoryIssue,
      exceptionRisk: hasExceptionRisk
    });
    return 'critical';
  }

  // Minor escalation for major issues with some risk indicators
  if (base === 'minor' && (hasUnsafeOperation || hasExceptionRisk)) {
    console.log(`⚠️ Escalating minor -> major due to risk indicators`);
    return 'major';
  }
  
  console.log(`✅ No escalation needed, keeping: ${base}`);
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

  let hasCritical = false;
  let hasRuntime = false;
  let hasException = false;

  for (const group of groupedIssues) {
    const severity = getEffectiveSeverity(group.issues[0]);
    const type = group.issues[0]?.category;
    
    if (severity === 'critical') hasCritical = true;
    if (type === 'runtime') hasRuntime = true;
    if (type === 'exception') hasException = true;

    switch (type) {
      case 'runtime':
        add(true, 'Implement comprehensive validation and null checks for runtime safety.');
        if (severity === 'critical') {
          add(true, 'URGENT: Address critical runtime issues that can cause crashes.');
        }
        break;
      case 'exception':
        add(true, 'Ensure consistent exception handling using try-catch blocks.');
        break;
      case 'structure':
        add(true, 'Refactor code to improve structural reliability and maintainability.');
        break;
      case 'readability':
        add(true, 'Improve code clarity and documentation to prevent misunderstandings.');
        break;
    }
  }

  // Priority improvements for critical issues
  if (hasCritical) {
    improvements.unshift('🚨 CRITICAL: Immediately address crash-prone code patterns.');
  }

  return improvements.length > 0
    ? improvements
    : ['Consider applying additional reliability checks.'];
}

/** Enhanced group deduction calculation with aggressive critical impact */
export function calculateGroupDeduction(
  group: { issues: ReliabilityIssue[] },
  effectiveSeverity: string
): number {
  if (!group || !Array.isArray(group.issues) || group.issues.length === 0) return 0;

  const issueCount = group.issues.length;
  const firstIssue = group.issues[0];

  console.log(`\n--- Calculating Group Deduction ---`);
  console.log(`Issue: "${firstIssue.description.substring(0, 60)}..."`);
  console.log(`Count: ${issueCount}, Effective Severity: ${effectiveSeverity}`);

  let baseDeduction = 0;

  // Enhanced severity-based deductions with much stronger critical impact
  switch (effectiveSeverity) {
    case 'critical':
      // Aggressive deduction for critical issues
      baseDeduction = Math.min(80, 40 + (issueCount * 20)); // Start at 40, add 20 per additional issue
      console.log(`🔥 Critical deduction: base=40, count_bonus=${issueCount * 20}, total=${baseDeduction}`);
      break;
    case 'major':
      baseDeduction = Math.min(35, 15 + (issueCount * 8));
      console.log(`⚠️ Major deduction: base=15, count_bonus=${issueCount * 8}, total=${baseDeduction}`);
      break;
    case 'minor':
      baseDeduction = Math.min(20, 5 + (issueCount * 3));
      console.log(`ℹ️ Minor deduction: base=5, count_bonus=${issueCount * 3}, total=${baseDeduction}`);
      break;
    default:
      baseDeduction = issueCount * 4;
      console.log(`❓ Default deduction: ${baseDeduction}`);
  }

  // Enhanced context factor calculation
  let contextFactor = 1.0;
  
  if (effectiveSeverity === 'critical') {
    // Minimal context reduction for critical issues
    const context = firstIssue.codeContext?.toLowerCase() || '';
    if (context.includes('test')) contextFactor *= 0.95; // Only 5% reduction for tests
    if (context.includes('helper') || context.includes('util')) contextFactor *= 0.95;
    // Never apply error handling reduction for critical issues
    console.log(`🔥 Critical issue context factor: ${contextFactor} (minimal reduction)`);
  } else {
    // Normal context factors for non-critical issues
    const context = firstIssue.codeContext?.toLowerCase() || '';
    if (context.includes('test')) contextFactor *= 0.8;
    if (context.includes('try') || context.includes('catch')) contextFactor *= 0.7;
    if (context.includes('helper') || context.includes('util')) contextFactor *= 0.8;
    console.log(`Context factor for ${effectiveSeverity}: ${contextFactor}`);
  }

  // Apply scaling to prevent artificially low scores
  const scaledDeduction = calculateScaledDeduction(baseDeduction);
  const finalDeduction = Math.max(0, scaledDeduction * contextFactor);

  console.log(`Final calculation: ${scaledDeduction} * ${contextFactor} = ${finalDeduction}`);
  console.log(`--- End Group Deduction ---\n`);
  
  return finalDeduction;
}
