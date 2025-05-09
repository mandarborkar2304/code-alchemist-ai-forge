
import { ScoreGrade } from '@/types';

// SonarQube-aligned scoring thresholds
export const scoreThresholds = {
  maintainability: {
    A: 90, // A: 90-100 (Highly maintainable)
    B: 80, // B: 80-89 (Good maintainability) 
    C: 70, // C: 70-79 (Moderate maintainability)
    D: 0   // D: <70 (Poor maintainability)
  },
  cyclomaticComplexity: {
    // SonarQube-aligned thresholds (McCabe's complexity)
    A: 10,  // A: ≤10 (Low complexity)
    B: 20,  // B: 11-20 (Moderate complexity)
    C: 30,  // C: 21-30 (High complexity)
    D: 31   // D: >30 (Very high complexity)
  },
  reliability: {
    A: 90, // A: 90-100 (Highly reliable)
    B: 75, // B: 75-89 (Good reliability) - Adjusted to match SonarQube
    C: 60, // C: 60-74 (Moderate reliability) - Adjusted to match SonarQube
    D: 0   // D: <60 (Poor reliability) - Adjusted to match SonarQube
  }
};

// SonarQube-aligned issue severity weights
export const issueSeverityWeights = {
  critical: 3, // Blocker issues (critical)
  major: 1,    // Major issues
  minor: 0     // Minor issues (no deduction)
};

// Obtain the appropriate grade based on a score and thresholds
export function getGradeFromScore(score: number, thresholds: Record<ScoreGrade, number>): ScoreGrade {
  if (score >= thresholds.A) return 'A';
  if (score >= thresholds.B) return 'B';
  if (score >= thresholds.C) return 'C';
  return 'D';
}
