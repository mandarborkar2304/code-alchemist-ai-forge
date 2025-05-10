
import { ScoreGrade } from '@/types';

// SonarQube-aligned scoring thresholds (adjusted to map SonarQube's A-E to our A-D)
export const scoreThresholds = {
  maintainability: {
    A: 90, // A: 90-100 (Highly maintainable, maps to SonarQube A)
    B: 80, // B: 80-89 (Good maintainability, maps to SonarQube B) 
    C: 70, // C: 70-79 (Moderate maintainability, maps to SonarQube C)
    D: 0   // D: <70 (Poor maintainability, maps to both SonarQube D and E)
  },
  cyclomaticComplexity: {
    // Updated thresholds to align with industry standards
    A: 5,  // A: ≤5 (Very low complexity) - Best practice
    B: 10, // B: 6-10 (Low complexity) - Good practice
    C: 20, // C: 11-20 (Moderate complexity) - Acceptable
    D: 21  // D: >20 (High complexity) - Needs refactoring
  },
  reliability: {
    A: 90, // A: 90-100 (Highly reliable, no critical issues)
    B: 75, // B: 75-89 (Good reliability, minor issues only)
    C: 60, // C: 60-74 (Moderate reliability, some major issues)
    D: 0   // D: <60 (Poor reliability, critical issues present)
  }
};

// Enhanced SonarQube-aligned issue severity weights with greater penalty for critical issues
export const issueSeverityWeights = {
  critical: 3, // Critical issues (was 3, kept the same for severe, blocking issues)
  major: 2,    // Major issues (increased from 1 to 2 for better differentiation)
  minor: 1     // Minor issues (increased from 0 to 1 to ensure they have some impact)
};

// Obtain the appropriate grade based on a score and thresholds
export function getGradeFromScore(score: number, thresholds: Record<ScoreGrade, number>): ScoreGrade {
  if (score >= thresholds.A) return 'A';
  if (score >= thresholds.B) return 'B';
  if (score >= thresholds.C) return 'C';
  return 'D';
}

// Enhanced function to determine if a reliability score needs a warning flag
export function needsReliabilityWarningFlag(
  score: ScoreGrade, 
  issues?: { type: string; impact: number }[]
): boolean {
  if (!issues || issues.length === 0) return false;
  
  // Flag if there's an A or B score but critical issues exist
  if ((score === 'A' || score === 'B') && 
      issues.some(issue => issue.type === 'critical' || issue.impact >= 3)) {
    return true;
  }
  
  // Flag if there's a B score but multiple major issues exist
  if (score === 'B' && 
      issues.filter(issue => issue.type === 'major' || issue.impact >= 2).length >= 2) {
    return true;
  }
  
  return false;
}
