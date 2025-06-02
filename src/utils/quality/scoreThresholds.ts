import { ScoreGrade } from '@/types';

// Enhanced configuration constants with stricter grading
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
    A: 80,            // Raised from 75 to make A grade much harder
    B: 65,            // Raised from 60 to make B grade harder
    C: 50,            // Raised from 45 to ensure C captures moderate issues
    D: 0              
  }
};

// Enhanced analysis constants with stronger critical impact
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
    CRITICAL: 25,      // Increased from 20 for stronger impact
    MAJOR: 10,         // Increased from 8
    MINOR: 3           // Increased from 2
  },
  RELIABILITY: {
    CRITICAL_DEDUCTION: 70,    // Increased from 60
    MAJOR_DEDUCTION: 30,       // Increased from 25
    MINOR_DEDUCTION: 10,       // Increased from 8
    MAX_DEDUCTION: 100,
    MINIMUM_SCORE: 35,  // Increased from 40 for stricter floor
    LOW_RISK_THRESHOLD: 25,      // Lowered for more sensitive detection
    MODERATE_RISK_THRESHOLD: 50, // Lowered
    HIGH_RISK_THRESHOLD: 70,     // Lowered
    CRASH_RISK_THRESHOLD: 85     // Lowered for earlier detection
  },
  FACTORS: {
    TEST_CODE: 0.9,        // Reduced impact reduction for tests
    ERROR_HANDLING: 0.8,   // Reduced impact reduction for error handling
    UTILITY_CODE: 0.9,     // Reduced impact reduction for utilities
    REPEATED_ISSUES: 0.95, // Reduced impact reduction for repeated issues
    RARE_PATH: 0.5,
    EDGE_CASE: 0.7,
    VALIDATED_CODE: 0.6,
    UNVALIDATED_INPUT: 1.3,
    CONSERVATIVE_MODE: 1,
    GUARDED_PATH: 0.7      // Reduced impact reduction for guarded paths
  }
};

// Legacy compatibility - use the unified scoring utilities instead
export const issueSeverityWeights = {
  critical: ANALYSIS_CONSTANTS.SEVERITY.CRITICAL,
  major: ANALYSIS_CONSTANTS.SEVERITY.MAJOR,
  minor: ANALYSIS_CONSTANTS.SEVERITY.MINOR
};

// Grade determination helper - DEPRECATED: Use scoringUtils.calculateGradeFromScore instead
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
