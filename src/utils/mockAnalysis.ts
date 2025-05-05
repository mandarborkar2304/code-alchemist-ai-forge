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
  
  // Skip analysis only for very trivial code
  const isTrivialCode = code.split('\n').length < 5 && !code.includes('if') && !code.includes('for');
  
  if (!isTrivialCode) {
    const analysisResult = analyzeCodeForIssues(code, language);
    issuesList = analysisResult.details;
    lineReferences = analysisResult.lineReferences;
  }
  
  // Categorize violations with improved context-aware algorithm
  const violations = categorizeViolations(issuesList, lineReferences);
  violations.lineReferences = lineReferences;
  
  // Get code metrics
  const metrics = getCodeMetrics(code, language);
  
  // Generate test cases with language awareness 
  // and competitive programming structure detection
  const testCases = generateTestCasesFromCode(code, language);
  
  // Compute overall code quality score as average of the three metrics
  const overallGrade = computeOverallGrade(cyclomaticComplexity.score, maintainability.score, reliability.score);
  
  // Generate language-specific AI suggestions
  let aiSuggestions: string;
  
  if (language === 'java') {
    aiSuggestions = generateJavaAISuggestions(code, violations, metrics);
  } else {
    aiSuggestions = generateGenericAISuggestions(code, violations, metrics, language);
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

// Generate Java-specific AI suggestions with competitive programming focus
function generateJavaAISuggestions(code: string, violations: any, metrics: any): string {
  let suggestions = "# Java Code Analysis\n\n";
  
  // Detect if this is likely competitive programming code
  const isCompetitiveProgramming = code.includes("public static void main") &&
    (code.includes("Scanner") || code.includes("BufferedReader")) &&
    code.length < 1000;
    
  if (isCompetitiveProgramming) {
    suggestions += "## Competitive Programming Context Detected\n\n";
    suggestions += "Analysis is adjusted for competitive programming constraints:\n";
    suggestions += "- Time complexity is prioritized over readability\n";
    suggestions += "- Some conventional OOP practices may be relaxed\n";
    suggestions += "- Focus is on algorithmic efficiency rather than maintainability\n\n";
  }
  
  if (violations.major > 0) {
    suggestions += "## Critical Issues to Address\n\n";
    
    // Extract major violations with improved deduplication
    const majorViolations = violations.lineReferences
      ?.filter((ref: any) => ref.severity === 'major')
      .map((ref: any) => `- Line ${ref.line}: ${ref.issue}`)
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i) // Deduplicate
      .join('\n');
      
    suggestions += majorViolations || "No critical issues found.\n";
    
    suggestions += "\n\n## Recommended Error Handling Approach\n\n";
    
    if (isCompetitiveProgramming) {
      suggestions += "For competitive programming in Java, consider:\n\n";
      suggestions += "1. Input validation before processing (check array bounds and division by zero)\n";
      suggestions += "2. Using fast I/O methods like BufferedReader instead of Scanner for large inputs\n";
      suggestions += "3. Handling integer overflow with long types for large computations\n";
      suggestions += "4. Pre-checking array bounds before accessing elements\n";
    } else {
      suggestions += "For production Java code, consider:\n\n";
      suggestions += "1. Try-catch blocks for critical operations\n";
      suggestions += "2. Java 8+ Optional<T> for null handling\n";
      suggestions += "3. Proper exception declarations in method signatures\n";
      suggestions += "4. Input validation before risky operations\n";
    }
  }
  
  if (metrics.averageFunctionLength > 20 && !isCompetitiveProgramming) {
    suggestions += "\n\n## Method Length Concerns\n\n";
    suggestions += `Your methods average ${metrics.averageFunctionLength} lines, which exceeds recommended length. `;
    suggestions += "Consider extracting logic into smaller, focused helper methods.\n";
  }
  
  if (metrics.commentPercentage < 15 && !isCompetitiveProgramming) {
    suggestions += "\n\n## Documentation Recommendations\n\n";
    suggestions += "Your code would benefit from additional JavaDoc comments. ";
    suggestions += "Consider adding class-level documentation and method-level comments with @param and @return tags.\n";
  }
  
  // Add algorithmic efficiency suggestions for competitive programming
  if (isCompetitiveProgramming) {
    suggestions += "\n\n## Algorithm Optimization Tips\n\n";
    
    // Check for nested loops that could be optimized
    if (code.includes("for") && code.match(/for\s*\([^{]+\{[\s\S]*?for\s*\(/)) {
      suggestions += "- Consider optimization for nested loops to reduce time complexity\n";
      suggestions += "- Look for opportunities to use more efficient data structures (HashSet/HashMap)\n";
      suggestions += "- Consider precomputing values or using dynamic programming techniques\n";
    }
    
    // Check for StringBuilder usage with string concatenation in loops
    if (code.includes("for") && code.includes("+=") && code.includes("String")) {
      suggestions += "- Replace string concatenation in loops with StringBuilder for better performance\n";
    }
    
    // Check for primitive arrays vs. ArrayList usage
    if (code.includes("ArrayList") && code.includes("for")) {
      suggestions += "- Consider using primitive arrays instead of ArrayList for better performance in critical loops\n";
    }
  }
  
  return suggestions;
}

// Generate generic AI suggestions for other languages
function generateGenericAISuggestions(code: string, violations: any, metrics: any, language: string): string {
  let suggestions = `# ${language.charAt(0).toUpperCase() + language.slice(1)} Code Analysis\n\n`;
  
  if (violations.major > 0) {
    suggestions += "## Critical Issues\n\n";
    
    // Extract major violations
    const majorViolations = violations.lineReferences
      ?.filter((ref: any) => ref.severity === 'major')
      .map((ref: any) => `- Line ${ref.line}: ${ref.issue}`)
      .join('\n');
      
    suggestions += majorViolations || "No critical issues found.\n";
    
    suggestions += "\n\n## Recommended Improvements\n\n";
    suggestions += "1. Add proper error handling with try-catch blocks\n";
    suggestions += "2. Validate inputs before processing\n";
    suggestions += "3. Check for null/undefined values before access\n";
  }
  
  if (metrics.averageFunctionLength > 20) {
    suggestions += "\n\n## Code Structure\n\n";
    suggestions += `Your functions average ${metrics.averageFunctionLength} lines, which exceeds recommended length. `;
    suggestions += "Consider breaking down into smaller, more focused functions.\n";
  }
  
  if (metrics.commentPercentage < 15) {
    suggestions += "\n\n## Documentation\n\n";
    suggestions += "Your code would benefit from additional comments. ";
    suggestions += "Consider adding function-level documentation and inline comments for complex logic.\n";
  }
  
  suggestions += "\n\n## General Recommendations\n\n";
  suggestions += "- Replace magic numbers with named constants\n";
  suggestions += "- Use descriptive variable names\n";
  suggestions += "- Consider adding more test cases\n";
  
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
  
  // Calculate average grade value with reliability weighted more heavily
  const complexityValue = gradeValues[complexity];
  const maintainabilityValue = gradeValues[maintainability];
  const reliabilityValue = gradeValues[reliability];
  
  // Weight reliability more heavily (2x) in the overall calculation
  const weightedAverage = (complexityValue + maintainabilityValue + (reliabilityValue * 2)) / 4;
  
  // Convert back to letter grade
  if (weightedAverage >= 3.5) return 'A';
  if (weightedAverage >= 2.5) return 'B';
  if (weightedAverage >= 1.5) return 'C';
  return 'D';
}
