
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
  categorizeViolations,
  generateCorrectedCode,
  generateAIFeedback
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
  
  // Generate test cases based on actual code
  const testCases = generateTestCasesFromCode(code, language);
  
  // Analyze for violations
  const { details: issuesList, lineReferences } = analyzeCodeForIssues(code);
  
  // Categorize violations as major or minor
  const violations = categorizeViolations(issuesList);
  violations.lineReferences = lineReferences;
  
  // Get code metrics
  const metrics = getCodeMetrics(code);
  
  // Generate AI feedback
  const aiSuggestions = generateAIFeedback(
    code,
    cyclomaticComplexityScore,
    maintainabilityScore,
    reliabilityScore,
    cyclomaticComplexity,
    maintainability,
    reliability,
    testCases,
    lineReferences,
    metrics
  );

  // Determine if corrected code should be provided
  const needsCorrection = violations.major > 0 || cyclomaticComplexityScore > 20 || maintainabilityScore < 50 || reliabilityScore < 50;
  
  return {
    cyclomaticComplexity,
    maintainability,
    reliability,
    violations,
    testCases,
    aiSuggestions,
    metrics,
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
