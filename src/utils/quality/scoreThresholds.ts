
import { ScoreGrade } from '@/types';

// Centralized configuration constants
// SonarQube-aligned scoring thresholds
export const scoreThresholds = {
  maintainability: {
    A: 5,   // A: ≤5 code smells (Highly maintainable)
    B: 10,  // B: 6-10 (Good maintainability)
    C: 20,  // C: 11-20 (Moderate maintainability)
    D: 21   // D: >20 (Poor maintainability)
  },
  cyclomaticComplexity: {
    A: 5,  // A: ≤5 (Very low complexity)
    B: 10, // B: 6-10 (Low complexity)
    C: 20, // C: 11-20 (Moderate complexity)
    D: 21  // D: >20 (High complexity)
  },
  reliability: {
    A: 5,   // A: ≤5 issues
    B: 10,  // B: 6-10 issues
    C: 20,  // C: 11-20 issues
    D: 21   // D: >20 issues
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
  // Reliability deduction caps - further reduced penalties for better grading
  RELIABILITY: {
    CRITICAL_DEDUCTION: 20, // Further reduced from 25
    MAJOR_DEDUCTION: 12,    // Further reduced from 15
    MINOR_DEDUCTION: 4,     // Further reduced from 5
    MAX_DEDUCTION: 55       // Further reduced from 60
  },
  // Factor adjustments
  FACTORS: {
    TEST_CODE: 0.5,        // Less impact for issues in test code
    ERROR_HANDLING: 0.7,   // Reduced impact in error handling blocks
    UTILITY_CODE: 0.8,     // Slight reduction for utility code
    REPEATED_ISSUES: 0.9,  // Avoid penalizing the same issue repeatedly
    RARE_PATH: 0.4,        // Significant reduction for rarely executed paths
    EDGE_CASE: 0.6,        // Moderate reduction for edge cases
    VALIDATED_CODE: 0.5,   // Reduced penalty for validated code
    UNVALIDATED_INPUT: 1.2, // Increased penalty for unvalidated inputs
    CONSERVATIVE_MODE: 0.7, // Increased reduction in conservative scoring mode (from 0.8 to 0.7)
    GUARDED_PATH: 0.6      // Reduction factor for paths with guards
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
    return 'C'; // Default to average grade for invalid input instead of worst grade
  }
  
  // Safe comparison with validation
  if (score >= thresholds.A) return 'A';
  if (score >= thresholds.B) return 'B';
  if (score >= thresholds.C) return 'C';
  return 'D';
}

// ✅ New: Reliability grade from issue count (SonarQube-style)
export function getReliabilityGradeFromIssueCount(issueCount: number): ScoreGrade {
  if (issueCount <= scoreThresholds.reliability.A) return 'A';
  if (issueCount <= scoreThresholds.reliability.B) return 'B';
  if (issueCount <= scoreThresholds.reliability.C) return 'C';
  return 'D';
}

// ✅ New: Maintainability grade from code smell count
export function getMaintainabilityGradeFromCodeSmells(smellCount: number): ScoreGrade {
  return getGradeFromScore(smellCount, scoreThresholds.maintainability);
}

// Function to determine if a reliability score needs a warning flag
export function needsReliabilityWarningFlag(
  score: ScoreGrade, 
  issues?: { type: string; impact: number }[]
): boolean {
  // Early return for no issues
  if (!issues || issues.length === 0) return false;
  
  // Check for critical issues with high grades - only warn for multiple critical issues
  if ((score === 'A' || score === 'B') && 
      issues.filter(issue => {
        // Safe access with validation
        const issueType = issue && issue.type;
        const issueImpact = issue && typeof issue.impact === 'number' ? issue.impact : 0;
        return issueType === 'critical' || issueImpact >= ANALYSIS_CONSTANTS.SEVERITY.CRITICAL;
      }).length >= 2) {
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
    
    if (majorIssues.length >= 3) { // Increased from 2 to 3
      return true;
    }
  }
  
  return false;
}
