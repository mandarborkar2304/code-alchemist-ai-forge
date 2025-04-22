
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
  generateTestCasesFromCode, 
  categorizeViolations
} from "./codeAnalysis";

export const generateMockAnalysis = (code: string, language: string): CodeAnalysis => {
  // Calculate metrics using proper algorithms
  const cyclomaticComplexityScore = calculateCyclomaticComplexity(code);
  const maintainabilityScore = calculateMaintainability(code);
  const reliabilityScore = calculateReliability(code);
  
  // Get the ratings for each metric
  const cyclomaticComplexity = getRatingFromScore(cyclomaticComplexityScore, 'cyclomaticComplexity');
  const maintainability = getRatingFromScore(maintainabilityScore, 'maintainability');
  const reliability = getRatingFromScore(reliabilityScore, 'reliability');
  
  // For simple code with only arithmetic operations and linear flow,
  // ensure no violations are reported
  let issuesList: string[] = [];
  let lineReferences: {line: number, issue: string}[] = [];
  
  // Only analyze for violations if code is non-trivial
  if (cyclomaticComplexityScore > 2) {
    const analysisResult = analyzeCodeForIssues(code);
    issuesList = analysisResult.details;
    lineReferences = analysisResult.lineReferences;
  }
  
  // Categorize violations
  const violations = categorizeViolations(issuesList);
  violations.lineReferences = lineReferences;
  
  // Get code metrics
  const metrics = getCodeMetrics(code);
  
  // Generate test cases (kept for backward compatibility)
  const testCases = generateTestCasesFromCode(code, language);
  
  // Compute overall code quality score as average of the three metrics
  const overallGrade = computeOverallGrade(cyclomaticComplexity.score, maintainability.score, reliability.score);
  
  // Generate a minimal placeholder for AI suggestions
  const aiSuggestions = "Code analysis complete.";
  
  return {
    cyclomaticComplexity,
    maintainability,
    reliability,
    violations,
    testCases,
    aiSuggestions,
    metrics,
    overallGrade
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
