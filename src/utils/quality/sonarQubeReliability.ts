
import { ReliabilityIssue, ScoreGrade } from '@/types';
import { 
  SonarQubeSeverity, 
  SONARQUBE_GRADE_THRESHOLDS, 
  CRASH_PRONE_PATTERNS, 
  RISKY_CODE_PATTERNS 
} from './scoreThresholds';

export interface SonarQubeIssue {
  id: string;
  severity: SonarQubeSeverity;
  description: string;
  category: string;
  file?: string;
  line?: number;
  codeContext?: string;
  pattern?: string;
}

export interface SeverityCount {
  blocker: number;
  critical: number;
  major: number;
  minor: number;
}

export interface ReliabilityGradeResult {
  grade: ScoreGrade;
  severityCounts: SeverityCount;
  issues: SonarQubeIssue[];
  reason: string;
  riskSummary: string;
}

/**
 * Maps ReliabilityIssue to SonarQube severity based on pattern analysis
 */
export function mapToSonarQubeSeverity(issue: ReliabilityIssue): SonarQubeSeverity {
  const description = (issue.description || '').toLowerCase();
  const context = (issue.codeContext || '').toLowerCase();
  const combined = `${description} ${context}`;

  console.log(`🔍 Mapping issue to SonarQube severity: "${description.substring(0, 60)}..."`);

  // Check for blocker-level patterns (immediate crash risks)
  const blockerPatterns = [
    'null pointer', 'nullpointerexception', 'segmentation fault', 
    'stack overflow', 'out of memory', 'buffer overflow',
    'divide by zero', 'infinite recursion', 'deadlock', 'crash'
  ];

  for (const pattern of blockerPatterns) {
    if (combined.includes(pattern)) {
      console.log(`💥 BLOCKER: Found pattern "${pattern}"`);
      return 'blocker';
    }
  }

  // Check for critical-level patterns (high crash potential)
  const criticalPatterns = [
    'unhandled exception', 'uncaught exception', 'runtime exception',
    'array index out of bounds', 'null reference', 'undefined reference',
    'use after free', 'memory leak', 'race condition', 'fatal error'
  ];

  for (const pattern of criticalPatterns) {
    if (combined.includes(pattern)) {
      console.log(`🚨 CRITICAL: Found pattern "${pattern}"`);
      return 'critical';
    }
  }

  // Enhanced code context analysis for crash-prone patterns
  if (detectCrashProneCode(context)) {
    console.log(`🚨 CRITICAL: Crash-prone code detected in context`);
    return 'critical';
  }

  // Check for major-level patterns
  const majorPatterns = [
    'exception', 'error', 'fail', 'invalid', 'unsafe', 'unvalidated',
    'resource leak', 'connection not closed', 'unchecked'
  ];

  for (const pattern of majorPatterns) {
    if (combined.includes(pattern) && !combined.includes('handled') && !combined.includes('caught')) {
      console.log(`⚠️ MAJOR: Found pattern "${pattern}"`);
      return 'major';
    }
  }

  // Check original issue type for baseline severity
  switch (issue.type) {
    case 'critical':
      return 'critical';
    case 'major':
      return 'major';
    default:
      console.log(`ℹ️ MINOR: Default classification`);
      return 'minor';
  }
}

/**
 * Detects crash-prone code patterns in context
 */
function detectCrashProneCode(context: string): boolean {
  if (!context) return false;

  // Unchecked division
  if (context.includes('/') && 
      !context.includes('!= 0') && 
      !context.includes('!== 0') &&
      !context.match(/\/\s*[1-9]/) &&
      !context.includes('Math.floor')) {
    return true;
  }

  // Unchecked array access
  if (/\w+\[\w*\]/.test(context) && 
      !context.includes('.length') && 
      !context.includes('?.') &&
      !context.includes('Array.isArray')) {
    return true;
  }

  // Unchecked null/undefined access
  if (/\w+\.\w+/.test(context) && 
      !context.includes('?.') && 
      !context.includes('??') &&
      !context.includes('null') &&
      !context.includes('undefined') &&
      !context.includes('typeof')) {
    return true;
  }

  return false;
}

/**
 * Converts ReliabilityIssue array to SonarQubeIssue array
 */
export function convertToSonarQubeIssues(issues: ReliabilityIssue[]): SonarQubeIssue[] {
  if (!Array.isArray(issues)) return [];

  return issues.map((issue, index) => ({
    id: `issue_${index}`,
    severity: mapToSonarQubeSeverity(issue),
    description: issue.description || 'Unknown issue',
    category: issue.category || 'unknown',
    file: 'analyzed_file',
    line: issue.line,
    codeContext: issue.codeContext,
    pattern: issue.pattern
  }));
}

/**
 * Counts issues by severity level
 */
export function countBySeverity(issues: SonarQubeIssue[]): SeverityCount {
  const counts: SeverityCount = {
    blocker: 0,
    critical: 0,
    major: 0,
    minor: 0
  };

  for (const issue of issues) {
    counts[issue.severity]++;
  }

  console.log('📊 Severity counts:', counts);
  return counts;
}

/**
 * Central function to calculate reliability grade using SonarQube methodology
 */
