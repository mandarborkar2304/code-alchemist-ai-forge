
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
  // Calculate metrics using proper algorithms with language awareness
  const cyclomaticComplexityScore = calculateCyclomaticComplexity(code, language);
  const maintainabilityScore = calculateMaintainability(code, language);
  const reliabilityScore = calculateReliability(code, language);
  
  // Get the ratings for each metric
  const cyclomaticComplexity = getRatingFromScore(cyclomaticComplexityScore, 'cyclomaticComplexity');
  const maintainability = getRatingFromScore(maintainabilityScore, 'maintainability');
  const reliability = getRatingFromScore(reliabilityScore, 'reliability');
  
  // For simple code with only arithmetic operations and linear flow,
  // ensure no violations are reported
  let issuesList: string[] = [];
  let lineReferences: {line: number, issue: string, severity: 'major' | 'minor'}[] = [];
  
  // Only analyze for violations if code is non-trivial
  if (cyclomaticComplexityScore > 2) {
    const analysisResult = analyzeCodeForIssues(code, language);
    issuesList = analysisResult.details;
    lineReferences = analysisResult.lineReferences;
  }
  
  // Categorize violations
  const violations = categorizeViolations(issuesList, lineReferences);
  violations.lineReferences = lineReferences;
  
  // Get code metrics
  const metrics = getCodeMetrics(code, language);
  
  // Generate test cases with language awareness
  const testCases = generateTestCasesFromCode(code, language);
  
  // Compute overall code quality score as average of the three metrics
  const overallGrade = computeOverallGrade(cyclomaticComplexity.score, maintainability.score, reliability.score);
  
  // Generate language-specific AI suggestions
  let aiSuggestions: string;
  if (language === 'java') {
    aiSuggestions = generateJavaAISuggestions(code, violations, metrics);
  } else {
    aiSuggestions = "Code analysis complete.";
  }
  
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

// Generate Java-specific AI suggestions
function generateJavaAISuggestions(code: string, violations: any, metrics: any): string {
  let suggestions = "# Java Code Analysis\n\n";
  
  if (violations.major > 0) {
    suggestions += "## Critical Issues to Address\n\n";
    suggestions += "This code contains potential runtime errors that should be addressed:\n";
    
    // Extract major violations
    const majorViolations = violations.lineReferences
      ?.filter((ref: any) => ref.severity === 'major')
      .map((ref: any) => `- Line ${ref.line}: ${ref.issue}`)
      .join('\n');
      
    suggestions += majorViolations || "No critical issues found.\n";
    
    suggestions += "\n\n## Recommended Error Handling Approach\n\n";
    suggestions += "For Java code, consider using:\n\n";
    suggestions += "1. Try-catch blocks for critical operations\n";
    suggestions += "2. Java 8+ Optional<T> for null handling\n";
    suggestions += "3. Proper exception declarations in method signatures\n";
    suggestions += "4. Input validation before risky operations\n";
  }
  
  if (metrics.averageFunctionLength > 20) {
    suggestions += "\n\n## Method Length Concerns\n\n";
    suggestions += `Your methods average ${metrics.averageFunctionLength} lines, which exceeds recommended length. `;
    suggestions += "Consider extracting logic into smaller, focused helper methods.\n";
  }
  
  if (metrics.commentPercentage < 15) {
    suggestions += "\n\n## Documentation Recommendations\n\n";
    suggestions += "Your code would benefit from additional JavaDoc comments. ";
    suggestions += "Consider adding class-level documentation and method-level comments with @param and @return tags.\n";
  }
  
  return suggestions;
}

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
