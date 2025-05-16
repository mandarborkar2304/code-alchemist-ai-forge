import { ScoreGrade } from '@/types';

// Centralized configuration constants
export const scoreThresholds = {
  maintainability: {
    A: 85,
    B: 70,
    C: 55,
    D: 0
  },
  cyclomaticComplexity: {
    A: 5,
    B: 10,
    C: 20,
    D: 21
  },
  reliability: {
    A: 95,
    B: 85,
    C: 70,
    D: 0
  }
};

// Optional: Specific thresholds for smell count grading (if needed separately)
export const codeSmellThresholds = {
  A: 0,
  B: 5,
  C: 10,
  D: 20
};

// Analysis constants
export const ANALYSIS_CONSTANTS = {
  DUPLICATION: {
    LOW: 5,
    MODERATE: 10,
    HIGH: 20,
    IMPACT_MULTIPLIER: 0.2
  },
  FUNCTION_SIZE: {
    ACCEPTABLE: 0,
    MODERATE: 1,
    HIGH: 6,
    IMPACT_MULTIPLIER: 1.5,
    MAX_IMPACT: 20
  },
  DOCUMENTATION: {
    GOOD: 80,
    ACCEPTABLE: 70,
    POOR: 50,
    IMPACT_MULTIPLIER: 0.25
  },
  NESTING_DEPTH: {
    LOW: 3,
    MODERATE: 4,
    HIGH: 5,
    MODERATE_PENALTY: 5,
    HIGH_PENALTY: 10
  },
  SEVERITY: {
    CRITICAL: 3,
    MAJOR: 2,
    MINOR: 1
  },
  RELIABILITY: {
    CRITICAL_DEDUCTION: 35,
    MAJOR_DEDUCTION: 15,
    MINOR_DEDUCTION: 5,
    MAX_DEDUCTION: 70
  },
  FACTORS: {
    TEST_CODE: 0.5,
    ERROR_HANDLING: 0.7,
    UTILITY_CODE: 0.8,
    REPEATED_ISSUES: 0.9,
    RARE_PATH: 0.4,
    EDGE_CASE: 0.6,
    VALIDATED_CODE: 0.5,
    UNVALIDATED_INPUT: 1.2,
    CONSERVATIVE_MODE: 0.7,
    GUARDED_PATH: 0.6
  }
};

export const issueSeverityWeights = {
  critical: ANALYSIS_CONSTANTS.SEVERITY.CRITICAL,
  major: ANALYSIS_CONSTANTS.SEVERITY.MAJOR,
  minor: ANALYSIS_CONSTANTS.SEVERITY.MINOR
};

// Utility: Clamp score between 0 and 100
function clampScore(score: number): number {
  return Math.max(0, Math.min(100, parseFloat(score.toFixed(2))));
}

// Utility: Grade calculation from score
export function getGradeFromScore(score: number, thresholds: Record<ScoreGrade, number>): ScoreGrade {
  if (score === undefined || score === null || isNaN(score)) {
    console.warn('Invalid score provided to getGradeFromScore:', score);
    return 'C';
  }

  const sortedGrades = Object.keys(thresholds)
    .sort((a, b) => thresholds[b as ScoreGrade] - thresholds[a as ScoreGrade]) as ScoreGrade[];

  for (const grade of sortedGrades) {
    if (score >= thresholds[grade]) return grade;
  }

  return 'D';
}

// Utility: Severity check
function isHighImpact(issue: { type?: string, impact?: number }, severity: number): boolean {
  return issue?.type === 'critical' || (issue.impact ?? 0) >= severity;
}

// Reliability Score Calculator
export function calculateReliabilityScore(issues: {
  type: 'critical' | 'major' | 'minor';
}[]): number {
  if (!issues || issues.length === 0) return 100;

  let totalDeduction = 0;

  for (const issue of issues) {
    switch (issue.type) {
      case 'critical':
        totalDeduction += ANALYSIS_CONSTANTS.RELIABILITY.CRITICAL_DEDUCTION;
        break;
      case 'major':
        totalDeduction += ANALYSIS_CONSTANTS.RELIABILITY.MAJOR_DEDUCTION;
        break;
      case 'minor':
        totalDeduction += ANALYSIS_CONSTANTS.RELIABILITY.MINOR_DEDUCTION;
        break;
    }
  }

  totalDeduction = Math.min(totalDeduction, ANALYSIS_CONSTANTS.RELIABILITY.MAX_DEDUCTION);

  return clampScore(100 - totalDeduction);
}