export function calculateReliabilityGrade(issues?: ReliabilityIssue[]): ReliabilityGradeResult {
  console.log('\n🎯 === SONARQUBE RELIABILITY GRADING STARTED ===');
  
  if (!issues || issues.length === 0) {
    console.log('✅ No issues found, returning Grade A');
    return {
      grade: 'A',
      severityCounts: { blocker: 0, critical: 0, major: 0, minor: 0 },
      issues: [],
      reason: 'No reliability issues detected',
      riskSummary: 'Code appears to be free of reliability risks'
    };
  }

  console.log(`🔍 Processing ${issues.length} issues`);

  // Convert to SonarQube issues with severity mapping
  const sonarQubeIssues = convertToSonarQubeIssues(issues);
  const severityCounts = countBySeverity(sonarQubeIssues);

  console.log('📈 Issue breakdown:');
  console.log(`  🔥 Blocker: ${severityCounts.blocker}`);
  console.log(`  🚨 Critical: ${severityCounts.critical}`);
  console.log(`  ⚠️ Major: ${severityCounts.major}`);
  console.log(`  ℹ️ Minor: ${severityCounts.minor}`);

  // Determine grade using SonarQube logic (most severe issue determines grade)
  let grade: ScoreGrade = 'A';
  let reason = '';
  let riskSummary = '';

  // Grade D: Any blocker OR 2+ critical OR 10+ major
  if (severityCounts.blocker > 0) {
    grade = 'D';
    reason = `${severityCounts.blocker} blocker issue(s) detected - immediate crash risk`;
    riskSummary = 'CRITICAL: Code contains patterns that will cause immediate crashes or system failures';
  } else if (severityCounts.critical >= 2) {
    grade = 'D';
    reason = `${severityCounts.critical} critical issues detected - high crash risk`;
    riskSummary = 'CRITICAL: Multiple critical reliability issues pose significant crash risk';
  } else if (severityCounts.major >= 10) {
    grade = 'D';
    reason = `${severityCounts.major} major issues detected - accumulated reliability risk`;
    riskSummary = 'HIGH RISK: Numerous major issues significantly compromise system reliability';
  }
  // Grade C: 1 critical OR 3+ major
  else if (severityCounts.critical >= 1) {
    grade = 'C';
    reason = `${severityCounts.critical} critical issue(s) detected`;
    riskSummary = 'MODERATE RISK: Critical reliability issues require immediate attention';
  } else if (severityCounts.major >= 3) {
    grade = 'C';
    reason = `${severityCounts.major} major issues detected`;
    riskSummary = 'MODERATE RISK: Multiple major issues affect system reliability';
  }
  // Grade B: 1-2 major OR 6-10 minor
  else if (severityCounts.major >= 1) {
    grade = 'B';
    reason = `${severityCounts.major} major issue(s) and ${severityCounts.minor} minor issues`;
    riskSummary = 'LOW RISK: Some reliability concerns that should be addressed';
  } else if (severityCounts.minor > 5) {
    grade = 'B';
    reason = `${severityCounts.minor} minor issues detected`;
    riskSummary = 'LOW RISK: Several minor reliability issues to consider';
  }
  // Grade A: ≤5 minor issues only
  else {
    grade = 'A';
    reason = severityCounts.minor > 0 
      ? `${severityCounts.minor} minor issues - excellent reliability`
      : 'No significant reliability issues';
    riskSummary = 'EXCELLENT: Code demonstrates strong reliability practices';
  }

  console.log(`🎯 FINAL GRADE: ${grade}`);
  console.log(`📝 Reason: ${reason}`);
  console.log('=== SONARQUBE RELIABILITY GRADING COMPLETED ===\n');

  return {
    grade,
    severityCounts,
    issues: sonarQubeIssues,
    reason,
    riskSummary
  };
}

/**
 * Generates improvement suggestions based on severity distribution
 */
export function generateSonarQubeImprovements(result: ReliabilityGradeResult): string[] {
  const { severityCounts, grade } = result;
  const improvements: string[] = [];

  if (severityCounts.blocker > 0) {
    improvements.push('🔥 URGENT: Fix blocker issues immediately - they will cause crashes');
    improvements.push('Review null pointer access and division operations');
    improvements.push('Add comprehensive input validation');
  }

  if (severityCounts.critical > 0) {
    improvements.push('🚨 HIGH PRIORITY: Address critical reliability issues');
    improvements.push('Implement proper exception handling for risky operations');
    improvements.push('Add null checks and boundary validations');
  }

  if (severityCounts.major > 0) {
    improvements.push('⚠️ MODERATE PRIORITY: Fix major reliability issues');
    improvements.push('Review error handling patterns');
    improvements.push('Consider adding try-catch blocks for risky operations');
  }

  if (severityCounts.minor > 5) {
    improvements.push('ℹ️ LOW PRIORITY: Consider addressing minor issues for code quality');
    improvements.push('Improve code documentation and clarity');
  }

  if (improvements.length === 0) {
    improvements.push('✅ Maintain excellent reliability practices');
    improvements.push('Continue regular code reviews');
  }

  return improvements;
}
