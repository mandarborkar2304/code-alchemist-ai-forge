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
    A: 10,
    B: 20,
    C: 35,
    D: 36
  },
  reliability: {
    A: 5,
    B: 15,
    C: 25,
    D: 0
  }
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
    CRITICAL: 5,
    MAJOR: 4,
    MINOR: 2
  },
  RELIABILITY: {
    CRITICAL_DEDUCTION: 35,
    MAJOR_DEDUCTION: 15,
    MINOR_DEDUCTION: 5,
    MAX_DEDUCTION: 100
  },
  FACTORS: {
    TEST_CODE: 0.8,
    ERROR_HANDLING: 0.7,
    UTILITY_CODE: 0.8,
    REPEATED_ISSUES: 0.9,
    RARE_PATH: 0.4,
    EDGE_CASE: 0.6,
    VALIDATED_CODE: 0.5,
    UNVALIDATED_INPUT: 1.2,
    CONSERVATIVE_MODE: 1,
    GUARDED_PATH: 0.6
  }
};

export const issueSeverityWeights = {
  critical: ANALYSIS_CONSTANTS.SEVERITY.CRITICAL,
  major: ANALYSIS_CONSTANTS.SEVERITY.MAJOR,
  minor: ANALYSIS_CONSTANTS.SEVERITY.MINOR
};

// Grade determination helper
export function getGradeFromScore(score: number, thresholds: Record<ScoreGrade, number>): ScoreGrade {
  if (score === undefined || score === null || isNaN(score)) {
    console.warn('Invalid score provided to getGradeFromScore:', score);
    return 'C';
  }

  const sortedGrades: ScoreGrade[] = ['A', 'B', 'C'];
  for (const grade of sortedGrades) {
    if (score >= thresholds[grade]) return grade;
  }
  return 'D';
}

// Revised: Calculate Reliability Score
export function calculateReliabilityScore(issues: {
  type: 'critical' | 'major' | 'minor',
  impact?: number
}[]): number {
  if (!issues || issues.length === 0) return 100;

  let totalDeduction = 0;

  let criticalCount = 0;
  let majorCount = 0;
  let minorCount = 0;

  for (const issue of issues) {
    const impact = issue.impact ?? 0;

    switch (issue.type) {
      case 'critical':
        criticalCount++;
        totalDeduction += 35 + (impact >= 3 ? 15 : 0); // Amplify if high impact
        break;
      case 'major':
        majorCount++;
        totalDeduction += 15 + (impact >= 2 ? 5 : 0);
        break;
      case 'minor':
        minorCount++;
        totalDeduction += 5;
        break;
    }
  }

  // Context-aware penalties
  if (criticalCount >= 2) {
    totalDeduction += 20; // Multiple critical issues penalty
  }
  if (majorCount >= 3) {
    totalDeduction += 10; // Excessive major issue penalty
  }

  // Cap total deduction
  totalDeduction = Math.min(totalDeduction, 100);

  const rawScore = 100 - totalDeduction;
  return Math.max(0, parseFloat(rawScore.toFixed(2)));
}

// Compute reliability grade
export function getReliabilityGrade(score: number): ScoreGrade {
  return getGradeFromScore(score, scoreThresholds.reliability);
}

// Maintainability Score logic
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
    deduction += 20 * 0.2;
  } else if (duplicationPercentage > ANALYSIS_CONSTANTS.DUPLICATION.MODERATE) {
    deduction += 10 * 0.2;
  } else if (duplicationPercentage > ANALYSIS_CONSTANTS.DUPLICATION.LOW) {
    deduction += 5 * 0.2;
  }

  // Function size penalty
  if (avgFunctionSize >= ANALYSIS_CONSTANTS.FUNCTION_SIZE.HIGH) {
    deduction += 20;
  } else if (avgFunctionSize >= ANALYSIS_CONSTANTS.FUNCTION_SIZE.MODERATE) {
    deduction += 5 * 1.5;
  }

  // Documentation penalty
  if (documentationCoverage < ANALYSIS_CONSTANTS.DOCUMENTATION.POOR) {
    deduction += 15 * 0.25;
  } else if (documentationCoverage < ANALYSIS_CONSTANTS.DOCUMENTATION.ACCEPTABLE) {
    deduction += 7 * 0.25;
  }

  // Nesting depth penalty
  if (avgNestingDepth >= ANALYSIS_CONSTANTS.NESTING_DEPTH.HIGH) {
    deduction += 10;
  } else if (avgNestingDepth >= ANALYSIS_CONSTANTS.NESTING_DEPTH.MODERATE) {
    deduction += 5;
  }

  const rawScore = 100 - deduction;
  const finalScore = Math.max(0, Math.min(100, parseFloat(rawScore.toFixed(2))));
  return finalScore;
}

export function getMaintainabilityGrade(score: number): ScoreGrade {
  return getGradeFromScore(score, scoreThresholds.maintainability);
}

export function getMaintainabilityGradeFromCodeSmells(smellCount: number): ScoreGrade {
  return getGradeFromScore(smellCount, scoreThresholds.maintainability);
}

// Determine if reliability needs a warning flag
export function needsReliabilityWarningFlag(
  score: ScoreGrade,
  issues?: { type: string; impact: number }[]
): boolean {
  if (!issues || issues.length === 0) return false;

  if ((score === 'A' || score === 'B') &&
    issues.filter(issue =>
      issue.type === 'critical' || (issue.impact ?? 0) >= ANALYSIS_CONSTANTS.SEVERITY.CRITICAL
    ).length >= 2) {
    return true;
  }

  if (score === 'B') {
    const majorIssues = issues.filter(issue =>
      issue.type === 'major' || (issue.impact ?? 0) >= ANALYSIS_CONSTANTS.SEVERITY.MAJOR
    );
    if (majorIssues.length >= 3) return true;
  }

  return false;
}