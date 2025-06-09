
// Export all quality rating functions
export * from './types';
export * from './scoringUtils';

// Export new SonarQube-style reliability system
export * from './sonarQubeReliability';

// Export the new violations framework
export * from './violationsFramework';

// Export new complexity analysis
export * from './complexityAnalysis';

// Export code smells detection
export * from './codeSmellsDetector';

// Export recommendations engine
export * from './recommendationsEngine';

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
import { analyzeComplexity } from './complexityAnalysis';
import { detectCodeSmells } from './codeSmellsDetector';
import { generateRecommendations } from './recommendationsEngine';

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
  needsReliabilityWarningFlag,
  analyzeComplexity,
  detectCodeSmells,
  generateRecommendations
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

// Enhanced analysis function that combines all metrics
export function getComprehensiveCodeQualityAnalysis(code: string, language: string) {
  // Get traditional metrics
  const complexityRating = getCyclomaticComplexityRating(
    calculateCyclomaticComplexity(code, language)
  );
  
  const maintainabilityRating = getMaintainabilityRating(
    calculateMaintainability(code, language)
  );
  
  const reliabilityResult = calculateReliability(code, language);
  const reliabilityRating = getReliabilityRating(reliabilityResult.score);
  
  // Get SonarQube-style violations
  const violationsAnalysis = analyzeCodeViolations(code, language);
  
  // Get new complexity analysis
  const complexityAnalysis = analyzeComplexity(code, language);
  
  // Get code smells
  const codeSmells = detectCodeSmells(code, language);
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    {
      reliability: reliabilityRating,
      cyclomaticComplexity: complexityRating,
      maintainability: maintainabilityRating
    } as any,
    codeSmells,
    complexityAnalysis
  );
  
  return {
    metrics: {
      cyclomaticComplexity: complexityRating,
      maintainability: maintainabilityRating,
      reliability: reliabilityRating
    },
    complexity: complexityAnalysis,
    codeSmells,
    recommendations,
    violations: violationsAnalysis,
    violationsReport: formatViolationsReport(violationsAnalysis),
    overallGrade: violationsAnalysis.grade,
    summary: {
      hasBlockerIssues: violationsAnalysis.summary.sonarQubeBreakdown.blocker > 0,
      hasCriticalIssues: violationsAnalysis.summary.sonarQubeBreakdown.critical > 0,
      totalIssues: violationsAnalysis.violations.length,
      technicalDebt: violationsAnalysis.summary.totalDebt,
      totalCodeSmells: codeSmells.summary.total,
      majorSmells: codeSmells.summary.major,
      highPriorityRecommendations: recommendations.summary.highPriority
    }
  };
}

// Import utility functions that would be used above
import { calculateCyclomaticComplexity, calculateMaintainability, calculateReliability } from '../codeMetrics';
