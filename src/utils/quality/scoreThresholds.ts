
import { ScoreGrade } from '@/types';

// SonarQube-style severity levels
export type SonarQubeSeverity = 'blocker' | 'critical' | 'major' | 'minor';

// SonarQube-style grading thresholds based on issue counts
export const SONARQUBE_GRADE_THRESHOLDS = {
  A: {
    blocker: 0,
    critical: 0,
    major: 0,
    minor: 5  // Allow up to 5 minor issues for Grade A
  },
  B: {
    blocker: 0,
    critical: 0,
    major: 2,     // Allow up to 2 major issues for Grade B
    minor: 10     // Allow up to 10 minor issues for Grade B
  },
  C: {
    blocker: 0,
    critical: 1,  // 1 critical issue = Grade C
    major: 5,     // Multiple major issues = Grade C
    minor: 20     // Higher minor threshold for Grade C
  },
  D: {
    blocker: 1,   // Any blocker = Grade D
    critical: 2,  // 2+ critical = Grade D
    major: 10,    // 10+ major = Grade D
    minor: 50     // Very high minor threshold
  }
} as const;

// Critical patterns that immediately escalate to Critical or Blocker severity
export const CRASH_PRONE_PATTERNS = [
  // Immediate crash risks - Blocker level
  'null pointer', 'nullpointerexception', 'segmentation fault', 'access violation',
  'stack overflow', 'out of memory', 'memory access violation', 'buffer overflow',
  'divide by zero', 'division by zero', 'arithmetic exception',
  'infinite recursion', 'infinite loop', 'deadlock', 'crash',
  
  // High crash potential - Critical level
  'unhandled exception', 'uncaught exception', 'runtime exception',
  'array index out of bounds', 'index out of bounds', 'null reference',
  'undefined reference', 'use after free', 'double free', 'memory leak',
  'race condition', 'thread abort', 'fatal error', 'system failure'
] as const;

// Context patterns that indicate risky code locations
export const RISKY_CODE_PATTERNS = [
  'unvalidated input', 'unchecked cast', 'unsafe operation',
  'resource leak', 'connection not closed', 'file not closed',
  'eval(', 'exec(', 'system(', 'shell_exec'
] as const;

// Updated SonarQube-aligned complexity thresholds
export const scoreThresholds = {
  maintainability: { A: 85, B: 70, C: 55, D: 0 },
  cyclomaticComplexity: { A: 10, B: 15, C: 20, D: 21 },  // Updated to match SonarQube
  reliability: { A: 90, B: 75, C: 50, D: 0 }
};

// SonarQube analysis constants
export const ANALYSIS_CONSTANTS = {
  SEVERITY: {
    CRITICAL: 25,
    MAJOR: 10,
    MINOR: 3
  },
  NESTING_DEPTH: {
    LOW: 3,    // Updated to match SonarQube cognitive complexity
    MODERATE: 5,
    HIGH: 7
  },
  FUNCTION_SIZE: {
    ACCEPTABLE: 0,
    HIGH: 5,
    MAX_IMPACT: 15,
    IMPACT_MULTIPLIER: 2
  },
  DOCUMENTATION: {
    POOR: 30,
    ACCEPTABLE: 50,
    GOOD: 80,
    IMPACT_MULTIPLIER: 0.3
  },
  DUPLICATION: {
    MODERATE: 10,
    HIGH: 20,
    IMPACT_MULTIPLIER: 1.5
  },
  FACTORS: {
    TEST_CODE: 0.5,
    ERROR_HANDLING: 0.7,
    UTILITY_CODE: 0.8,
    REPEATED_ISSUES: 0.9,
    GUARDED_PATH: 0.6,
    EDGE_CASE: 0.7,
    VALIDATED_CODE: 0.8
  }
};

// Updated to use SonarQube complexity thresholds
export function getGradeFromScore(score: number, thresholds: Record<ScoreGrade, number>): ScoreGrade {
  if (score === undefined || score === null || isNaN(score)) {
    console.warn('Invalid score provided to getGradeFromScore:', score);
    return 'C';
  }

  // For cyclomatic complexity, use range-based grading (SonarQube style)
  if (thresholds.A === 10 && thresholds.B === 15 && thresholds.C === 20) {
    if (score <= 10) return 'A';
    if (score <= 15) return 'B';
    if (score <= 20) return 'C';
    return 'D';
  }
  
  // For other metrics, use standard threshold-based grading
  const sortedGrades: ScoreGrade[] = ['A', 'B', 'C'];
  for (const grade of sortedGrades) {
    if (score >= thresholds[grade]) return grade;
  }
  return 'D';
}

// Restored missing warning flag function
export function needsReliabilityWarningFlag(grade: ScoreGrade): boolean {
  return grade === 'C' || grade === 'D';
}
