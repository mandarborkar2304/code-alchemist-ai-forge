
import { ReliabilityIssue } from '@/types';
import { IssueGroup, CategoryWithIssues } from './types';
import { calculateReliabilityGrade, SonarQubeIssue } from './sonarQubeReliability';

// Legacy compatibility - now uses SonarQube methodology internally
export function groupSimilarIssues(issues: ReliabilityIssue[]): IssueGroup[] {
  if (!Array.isArray(issues)) return [];

  // In SonarQube methodology, we preserve individual issues for accurate counting
  // Group by category but maintain severity information
  const groups: Record<string, IssueGroup> = {};

  for (const issue of issues) {
    if (!issue) continue;
    
    const category = issue.category || 'unknown';
    const severity = issue.type || 'minor';
    
    // Create separate groups for different severities to prevent dilution
    const key = `${category}_${severity}`;
    
    if (!groups[key]) {
      groups[key] = { key, issues: [] };
    }
    groups[key].issues.push(issue);
  }

  const result = Object.values(groups);
  console.log(`📊 SonarQube grouping: ${issues.length} issues -> ${result.length} groups`);
  return result;
}

// Legacy function - now uses SonarQube severity mapping
export function getEffectiveSeverity(issue: ReliabilityIssue): string {
  // This now defers to SonarQube severity mapping for consistency
  const result = calculateReliabilityGrade([issue]);
  if (result.issues.length > 0) {
    return result.issues[0].severity;
  }
  return issue.type || 'minor';
}

export function categorizeReliabilityIssues(issues: ReliabilityIssue[]): CategoryWithIssues[] {
  if (!Array.isArray(issues)) return [];

  // Use SonarQube methodology for categorization
  const result = calculateReliabilityGrade(issues);
  const sonarQubeIssues = result.issues;

  const categories: CategoryWithIssues[] = [];

  // Group by SonarQube severity levels
  const blockerIssues = sonarQubeIssues.filter(i => i.severity === 'blocker');
  const criticalIssues = sonarQubeIssues.filter(i => i.severity === 'critical');
  const majorIssues = sonarQubeIssues.filter(i => i.severity === 'major');
  const minorIssues = sonarQubeIssues.filter(i => i.severity === 'minor');

  if (blockerIssues.length > 0) {
    categories.push({
      name: 'Bugs - Critical',
      issues: convertSonarQubeToReliability(blockerIssues),
      severity: 'critical'
    });
  }

  if (criticalIssues.length > 0) {
    categories.push({
      name: 'Bugs - Critical',
      issues: convertSonarQubeToReliability(criticalIssues),
      severity: 'critical'
    });
  }

  if (majorIssues.length > 0) {
    categories.push({
      name: 'Bugs - Exception Handling',
      issues: convertSonarQubeToReliability(majorIssues),
      severity: 'major'
    });
  }

  if (minorIssues.length > 0) {
    categories.push({
      name: 'Code Smells - Maintainability',
      issues: convertSonarQubeToReliability(minorIssues),
      severity: 'minor'
    });
  }

  return categories;
}

function convertSonarQubeToReliability(sonarQubeIssues: SonarQubeIssue[]): ReliabilityIssue[] {
  return sonarQubeIssues.map(issue => ({
    type: mapSonarQubeToReliabilityType(issue.severity),
    description: issue.description,
    impact: getSeverityImpact(issue.severity),
    category: mapSonarQubeCategory(issue.category),
    line: issue.line,
    codeContext: issue.codeContext,
    pattern: issue.pattern
  }));
}

function mapSonarQubeToReliabilityType(severity: string): 'critical' | 'major' | 'minor' {
  switch (severity) {
    case 'blocker':
    case 'critical':
      return 'critical';
    case 'major':
      return 'major';
    default:
      return 'minor';
  }
}

function getSeverityImpact(severity: string): number {
  switch (severity) {
    case 'blocker': return 50;
    case 'critical': return 25;
    case 'major': return 10;
    case 'minor': return 3;
    default: return 1;
  }
}

function mapSonarQubeCategory(category: string): 'runtime' | 'exception' | 'structure' | 'readability' {
  switch (category.toLowerCase()) {
    case 'runtime':
    case 'crash':
    case 'memory':
      return 'runtime';
    case 'exception':
    case 'error':
      return 'exception';
    case 'structure':
    case 'design':
      return 'structure';
    default:
      return 'readability';
  }
}

export function generateReliabilityImprovements(groupedIssues: IssueGroup[]): string[] {
  // Extract issues for SonarQube analysis
  const allIssues = groupedIssues.flatMap(group => group.issues);
  const result = calculateReliabilityGrade(allIssues);
  
  const improvements: string[] = [];
  const { severityCounts } = result;

  if (severityCounts.blocker > 0) {
    improvements.push('🔥 CRITICAL: Fix blocker issues immediately - they cause crashes');
    improvements.push('Review null pointer and division by zero vulnerabilities');
  }

  if (severityCounts.critical > 0) {
    improvements.push('🚨 HIGH PRIORITY: Address critical reliability issues');
    improvements.push('Implement comprehensive exception handling');
  }

  if (severityCounts.major > 0) {
    improvements.push('⚠️ MODERATE: Fix major reliability issues');
    improvements.push('Add proper error handling and validation');
  }

  if (severityCounts.minor > 5) {
    improvements.push('ℹ️ LOW PRIORITY: Consider addressing minor issues');
  }

  return improvements.length > 0 ? improvements : ['✅ Maintain current reliability practices'];
}

// Legacy function kept for compatibility but no longer used in scoring
export function calculateGroupDeduction(): number {
  console.warn('calculateGroupDeduction is deprecated - SonarQube methodology uses issue counting');
  return 0;
}
