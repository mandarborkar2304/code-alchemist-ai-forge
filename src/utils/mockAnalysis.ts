import { CodeAnalysis, ReliabilityIssue } from "@/types";
import { 
  calculateCyclomaticComplexity,
  calculateMaintainability,
  calculateReliability,
  getCodeMetrics,
  scoreToGrade
} from "./codeMetrics";
import { getRatingFromScore } from "./quality";
import { 
  analyzeCodeForIssues, 
  generateTestCasesFromCode, 
  categorizeViolations
} from "./codeAnalysis";

export const generateMockAnalysis = (code: string, language: string): CodeAnalysis => {
  // Calculate metrics using enhanced SonarQube-aligned algorithms
  const cyclomaticComplexityScore = calculateCyclomaticComplexity(code, language);
  const maintainabilityScore = calculateMaintainability(code, language);
  const reliabilityResult = calculateReliability(code, language);
  
  // Get the ratings for each metric using SonarQube-aligned thresholds
  const cyclomaticComplexityRating = getRatingFromScore(cyclomaticComplexityScore, 'cyclomaticComplexity');
  const maintainabilityRating = getRatingFromScore(maintainabilityScore, 'maintainability');
  const reliabilityRating = getRatingFromScore(reliabilityResult.score, 'reliability');
  
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
  
  // Enhanced categorization using SonarQube terminology
  const violations = categorizeViolations(issuesList, lineReferences);
  violations.lineReferences = lineReferences;
  
  // Get code metrics with enhanced detail
  const metrics = getCodeMetrics(code, language);
  
  // Generate test cases with SonarQube-style methodology
  const testCases = generateTestCasesFromCode(code, language);
  
  // Compute overall code quality score with weighted reliability (SonarQube style)
  const overallGrade = computeOverallGrade(
    cyclomaticComplexityRating.score, 
    maintainabilityRating.score, 
    reliabilityRating.score,
    reliabilityResult.issues || []
  );
  
  // Generate language-specific AI suggestions with SonarQube terminology
  let aiSuggestions: string;
  
  if (language === 'java') {
    aiSuggestions = generateSonarQubeStyleJavaSuggestions(code, violations, metrics, reliabilityResult.issues);
  } else {
    aiSuggestions = generateSonarQubeStyleSuggestions(code, violations, metrics, language, reliabilityResult.issues);
  }
  
  return {
    cyclomaticComplexity: cyclomaticComplexityRating,
    maintainability: maintainabilityRating,
    reliability: reliabilityRating,
    violations,
    testCases,
    aiSuggestions,
    metrics,
    overallGrade
  };
};

