
// Export all quality rating functions
export * from './types';
export * from './scoringUtils';

// Export new SonarQube-style reliability system
export * from './sonarQubeReliability';

// Export the new violations framework
export * from './violationsFramework';

// Import required types
import { ScoreData } from './types';
import { ScoreGrade } from '@/types';

// Import and re-export functions
import { getReliabilityRating } from './reliabilityRating';
import { getCyclomaticComplexityRating } from './cyclomaticComplexityRating';
import { getMaintainabilityRating } from './maintainabilityRating';
import { categorizeReliabilityIssues } from './reliabilityHelpers';
import { analyzeCodeViolations, formatViolationsReport } from './violationsFramework';
import { scoreThresholds, getGradeFromScore, needsReliabilityWarningFlag } from './scoreThresholds';

// Export rating functions
export {
  getReliabilityRating,
  getCyclomaticComplexityRating,
  getMaintainabilityRating,
  categorizeReliabilityIssues,
  analyzeCodeViolations,
  formatViolationsReport,
  scoreThresholds,
  getGradeFromScore,
  needsReliabilityWarningFlag
};

// Helper function to get rating from numerical score
export function getRatingFromScore(score: number, category: 'reliability' | 'cyclomaticComplexity' | 'maintainability'): ScoreData {
  switch (category) {
    case 'reliability':
      return getReliabilityRating(score);
    case 'cyclomaticComplexity':
      return getCyclomaticComplexityRating(score);
    case 'maintainability':
      return getMaintainabilityRating(score);
    default:
      return {
        score: 'C' as ScoreGrade,
        description: 'Unknown metric',
        reason: 'No rating available for the requested metric',
        issues: []
      };
  }
}

// Enhanced analysis function that combines metrics with violations
export function getEnhancedCodeQualityAnalysis(code: string, language: string) {
  // Get traditional metrics
  const complexityRating = getCyclomaticComplexityRating(
    // This would call the updated cyclomatic complexity calculation
    calculateCyclomaticComplexity(code, language)
  );
  
  const maintainabilityRating = getMaintainabilityRating(
    // This would call the maintainability calculation
    calculateMaintainability(code, language)
  );
  
  const reliabilityResult = calculateReliability(code, language);
  const reliabilityRating = getReliabilityRating(reliabilityResult.score);
  
  // Get SonarQube-style violations
  const violationsAnalysis = analyzeCodeViolations(code, language);
  
  return {
    metrics: {
      cyclomaticComplexity: complexityRating,
      maintainability: maintainabilityRating,
      reliability: reliabilityRating
    },
    violations: violationsAnalysis,
    violationsReport: formatViolationsReport(violationsAnalysis),
    overallGrade: violationsAnalysis.grade,
    summary: {
      hasBlockerIssues: violationsAnalysis.summary.sonarQubeBreakdown.blocker > 0,
      hasCriticalIssues: violationsAnalysis.summary.sonarQubeBreakdown.critical > 0,
      totalIssues: violationsAnalysis.violations.length,
      technicalDebt: violationsAnalysis.summary.totalDebt
    }
  };
}

// Import utility functions that would be used above
// These imports would reference the updated functions in codeMetrics.ts
import { calculateCyclomaticComplexity, calculateMaintainability, calculateReliability } from '../codeMetrics';
