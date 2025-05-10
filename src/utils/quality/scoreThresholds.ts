
import { ScoreGrade } from '@/types';

// Centralized configuration constants
// SonarQube-aligned scoring thresholds
export const scoreThresholds = {
  maintainability: {
    A: 90, // A: 90-100 (Highly maintainable)
    B: 80, // B: 80-89 (Good maintainability)
    C: 70, // C: 70-79 (Moderate maintainability)
    D: 0   // D: <70 (Poor maintainability)
  },
  cyclomaticComplexity: {
    // Updated thresholds aligned with industry standards
    A: 5,  // A: ≤5 (Very low complexity)
    B: 10, // B: 6-10 (Low complexity)
    C: 20, // C: 11-20 (Moderate complexity)
    D: 21  // D: >20 (High complexity)
  },
  reliability: {
    A: 90, // A: 90-100 (Highly reliable)
    B: 75, // B: 75-89 (Good reliability)
    C: 60, // C: 60-74 (Moderate reliability)
    D: 0   // D: <60 (Poor reliability)
  }
};

// Analysis constants
export const ANALYSIS_CONSTANTS = {
  // Duplication thresholds
  DUPLICATION: {
    LOW: 5,
    MODERATE: 10, 
    HIGH: 20,
    IMPACT_MULTIPLIER: 2
  },
  // Function size thresholds
  FUNCTION_SIZE: {
    ACCEPTABLE: 0,
    MODERATE: 1,
    HIGH: 6,
    IMPACT_MULTIPLIER: 3,
    MAX_IMPACT: 25
  },
  // Documentation thresholds
  DOCUMENTATION: {
    GOOD: 80,
    ACCEPTABLE: 70,
    POOR: 50,
    IMPACT_MULTIPLIER: 0.4
  },
  // Nesting depth thresholds
  NESTING_DEPTH: {
    LOW: 3,
    MODERATE: 4,
    HIGH: 5
  },
  // Issue severity weights with greater penalty for critical issues
  SEVERITY: {
    CRITICAL: 3,
    MAJOR: 2,
    MINOR: 1
  },
  // Reliability deduction caps
  RELIABILITY: {
    CRITICAL_DEDUCTION: 20,
    MAJOR_DEDUCTION: 15,
    MINOR_DEDUCTION: 5,
    MAX_DEDUCTION: 60
  },
  // Factor adjustments
  FACTORS: {
    TEST_CODE: 0.5,
    ERROR_HANDLING: 0.7,
    UTILITY_CODE: 0.8,
    REPEATED_ISSUES: 0.9,
    RARE_PATH: 0.6,
    EDGE_CASE: 0.8,
    VALIDATED_CODE: 0.7,
    UNVALIDATED_INPUT: 1.2,
    CONSERVATIVE_MODE: 0.8
  }
};

// Severity weights now centralized
export const issueSeverityWeights = {
  critical: ANALYSIS_CONSTANTS.SEVERITY.CRITICAL,
  major: ANALYSIS_CONSTANTS.SEVERITY.MAJOR,
  minor: ANALYSIS_CONSTANTS.SEVERITY.MINOR
};

// Obtain the appropriate grade based on a score and thresholds
export function getGradeFromScore(score: number, thresholds: Record<ScoreGrade, number>): ScoreGrade {
  // Validate input to prevent NaN or invalid scores
  if (score === undefined || score === null || isNaN(score)) {
    console.warn('Invalid score provided to getGradeFromScore:', score);
    return 'D'; // Default to worst grade for invalid input
  }
  
  // Safe comparison with validation
  if (score >= thresholds.A) return 'A';
  if (score >= thresholds.B) return 'B';
  if (score >= thresholds.C) return 'C';
  return 'D';
}

// Function to determine if a reliability score needs a warning flag
export function needsReliabilityWarningFlag(
  score: ScoreGrade, 
  issues?: { type: string; impact: number }[]
): boolean {
  // Early return for no issues
  if (!issues || issues.length === 0) return false;
  
  // Check for critical issues with high grades
  if ((score === 'A' || score === 'B') && 
      issues.some(issue => {
        // Safe access with validation
        const issueType = issue && issue.type;
        const issueImpact = issue && typeof issue.impact === 'number' ? issue.impact : 0;
        return issueType === 'critical' || issueImpact >= ANALYSIS_CONSTANTS.SEVERITY.CRITICAL;
      })) {
    return true;
  }
  
  // Check for multiple major issues with B grade
  if (score === 'B') {
    const majorIssues = issues.filter(issue => {
      // Safe access with validation
      const issueType = issue && issue.type;
      const issueImpact = issue && typeof issue.impact === 'number' ? issue.impact : 0;
      return issueType === 'major' || issueImpact >= ANALYSIS_CONSTANTS.SEVERITY.MAJOR;
    });
    
    if (majorIssues.length >= 2) {
      return true;
    }
  }
  
  return false;
}
