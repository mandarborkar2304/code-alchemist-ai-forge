
import { CodeAnalysis, CodeQualityRating } from "@/types";

const getRating = (value: number): CodeQualityRating => {
  if (value >= 90) {
    return { score: 'A', description: 'Good' };
  } else if (value >= 70) {
    return { score: 'B', description: 'Medium' };
  } else if (value >= 50) {
    return { score: 'C', description: 'High' };
  } else {
    return { score: 'D', description: 'Extreme' };
  }
};

export const generateMockAnalysis = (code: string, language: string): CodeAnalysis => {
  // Analyze code complexity
  const hasErrors = code.length < 50;
  const complexityScore = hasErrors ? 45 : 85;
  const maintainabilityScore = hasErrors ? 55 : 75;
  const reliabilityScore = hasErrors ? 40 : 95;
  
  // Generate context-aware test cases based on code content
  const testCases = [
    {
      input: "function sum(a, b) { return a + b; }",
      expectedOutput: "Returns correct sum",
      actualOutput: code.includes("return") ? "Function returns as expected" : "Missing return statement",
      passed: code.includes("return"),
    },
    {
      input: "Error handling test with invalid input",
      expectedOutput: "Proper error handling",
      actualOutput: code.includes("try") ? "Error handled properly" : "No error handling found",
      passed: code.includes("try"),
    },
    {
      input: "Edge case: Empty input",
      expectedOutput: "Handles empty input gracefully",
      actualOutput: code.includes("if") ? "Input validation present" : "No input validation",
      passed: code.includes("if"),
    },
  ];

  // Generate detailed violations
  const violations = {
    major: hasErrors ? 2 : 0,
    minor: hasErrors ? 3 : 1,
    details: hasErrors 
      ? [
          "Major: Function lacks proper error handling mechanisms",
          "Major: No input validation implemented",
          "Minor: Variable names could be more descriptive",
          "Minor: Missing JSDoc documentation",
          "Minor: Consider breaking down complex logic into smaller functions"
        ]
      : [
          "Minor: Add more comprehensive error handling"
        ]
  };

  // Generate detailed AI feedback based on code analysis
  const generateDetailedFeedback = () => {
    const feedback = [];
    
    // Check for basic code structure
    if (!code.includes("function")) {
      feedback.push("Consider structuring your code into reusable functions");
    }
    
    // Check for error handling
    if (!code.includes("try")) {
      feedback.push("Add error handling using try-catch blocks for robust code");
    }
    
    // Check for documentation
    if (!code.includes("//")) {
      feedback.push("Add comments to explain complex logic and improve maintainability");
    }
    
    return feedback.join("\n\n");
  };

  const aiSuggestions = hasErrors
    ? `Code Analysis Feedback:\n\n` +
      `Cyclomatic Complexity (${complexityScore}):\n` +
      `- High number of decision points detected\n` +
      `- Consider breaking down complex conditionals\n` +
      `- Recommendation: Split into smaller functions\n\n` +
      `Maintainability (${maintainabilityScore}):\n` +
      `- Limited documentation found\n` +
      `- Complex nested structures present\n` +
      `- Recommendation: Add JSDoc comments and simplify nesting\n\n` +
      `Reliability (${reliabilityScore}):\n` +
      `- Missing error handling\n` +
      `- Incomplete input validation\n` +
      `- Recommendation: Implement comprehensive error checks\n\n` +
      generateDetailedFeedback()
    : `Code Analysis Feedback:\n\n` +
      `Cyclomatic Complexity (${complexityScore}):\n` +
      `- Good code structure detected\n` +
      `- Clear decision paths\n` +
      `- Recommendation: Continue maintaining clean code structure\n\n` +
      `Maintainability (${maintainabilityScore}):\n` +
      `- Well-documented code\n` +
      `- Clear function separation\n` +
      `- Recommendation: Consider adding more inline documentation\n\n` +
      `Reliability (${reliabilityScore}):\n` +
      `- Good error handling present\n` +
      `- Proper input validation\n` +
      `- Recommendation: Consider adding more edge case handling\n\n` +
      generateDetailedFeedback();

  return {
    cyclomaticComplexity: getRating(complexityScore),
    maintainability: getRating(maintainabilityScore),
    reliability: getRating(reliabilityScore),
    violations,
    testCases,
    aiSuggestions,
    correctedCode: hasErrors 
      ? `// Improved solution with better structure
function processInput(input: any): string {
  try {
    // Input validation
    if (!input) {
      throw new Error('Input is required');
    }
    
    // Process the input with proper error handling
    const result = validateAndProcess(input);
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return 'Error: Invalid input format';
  }
}

function validateAndProcess(input: any): string {
  // Add your processing logic here
  return String(input);
}`
      : undefined
  };
};
