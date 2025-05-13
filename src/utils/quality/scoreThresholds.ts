import { ScoreGrade } from '@/types';

// Centralized configuration constants
export const scoreThresholds = {
  maintainability: {
    A: 90,
    B: 80,
    C: 70,
    D: 0
  },
  cyclomaticComplexity: {
    A: 5,
    B: 10,
    C: 20,
    D: 21
  },
  reliability: {
    A: 5,
    B: 10,
    C: 20,
    D: 21
  }
};

// Analysis constants
export const ANALYSIS_CONSTANTS = {
  DUPLICATION: {
    LOW: 5,
    MODERATE: 10,
    HIGH: 20,
    IMPACT_MULTIPLIER: 0.25
  },
  FUNCTION_SIZE: {
    ACCEPTABLE: 0,
    MODERATE: 1,
    HIGH: 6,
    IMPACT_MULTIPLIER: 2,
    MAX_IMPACT: 25
  },
  DOCUMENTATION: {
    GOOD: 80,
    ACCEPTABLE: 70,
    POOR: 50,
    IMPACT_MULTIPLIER: 0.3
  },
  NESTING_DEPTH: {
    LOW: 3,
    MODERATE: 4,
    HIGH: 5
  },
  SEVERITY: {
    CRITICAL: 3,
    MAJOR: 2,
    MINOR: 1
  },
  RELIABILITY: {
    CRITICAL_DEDUCTION: 20,
    MAJOR_DEDUCTION: 12,
    MINOR_DEDUCTION: 4,
    MAX_DEDUCTION: 55
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

// ✅ Refactored: Maintainability Score using ANALYSIS_CONSTANTS multipliers
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
    deduction += 20 * ANALYSIS_CONSTANTS.DUPLICATION.IMPACT_MULTIPLIER;
  } else if (duplicationPercentage > ANALYSIS_CONSTANTS.DUPLICATION.MODERATE) {
    deduction += 10 * ANALYSIS_CONSTANTS.DUPLICATION.IMPACT_MULTIPLIER;
  } else if (duplicationPercentage > ANALYSIS_CONSTANTS.DUPLICATION.LOW) {
    deduction += 5 * ANALYSIS_CONSTANTS.DUPLICATION.IMPACT_MULTIPLIER;
  }

  // Function size penalty
  if (avgFunctionSize >= ANALYSIS_CONSTANTS.FUNCTION_SIZE.HIGH) {
    deduction += ANALYSIS_CONSTANTS.FUNCTION_SIZE.MAX_IMPACT;
  } else if (avgFunctionSize >= ANALYSIS_CONSTANTS.FUNCTION_SIZE.MODERATE) {
    deduction += 5 * ANALYSIS_CONSTANTS.FUNCTION_SIZE.IMPACT_MULTIPLIER;
  }

  // Documentation penalty
  if (documentationCoverage < ANALYSIS_CONSTANTS.DOCUMENTATION.POOR) {
    deduction += 15 * ANALYSIS_CONSTANTS.DOCUMENTATION.IMPACT_MULTIPLIER;
  } else if (documentationCoverage < ANALYSIS_CONSTANTS.DOCUMENTATION.ACCEPTABLE) {
    deduction += 7 * ANALYSIS_CONSTANTS.DOCUMENTATION.IMPACT_MULTIPLIER;
  }

  // Nesting depth penalty
  if (avgNestingDepth >= ANALYSIS_CONSTANTS.NESTING_DEPTH.HIGH) {
    deduction += 15;
  } else if (avgNestingDepth >= ANALYSIS_CONSTANTS.NESTING_DEPTH.MODERATE) {
    deduction += 8;
  }

  const rawScore = 100 - deduction;
  const finalScore = Math.max(0, Math.min(100, parseFloat(rawScore.toFixed(2))));

  return finalScore;
}

// ✅ Grade maintainability from the computed score
export function getMaintainabilityGrade(score: number): ScoreGrade {
  return getGradeFromScore(score, scoreThresholds.maintainability);
}

// ✅ Grade maintainability from code smell count
export function getMaintainabilityGradeFromCodeSmells(smellCount: number): ScoreGrade {
  return getGradeFromScore(smellCount, scoreThresholds.maintainability);
}

// ✅ Determine reliability warning flag
export function needsReliabilityWarningFlag(
  score: ScoreGrade,
  issues?: { type: string; impact: number }[]
): boolean {
  if (!issues || issues.length === 0) return false;

  if ((score === 'A' || score === 'B') &&
    issues.filter(issue => {
      const issueType = issue && issue.type;
      const issueImpact = issue && typeof issue.impact === 'number' ? issue.impact : 0;
      return issueType === 'critical' || issueImpact >= ANALYSIS_CONSTANTS.SEVERITY.CRITICAL;
    }).length >= 2) {
    return true;
  }

  if (score === 'B') {
    const majorIssues = issues.filter(issue => {
      const issueType = issue && issue.type;
      const issueImpact = issue && typeof issue.impact === 'number' ? issue.impact : 0;
      return issueType === 'major' || issueImpact >= ANALYSIS_CONSTANTS.SEVERITY.MAJOR;
    });

    if (majorIssues.length >= 3) {
      return true;
    }
  }

  return false;
}
