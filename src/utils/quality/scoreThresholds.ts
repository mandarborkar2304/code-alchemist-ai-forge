// types.ts (assumed unchanged, just importing ScoreGrade)
import { ScoreGrade } from '@/types'; 

export const scoreThresholds = {
  maintainability: {
    A: 85,
    B: 70,
    C: 55,
    D: 0
  },
  cyclomaticComplexity: {
    A: 10,   // ≤10 → A
    B: 20,   // ≤20 → B
    C: 35,   // ≤35 → C
    D: 100   // >35 → D (use high cap)
  },
  reliability: {      
    A: 80,           
    B: 65,          
    C: 50,          
    D: 0           
  }
};

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
    CRITICAL: 25,
    MAJOR: 10,
    MINOR: 3
  },
  RELIABILITY: {
    CRITICAL_DEDUCTION: 70,
    MAJOR_DEDUCTION: 30,
    MINOR_DEDUCTION: 10,
    MAX_DEDUCTION: 100,
    MINIMUM_SCORE: 35,
    LOW_RISK_THRESHOLD: 25,
    MODERATE_RISK_THRESHOLD: 50,
    HIGH_RISK_THRESHOLD: 70,
    CRASH_RISK_THRESHOLD: 85
  },
  FACTORS: {
    TEST_CODE: 0.9,
    ERROR_HANDLING: 0.8,
    UTILITY_CODE: 0.9,
    REPEATED_ISSUES: 0.95,
    RARE_PATH: 0.5,
    EDGE_CASE: 0.7,
    VALIDATED_CODE: 0.6,
    UNVALIDATED_INPUT: 1.3,
    CONSERVATIVE_MODE: 1,
    GUARDED_PATH: 0.7
  }
};

export const issueSeverityWeights = {
  critical: ANALYSIS_CONSTANTS.SEVERITY.CRITICAL,
  major: ANALYSIS_CONSTANTS.SEVERITY.MAJOR,
  minor: ANALYSIS_CONSTANTS.SEVERITY.MINOR
};

// 🚨 PATCHED: flipped comparison to use upper bounds
export function getGradeFromScore(score: number, thresholds: Record<ScoreGrade, number>): ScoreGrade {
  if (score === undefined || score === null || isNaN(score)) {
    console.warn('Invalid score provided to getGradeFromScore:', score);
    return 'C';
  }

  const sortedGrades: ScoreGrade[] = ['A', 'B', 'C', 'D'];
  for (const grade of sortedGrades) {
    if (score <= thresholds[grade]) return grade;
  }
  return 'D';
}

export function getReliabilityGrade(score: number): ScoreGrade {
  return getGradeFromScore(score, scoreThresholds.reliability);
}

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

  if (duplicationPercentage > ANALYSIS_CONSTANTS.DUPLICATION.HIGH) {
    deduction += 20 * 0.2;
  } else if (duplicationPercentage > ANALYSIS_CONSTANTS.DUPLICATION.MODERATE) {
    deduction += 10 * 0.2;
  } else if (duplicationPercentage > ANALYSIS_CONSTANTS.DUPLICATION.LOW) {
    deduction += 5 * 0.2;
  }

  if (avgFunctionSize >= ANALYSIS_CONSTANTS.FUNCTION_SIZE.HIGH) {
    deduction += 20;
  } else if (avgFunctionSize >= ANALYSIS_CONSTANTS.FUNCTION_SIZE.MODERATE) {
    deduction += 5 * 1.5;
  }

  if (documentationCoverage < ANALYSIS_CONSTANTS.DOCUMENTATION.POOR) {
    deduction += 15 * 0.25;
  } else if (documentationCoverage < ANALYSIS_CONSTANTS.DOCUMENTATION.ACCEPTABLE) {
    deduction += 7 * 0.25;
  }

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