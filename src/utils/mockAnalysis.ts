
import { CodeAnalysis } from "@/types";
import { 
  calculateCyclomaticComplexity,
  calculateMaintainability,
  calculateReliability,
  getCodeMetrics,
  scoreToGrade
} from "./codeMetrics";
import { getRatingFromScore } from "./codeQualityRatings";
import { 
  analyzeCodeForIssues, 
  generateTestCasesFromCode, 
  categorizeViolations
} from "./codeAnalysis";

export const generateMockAnalysis = (code: string, language: string): CodeAnalysis => {
  // Calculate metrics using SonarQube-aligned algorithms
  const cyclomaticComplexityScore = calculateCyclomaticComplexity(code, language);
  const maintainabilityScore = calculateMaintainability(code, language);
  const reliabilityResult = calculateReliability(code, language);
  
  // Get the ratings for each metric using SonarQube-aligned thresholds
  const cyclomaticComplexity = getRatingFromScore(cyclomaticComplexityScore, 'cyclomaticComplexity');
  const maintainability = getRatingFromScore(maintainabilityScore, 'maintainability');
  const reliability = getRatingFromScore(reliabilityResult.score, 'reliability', reliabilityResult.issues);
  
  // Skip analysis for trivial code
  let issuesList: string[] = [];
  let lineReferences: {line: number, issue: string, severity: 'major' | 'minor'}[] = [];
  
  // Only analyze non-trivial code
  const isTrivialCode = code.split('\n').length < 5 && !code.includes('if') && !code.includes('for');
  
  if (!isTrivialCode) {
    const analysisResult = analyzeCodeForIssues(code, language);
    issuesList = analysisResult.details;
    lineReferences = analysisResult.lineReferences;
  }
  
  // Categorize violations using SonarQube terminology
  const violations = categorizeViolations(issuesList, lineReferences);
  violations.lineReferences = lineReferences;
  
  // Get code metrics
  const metrics = getCodeMetrics(code, language);
  
  // Generate test cases
  const testCases = generateTestCasesFromCode(code, language);
  
  // Compute overall code quality score with weighted reliability
  const overallGrade = computeOverallGrade(cyclomaticComplexity.score, maintainability.score, reliability.score);
  
  // Generate language-specific AI suggestions with SonarQube terminology
  let aiSuggestions: string;
  
  if (language === 'java') {
    aiSuggestions = generateSonarQubeStyleJavaSuggestions(code, violations, metrics, reliabilityResult.issues);
  } else {
    aiSuggestions = generateSonarQubeStyleSuggestions(code, violations, metrics, language, reliabilityResult.issues);
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

// Generate Java-specific SonarQube-style suggestions
function generateSonarQubeStyleJavaSuggestions(code: string, violations: any, metrics: any, issues: any[]): string {
  let suggestions = "# SonarQube-Style Code Analysis\n\n";
  
  // Detect competitive programming context
  const isCompetitiveProgramming = code.includes("public static void main") &&
    (code.includes("Scanner") || code.includes("BufferedReader")) &&
    code.length < 1000;
    
  if (isCompetitiveProgramming) {
    suggestions += "## Competitive Programming Context Detected\n\n";
    suggestions += "Analysis is tailored for competitive programming:\n";
    suggestions += "- Time complexity optimization is prioritized\n";
    suggestions += "- Standard OOP practices are applied with context\n";
    suggestions += "- Algorithm efficiency is the primary focus\n\n";
  }
  
  // Add SonarQube-style issue section
  suggestions += "## Quality Issues\n\n";
  
  // Group issues by type (Bugs vs Code Smells)
  const bugs = issues.filter(i => i.category === 'runtime' || i.category === 'exception');
  const codeSmells = issues.filter(i => i.category === 'structure' || i.category === 'readability');
  
  if (bugs.length > 0) {
    suggestions += "### Bugs\n\n";
    bugs.forEach(bug => {
      suggestions += `- ${bug.description}${bug.line ? ` (line ${bug.line})` : ''}\n`;
    });
    suggestions += "\n";
  }
  
  if (codeSmells.length > 0) {
    suggestions += "### Code Smells\n\n";
    codeSmells.forEach(smell => {
      suggestions += `- ${smell.description}${smell.line ? ` (line ${smell.line})` : ''}\n`;
    });
    suggestions += "\n";
  }
  
  // Add maintainability issues
  if (metrics.averageFunctionLength > 30 && !isCompetitiveProgramming) {
    suggestions += "### Maintainability Issues\n\n";
    suggestions += `- Method length: Average of ${Math.round(metrics.averageFunctionLength)} lines exceeds recommended length of 30 lines\n`;
    suggestions += "- Consider extracting complex logic into smaller, focused helper methods\n\n";
  }
  
  // Add complexity issues if relevant
  if (metrics.cyclomaticComplexity > 10) {
    suggestions += "### Complexity Issues\n\n";
    suggestions += `- Cyclomatic Complexity: ${metrics.cyclomaticComplexity} exceeds recommended threshold of 10\n`;
    suggestions += "- Consider refactoring complex methods into smaller units with clear responsibilities\n\n";
  }
  
  // Add documentation insights
  if (metrics.commentPercentage < 15 && !isCompetitiveProgramming && metrics.linesOfCode > 30) {
    suggestions += "### Documentation Issues\n\n";
    suggestions += "- Insufficient comments: Add JavaDoc comments to classes and methods\n";
    suggestions += "- Consider adding @param and @return tags to method documentation\n\n";
  }
  
  // Add algorithmic efficiency recommendations for competitive programming
  if (isCompetitiveProgramming) {
    suggestions += "### Algorithm Optimization\n\n";
    
    if (code.includes("for") && code.match(/for\s*\([^{]+\{[\s\S]*?for\s*\(/)) {
      suggestions += "- Nested loops have O(n²) or higher complexity - consider more efficient algorithms\n";
      suggestions += "- Look for opportunities to use more efficient data structures (HashSet/HashMap)\n";
      suggestions += "- Consider memoization or dynamic programming techniques\n\n";
    }
    
    if (code.includes("for") && code.includes("+=") && code.includes("String")) {
      suggestions += "- Replace string concatenation in loops with StringBuilder for better performance\n\n";
    }
  }
  
  return suggestions;
}

// Generate SonarQube-style suggestions for other languages
function generateSonarQubeStyleSuggestions(code: string, violations: any, metrics: any, language: string, issues: any[]): string {
  let suggestions = `# SonarQube-Style ${language.charAt(0).toUpperCase() + language.slice(1)} Analysis\n\n`;
  
  // Add SonarQube-style issue section
  suggestions += "## Quality Issues\n\n";
  
  // Group issues by type (Bugs vs Code Smells) - SonarQube categorization
  const bugs = issues.filter(i => i.category === 'runtime' || i.category === 'exception');
  const codeSmells = issues.filter(i => i.category === 'structure' || i.category === 'readability');
  
  if (bugs.length > 0) {
    suggestions += "### Bugs\n\n";
    bugs.forEach(bug => {
      suggestions += `- ${bug.description}${bug.line ? ` (line ${bug.line})` : ''}\n`;
    });
    suggestions += "\n";
  }
  
  if (codeSmells.length > 0) {
    suggestions += "### Code Smells\n\n";
    codeSmells.forEach(smell => {
      suggestions += `- ${smell.description}${smell.line ? ` (line ${smell.line})` : ''}\n`;
    });
    suggestions += "\n";
  }
  
  // Add maintainability metrics in SonarQube style
  suggestions += "## Maintainability Metrics\n\n";
  suggestions += `- Functions: ${metrics.functionCount}\n`;
  suggestions += `- Average function size: ${Math.round(metrics.averageFunctionLength)} lines\n`;
  suggestions += `- Maximum nesting depth: ${metrics.maxNestingDepth}\n`;
  suggestions += `- Comment density: ${Math.round(metrics.commentPercentage)}%\n\n`;
  
  // Add recommendations based on metrics
  suggestions += "## Recommendations\n\n";
  
  if (metrics.averageFunctionLength > 30) {
    suggestions += "- **Function Size**: Functions are too long. Break down functions exceeding 30 lines.\n";
  }
  
  if (metrics.maxNestingDepth > 3) {
    suggestions += "- **Complexity**: Nesting depth exceeds recommended threshold (3). Use early returns or extract methods.\n";
  }
  
  if (metrics.commentPercentage < 15 && metrics.linesOfCode > 30) {
    suggestions += "- **Documentation**: Add more comments to improve maintainability.\n";
  }
  
  if (metrics.cyclomaticComplexity > 10) {
    suggestions += `- **Cognitive Complexity**: Complexity score (${metrics.cyclomaticComplexity}) is too high. Simplify logic.\n`;
  }
  
  return suggestions;
}

// Function to compute an overall grade with weighted reliability
function computeOverallGrade(complexity: 'A' | 'B' | 'C' | 'D', maintainability: 'A' | 'B' | 'C' | 'D', reliability: 'A' | 'B' | 'C' | 'D'): 'A' | 'B' | 'C' | 'D' {
  // Convert letter grades to numbers (A=4, B=3, C=2, D=1)
  const gradeValues = {
    'A': 4,
    'B': 3,
    'C': 2,
    'D': 1
  };
  
  // Calculate average grade value with reliability weighted more heavily (SonarQube-style emphasis on bugs)
  const complexityValue = gradeValues[complexity];
  const maintainabilityValue = gradeValues[maintainability];
  const reliabilityValue = gradeValues[reliability];
  
  // Weight reliability more (bugs are critical in SonarQube)
  const weightedAverage = (complexityValue + maintainabilityValue + (reliabilityValue * 2)) / 4;
  
  // Convert back to letter grade
  if (weightedAverage >= 3.5) return 'A';
  if (weightedAverage >= 2.5) return 'B';
  if (weightedAverage >= 1.5) return 'C';
  return 'D';
}