// Generate Java-specific SonarQube-style suggestions
function generateSonarQubeStyleJavaSuggestions(code: string, violations: any, metrics: any, issues: ReliabilityIssue[]): string {
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
  
  // Add SonarQube-style issue section using enhanced categorization
  suggestions += "## Quality Issues\n\n";
  
  // Group issues by type with exact SonarQube terminology
  const bugs = issues.filter(i => i.category === 'runtime' || i.category === 'exception');
  const codeSmells = issues.filter(i => i.category === 'structure' || i.category === 'readability');
  const vulnerabilities = issues.filter(i => i.description.toLowerCase().includes('security') || 
                                           i.description.toLowerCase().includes('injection'));
  
  // Add SonarQube-style severity indicators
  if (bugs.length > 0) {
    suggestions += "### Bugs\n\n";
    const criticalBugs = bugs.filter(i => i.type === 'critical');
    const majorBugs = bugs.filter(i => i.type === 'major');
    const minorBugs = bugs.filter(i => i.type === 'minor');
    
    if (criticalBugs.length > 0) {
      suggestions += "#### Blocker Issues\n\n";
      criticalBugs.forEach(bug => {
        suggestions += `- ${bug.description}${bug.line ? ` (line ${bug.line})` : ''} - **Impact: ${bug.impact} points**\n`;
      });
      suggestions += "\n";
    }
    
    if (majorBugs.length > 0) {
      suggestions += "#### Major Issues\n\n";
      majorBugs.forEach(bug => {
        suggestions += `- ${bug.description}${bug.line ? ` (line ${bug.line})` : ''}\n`;
      });
      suggestions += "\n";
    }
    
    if (minorBugs.length > 0) {
      suggestions += "#### Minor Issues\n\n";
      minorBugs.forEach(bug => {
        suggestions += `- ${bug.description}${bug.line ? ` (line ${bug.line})` : ''}\n`;
      });
      suggestions += "\n";
    }
  }
  
  if (vulnerabilities.length > 0) {
    suggestions += "### Vulnerabilities\n\n";
    vulnerabilities.forEach(vuln => {
      suggestions += `- ${vuln.description}${vuln.line ? ` (line ${vuln.line})` : ''}\n`;
    });
    suggestions += "\n";
  }
  
  if (codeSmells.length > 0) {
    suggestions += "### Code Smells\n\n";
    
    // Group code smells by category for better organization
    const structureSmells = codeSmells.filter(i => i.category === 'structure');
    const readabilitySmells = codeSmells.filter(i => i.category === 'readability');
    
    if (structureSmells.length > 0) {
      suggestions += "#### Structure Issues\n\n";
      structureSmells.forEach(smell => {
        suggestions += `- ${smell.description}${smell.line ? ` (line ${smell.line})` : ''}\n`;
      });
      suggestions += "\n";
    }
    
    if (readabilitySmells.length > 0) {
      suggestions += "#### Maintainability Issues\n\n";
      readabilitySmells.forEach(smell => {
        suggestions += `- ${smell.description}${smell.line ? ` (line ${smell.line})` : ''}\n`;
      });
      suggestions += "\n";
    }
  }
  
  // Add maintainability issues with SonarQube-style metrics
  if (metrics.averageFunctionLength > 30 && !isCompetitiveProgramming) {
    suggestions += "### Maintainability Metrics\n\n";
    suggestions += `- Method length: Average of ${Math.round(metrics.averageFunctionLength)} lines exceeds recommended length of 30 lines\n`;
    suggestions += "- Consider extracting complex logic into smaller, focused helper methods\n\n";
  }
  
  // Add complexity issues with SonarQube-style metrics
  if (metrics.cyclomaticComplexity > 0) {
    suggestions += "### Complexity Metrics\n\n";
    suggestions += `- Cyclomatic Complexity: ${metrics.cyclomaticComplexity}\n`;
    suggestions += `- Max Nesting Depth: ${metrics.maxNestingDepth}\n`;
    
    if (metrics.cyclomaticComplexity > 10) {
      suggestions += "- **Action Required**: Consider refactoring complex methods into smaller units with clear responsibilities\n";
    }
    
    suggestions += "\n";
  }
  
  // Add documentation insights with SonarQube-style recommendations
  if (metrics.commentPercentage < 15 && !isCompetitiveProgramming && metrics.linesOfCode > 30) {
    suggestions += "### Documentation Issues\n\n";
    suggestions += `- Comment Density: ${Math.round(metrics.commentPercentage)}% (SonarQube recommends >20%)\n`;
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
function generateSonarQubeStyleSuggestions(
  code: string, 
  violations: any, 
  metrics: any, 
  language: string, 
  issues: ReliabilityIssue[]
): string {
  let suggestions = `# SonarQube-Style ${language.charAt(0).toUpperCase() + language.slice(1)} Analysis\n\n`;
  
  // Add file metrics summary in SonarQube style
  suggestions += "## File Metrics\n\n";
  suggestions += `- Lines of Code: ${metrics.linesOfCode}\n`;
  suggestions += `- Functions: ${metrics.functionCount}\n`;
  suggestions += `- Cyclomatic Complexity: ${metrics.cyclomaticComplexity}\n`;
  suggestions += `- Comment Density: ${Math.round(metrics.commentPercentage)}%\n\n`;
  
  // Add badges for each quality dimension (SonarQube style)
  suggestions += "## Quality Ratings\n\n";
  suggestions += "| Dimension | Grade | Description |\n";
  suggestions += "|-----------|-------|-------------|\n";
  
  // Calculate grades based on issues
  const reliabilityGrade = getRatingFromScore(calculateReliability(code, language).score, 'reliability').score;
  const maintainabilityGrade = getRatingFromScore(calculateMaintainability(code, language), 'maintainability').score;
  const complexityGrade = getRatingFromScore(calculateCyclomaticComplexity(code, language), 'cyclomaticComplexity').score;
  
  suggestions += `| Reliability | ${reliabilityGrade} | ${getGradeDescription('reliability', reliabilityGrade)} |\n`;
  suggestions += `| Maintainability | ${maintainabilityGrade} | ${getGradeDescription('maintainability', maintainabilityGrade)} |\n`;
  suggestions += `| Complexity | ${complexityGrade} | ${getGradeDescription('complexity', complexityGrade)} |\n\n`;
  
  // Add SonarQube-style issue section
  suggestions += "## Quality Issues\n\n";
  
  // Group issues by type with SonarQube terminology
  const bugs = issues.filter(i => i.category === 'runtime' || i.category === 'exception');
  const codeSmells = issues.filter(i => i.category === 'structure' || i.category === 'readability');
  
  if (bugs.length > 0) {
    suggestions += "### Bugs\n\n";
    bugs.forEach(bug => {
      const severityLabel = bug.type === 'critical' ? '🚫 Blocker' : 
                         bug.type === 'major' ? '⚠️ Major' : '📝 Minor';
      suggestions += `- **${severityLabel}**: ${bug.description}${bug.line ? ` (line ${bug.line})` : ''}\n`;
    });
    suggestions += "\n";
  }
  
  if (codeSmells.length > 0) {
    suggestions += "### Code Smells\n\n";
    codeSmells.forEach(smell => {
      const severityLabel = smell.type === 'major' ? '⚠️ Major' : '📝 Minor';
      suggestions += `- **${severityLabel}**: ${smell.description}${smell.line ? ` (line ${smell.line})` : ''}\n`;
    });
    suggestions += "\n";
  }
  
  // Add maintainability metrics in SonarQube style
  suggestions += "## Maintainability Metrics\n\n";
  suggestions += `- Functions: ${metrics.functionCount}\n`;
  suggestions += `- Average function size: ${Math.round(metrics.averageFunctionLength)} lines\n`;
  suggestions += `- Maximum nesting depth: ${metrics.maxNestingDepth}\n`;
  suggestions += `- Comment density: ${Math.round(metrics.commentPercentage)}%\n\n`;
  
  // Add actionable recommendations based on metrics (SonarQube style)
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

// Helper function for grade descriptions
function getGradeDescription(metric: string, grade: 'A' | 'B' | 'C' | 'D'): string {
  const descriptions = {
    reliability: {
      A: 'Highly reliable',
      B: 'Good reliability',
      C: 'Moderate reliability issues',
      D: 'Major reliability concerns'
    },
    maintainability: {
      A: 'Highly maintainable',
      B: 'Good maintainability',
      C: 'Moderately maintainable',
      D: 'Hard to maintain'
    },
    complexity: {
      A: 'Low complexity',
      B: 'Moderate complexity',
      C: 'High complexity',
      D: 'Very high complexity'
    }
  };
  
  return descriptions[metric as keyof typeof descriptions][grade];
}

// Function to compute an overall grade with enhanced SonarQube-aligned weighting
function computeOverallGrade(
  complexity: 'A' | 'B' | 'C' | 'D', 
  maintainability: 'A' | 'B' | 'C' | 'D', 
  reliability: 'A' | 'B' | 'C' | 'D',
  issues: ReliabilityIssue[]
): 'A' | 'B' | 'C' | 'D' {
  // Convert letter grades to numbers (A=4, B=3, C=2, D=1)
  const gradeValues = {
    'A': 4,
    'B': 3,
    'C': 2,
    'D': 1
  };
  
  // Count critical issues for potential overrides
  const criticalIssues = issues.filter(i => i.type === 'critical').length;
  
  // Calculate average grade value with SonarQube-style weighting:
  // - Reliability is weighted more heavily (40%)
  // - Maintainability is weighted at 35%
  // - Complexity is weighted at 25%
  const complexityValue = gradeValues[complexity];
  const maintainabilityValue = gradeValues[maintainability];
  const reliabilityValue = gradeValues[reliability];
  
  // Calculate weighted average
  const weightedAverage = (
    (complexityValue * 0.25) + 
    (maintainabilityValue * 0.35) + 
    (reliabilityValue * 0.40)
  );
  
  // Apply SonarQube-style override rules: critical issues override the final grade
  if (criticalIssues >= 3) {
    return 'D'; // Multiple critical issues always result in D grade
  } else if (criticalIssues > 0 && weightedAverage >= 3.5) {
    return 'B'; // Critical issues cap the grade at B
  }
  
  // Convert weighted average back to letter grade
  if (weightedAverage >= 3.5) return 'A';
  if (weightedAverage >= 2.5) return 'B';
  if (weightedAverage >= 1.5) return 'C';
  return 'D';
}
