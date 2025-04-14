
import { CodeAnalysis } from "@/types";

export const generateMockAnalysis = (code: string, language: string): CodeAnalysis => {
  // This is a mock implementation that would be replaced with actual AI analysis
  const hasErrors = code.length < 50; // Simplified check for demo purposes
  
  // Generate random scores for demonstration
  const getRandomScore = (min = 60, max = 95) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Mock issues based on code length
  const issues = hasErrors 
    ? ["Input/output format does not match requirements", "Missing proper error handling"] 
    : [];
    
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
  
  // Base score modifier on code length (for demo)
  const lengthModifier = Math.min(100, Math.max(40, code.length / 5));
  
  const readability = getRandomScore(hasErrors ? 40 : 65, hasErrors ? 65 : 95);
  const structure = getRandomScore(hasErrors ? 40 : 60, hasErrors ? 70 : 90);
  const naming = getRandomScore(hasErrors ? 50 : 70, hasErrors ? 75 : 95);
  const efficiency = getRandomScore(hasErrors ? 30 : 60, hasErrors ? 70 : 90);
  
  const overall = Math.floor((readability + structure + naming + efficiency) / 4);
  const robustness = getRandomScore(hasErrors ? 30 : 60, hasErrors ? 65 : 95);
  
  const aiSuggestions = hasErrors
    ? "Your code has some issues:\n\n1. The input parsing doesn't handle the first line that indicates the number of elements.\n2. There's no error handling for invalid inputs.\n3. Consider adding comments to explain your logic.\n4. The variable names could be more descriptive."
    : "Your code looks good overall! Some suggestions for improvement:\n\n1. Consider adding more comments to explain complex logic.\n2. You could optimize the time complexity by using a more efficient algorithm.\n3. Add more robust error handling for edge cases.";
  
  // Example corrected code with improvements
  const correctedCode = hasErrors
    ? `// Improved solution with proper input handling
function processArray(input) {
  // Parse input string into lines
  const lines = input.trim().split('\\n');
  // Get number of elements from first line
  const n = parseInt(lines[0], 10);
  // Parse the array from second line
  const arr = lines[1].split(' ').map(Number);
  
  // Validate input
  if (arr.length !== n) {
    throw new Error('Input format error: array length does not match n');
  }
  
  // Calculate the sum
  const sum = arr.reduce((acc, val) => acc + val, 0);
  
  return sum.toString();
}

// Example usage
try {
  const result = processArray(input);
  console.log(result);
} catch (error) {
  console.error('Error:', error.message);
}`
    : undefined;
  
  return {
    feasibility: {
      score: getRandomScore(hasErrors ? 40 : 75, hasErrors ? 70 : 98),
      issues,
    },
    testCases,
    codeQuality: {
      readability,
      structure,
      naming,
      efficiency,
      overall,
    },
    robustness,
    aiSuggestions,
    correctedCode,
  };
};