// Maintainability Score Calculator
export function calculateMaintainabilityScore(params: {
  duplicationPercentage: number;
  avgFunctionSize: number;
  documentationCoverage: number;
  avgNestingDepth: number;
}): number {
  const {
    duplicationPercentage,
    avgFunctionSize,
    documentationCoverage,
    avgNestingDepth
  } = params;

  let deduction = 0;

  // Duplication penalty
  if (duplicationPercentage > ANALYSIS_CONSTANTS.DUPLICATION.HIGH) {
    deduction += ANALYSIS_CONSTANTS.DUPLICATION.HIGH * ANALYSIS_CONSTANTS.DUPLICATION.IMPACT_MULTIPLIER;
  } else if (duplicationPercentage > ANALYSIS_CONSTANTS.DUPLICATION.MODERATE) {
    deduction += ANALYSIS_CONSTANTS.DUPLICATION.MODERATE * ANALYSIS_CONSTANTS.DUPLICATION.IMPACT_MULTIPLIER;
  } else if (duplicationPercentage > ANALYSIS_CONSTANTS.DUPLICATION.LOW) {
    deduction += ANALYSIS_CONSTANTS.DUPLICATION.LOW * ANALYSIS_CONSTANTS.DUPLICATION.IMPACT_MULTIPLIER;
  }

  // Function size penalty
  if (avgFunctionSize >= ANALYSIS_CONSTANTS.FUNCTION_SIZE.HIGH) {
    deduction += ANALYSIS_CONSTANTS.FUNCTION_SIZE.MAX_IMPACT;
  } else if (avgFunctionSize >= ANALYSIS_CONSTANTS.FUNCTION_SIZE.MODERATE) {
    deduction += ANALYSIS_CONSTANTS.FUNCTION_SIZE.MODERATE * ANALYSIS_CONSTANTS.FUNCTION_SIZE.IMPACT_MULTIPLIER;
  }

  // Documentation penalty
  if (documentationCoverage < ANALYSIS_CONSTANTS.DOCUMENTATION.POOR) {
    deduction += 15 * ANALYSIS_CONSTANTS.DOCUMENTATION.IMPACT_MULTIPLIER;
  } else if (documentationCoverage < ANALYSIS_CONSTANTS.DOCUMENTATION.ACCEPTABLE) {
    deduction += 7 * ANALYSIS_CONSTANTS.DOCUMENTATION.IMPACT_MULTIPLIER;
  }

  // Nesting depth penalty
  if (avgNestingDepth >= ANALYSIS_CONSTANTS.NESTING_DEPTH.HIGH) {
    deduction += ANALYSIS_CONSTANTS.NESTING_DEPTH.HIGH_PENALTY;
  } else if (avgNestingDepth >= ANALYSIS_CONSTANTS.NESTING_DEPTH.MODERATE) {
    deduction += ANALYSIS_CONSTANTS.NESTING_DEPTH.MODERATE_PENALTY;
  }

  return clampScore(100 - deduction);
}

// Grade Mappers
export function getReliabilityGrade(score: number): ScoreGrade {
  return getGradeFromScore(score, scoreThresholds.reliability);
}

export function getMaintainabilityGrade(score: number): ScoreGrade {
  return getGradeFromScore(score, scoreThresholds.maintainability);
}

export function getMaintainabilityGradeFromCodeSmells(smellCount: number): ScoreGrade {
  return getGradeFromScore(smellCount, codeSmellThresholds);
}

// Reliability Warning Flag Checker
export function needsReliabilityWarningFlag(
  score: ScoreGrade,
  issues?: { type: string; impact: number }[]
): boolean {
  if (!issues || issues.length === 0) return false;

  const criticalCount = issues.filter(issue =>
    isHighImpact(issue, ANALYSIS_CONSTANTS.SEVERITY.CRITICAL)
  ).length;

  if ((score === 'A' || score === 'B') && criticalCount >= 2) {
    return true;
  }

  if (score === 'B') {
    const majorCount = issues.filter(issue =>
      isHighImpact(issue, ANALYSIS_CONSTANTS.SEVERITY.MAJOR)
    ).length;
    if (majorCount >= 3) return true;
  }

  return false;
}