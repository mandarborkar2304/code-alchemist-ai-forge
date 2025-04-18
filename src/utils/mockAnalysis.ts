
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
  // This is a mock implementation that would be replaced with actual AI analysis
  const hasErrors = code.length < 50; // Simplified check for demo purposes
  
  // Generate mock ratings based on code characteristics
  const cyclomaticScore = hasErrors ? 45 : 85;
  const maintainabilityScore = hasErrors ? 55 : 75;
  const reliabilityScore = hasErrors ? 40 : 95;
  
  // Create mock test cases
  const testCases = [
    {
      input: "5\n1 2 3 4 5",
      expectedOutput: "15",
      actualOutput: hasErrors ? "Error" : "15",
      passed: !hasErrors,
    },
    {
      input: "3\n10 20 30",
      expectedOutput: "60",
      actualOutput: hasErrors ? "50" : "60",
      passed: !hasErrors,
    },
    {
      input: "0",
      expectedOutput: "0",
      actualOutput: hasErrors ? "Runtime Error" : "0",
      passed: !hasErrors,
    },
  ];

  // Generate mock violations
  const violations = {
    major: hasErrors ? 2 : 0,
    minor: hasErrors ? 3 : 1,
    details: hasErrors 
      ? [
          "Major: Potential null pointer dereference",
          "Major: Memory leak detected",
          "Minor: Variable naming convention violation",
          "Minor: Missing function documentation",
          "Minor: Unused import statement"
        ]
      : [
          "Minor: Consider adding more inline documentation"
        ]
  };

  const aiSuggestions = hasErrors
    ? "Critical issues found:\n\n1. High cyclomatic complexity in main function\n2. Poor maintainability due to lack of modularization\n3. Reliability issues with error handling\n4. Multiple major violations need immediate attention"
    : "Minor improvements suggested:\n\n1. Consider adding more inline documentation\n2. Some functions could be modularized better\n3. Consider implementing more error handling";

  return {
    cyclomaticComplexity: getRating(cyclomaticScore),
    maintainability: getRating(maintainabilityScore),
    reliability: getRating(reliabilityScore),
    violations,
    testCases,
    aiSuggestions,
    correctedCode: hasErrors 
      ? `// Improved solution with better structure and error handling
function processArray(input) {
  try {
    const lines = input.trim().split('\\n');
    const n = parseInt(lines[0], 10);
    const arr = lines[1].split(' ').map(Number);
    
    if (arr.length !== n) {
      throw new Error('Input format error');
    }
    
    return arr.reduce((sum, val) => sum + val, 0).toString();
  } catch (error) {
    console.error('Error:', error.message);
    return 'Error: Invalid input format';
  }
}`
      : undefined
  };
};
