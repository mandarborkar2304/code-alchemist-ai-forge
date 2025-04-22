
import { CodeAnalysis } from "@/types";
import { 
  calculateCyclomaticComplexity,
  calculateMaintainability,
  calculateReliability,
  getCodeMetrics
} from "./codeMetrics";
import { getRatingFromScore } from "./codeQualityRatings";
import { 
  analyzeCodeForIssues,
  categorizeViolations,
  generateCorrectedCode,
} from "./codeAnalysis";

export const generateMockAnalysis = (code: string, language: string): CodeAnalysis => {
  // Calculate actual metrics
  const cyclomaticComplexityScore = calculateCyclomaticComplexity(code);
  const maintainabilityScore = calculateMaintainability(code);
  const reliabilityScore = calculateReliability(code);
  
  // Get the ratings for each metric
  const cyclomaticComplexity = getRatingFromScore(cyclomaticComplexityScore, 'cyclomaticComplexity');
  const maintainability = getRatingFromScore(maintainabilityScore, 'maintainability');
  const reliability = getRatingFromScore(reliabilityScore, 'reliability');
  
  // Analyze for violations
  const { details: issuesList, lineReferences } = analyzeCodeForIssues(code);
  
  // Categorize violations as major or minor
  const violations = categorizeViolations(issuesList);
  violations.lineReferences = lineReferences;
  
  // Get code metrics
  const metrics = getCodeMetrics(code);
  
  // Determine if corrected code should be provided
  const needsCorrection = violations.major > 0 || cyclomaticComplexityScore > 20 || maintainabilityScore < 50 || reliabilityScore < 50;
  
  // Compute overall code quality score
  const overallGrade = computeOverallGrade(cyclomaticComplexity.score, maintainability.score, reliability.score);
  
  return {
    cyclomaticComplexity,
    maintainability,
    reliability,
    violations,
    metrics,
    overallGrade,
    correctedCode: needsCorrection 
      ? generateCorrectedCode(code, {
          cyclomaticComplexity: cyclomaticComplexityScore,
          maintainability: maintainabilityScore,
          reliability: reliabilityScore,
          violations
        })
      : undefined
  };
};

// Function to compute an overall grade from individual metrics
function computeOverallGrade(complexity: 'A' | 'B' | 'C' | 'D', maintainability: 'A' | 'B' | 'C' | 'D', reliability: 'A' | 'B' | 'C' | 'D'): 'A' | 'B' | 'C' | 'D' {
  // Convert letter grades to numbers (A=4, B=3, C=2, D=1)
  const gradeValues = {
    'A': 4,
    'B': 3,
    'C': 2,
    'D': 1
  };
  
  // Calculate average grade value
  const complexityValue = gradeValues[complexity];
  const maintainabilityValue = gradeValues[maintainability];
  const reliabilityValue = gradeValues[reliability];
  
  const averageValue = (complexityValue + maintainabilityValue + reliabilityValue) / 3;
  
  // Convert back to letter grade
  if (averageValue >= 3.5) return 'A';
  if (averageValue >= 2.5) return 'B';
  if (averageValue >= 1.5) return 'C';
  return 'D';
}
