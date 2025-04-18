
import { CodeAnalysis, CodeQualityRating, TestCase } from "@/types";

const getRating = (value: number): CodeQualityRating => {
  if (value >= 90) {
    return { score: 'A', description: 'Good', reason: 'Well-structured with minimal complexity' };
  } else if (value >= 70) {
    return { score: 'B', description: 'Medium', reason: 'Moderate complexity with some improvement areas' };
  } else if (value >= 50) {
    return { score: 'C', description: 'High', reason: 'Complex code with several issues that need addressing' };
  } else {
    return { score: 'D', description: 'Extreme', reason: 'Highly complex code with critical issues requiring immediate attention' };
  }
};

// Function to extract patterns and generate appropriate test cases
const generateTestCasesFromCode = (code: string, language: string): TestCase[] => {
  const testCases: TestCase[] = [];
  
  // Function detection
  const hasFunctions = code.includes('function') || code.includes('=>');
  
  // Input validation detection
  const hasInputValidation = code.includes('if') && 
    (code.includes('undefined') || code.includes('null') || code.includes('typeof') || 
     code.includes('length') || code.includes('isEmpty'));
  
  // Error handling detection
  const hasErrorHandling = code.includes('try') && code.includes('catch');
  
  // Loop detection
  const hasLoops = code.includes('for') || code.includes('while') || code.includes('forEach') || 
                   code.includes('map') || code.includes('reduce');
  
  // Recursion detection
  const hasRecursion = /function\s+(\w+)[\s\S]*\1\s*\(/.test(code);
  
  // Check for common function patterns
  if (hasFunctions) {
    if (code.includes('sum') || code.includes('add') || code.includes('+')) {
      testCases.push({
        input: "sum(5, 3)",
        expectedOutput: "8",
        actualOutput: "Function returns 8 as expected",
        passed: true,
      });
      testCases.push({
        input: "sum(-5, 5)",
        expectedOutput: "0",
        actualOutput: "Function handles negative numbers correctly",
        passed: true,
      });
    }
    
    if (code.includes('filter') || code.includes('search') || code.includes('find')) {
      testCases.push({
        input: "filter([1,2,3,4,5], x => x > 3)",
        expectedOutput: "[4,5]",
        actualOutput: "Function filters array correctly",
        passed: true,
      });
      testCases.push({
        input: "filter([], x => x > 0)",
        expectedOutput: "[]",
        actualOutput: "Function handles empty arrays correctly",
        passed: hasInputValidation,
      });
    }
  }
  
  // Add test cases for error handling
  if (hasErrorHandling) {
    testCases.push({
      input: "process(null)",
      expectedOutput: "Error: Invalid input",
      actualOutput: "Function properly handles null input",
      passed: true,
    });
  } else {
    testCases.push({
      input: "process(null)",
      expectedOutput: "Error: Invalid input",
      actualOutput: "No error handling for null input",
      passed: false,
    });
  }
  
  // Add test cases for input validation
  if (hasInputValidation) {
    testCases.push({
      input: "Empty input",
      expectedOutput: "Appropriate error message",
      actualOutput: "Function validates input properly",
      passed: true,
    });
  } else {
    testCases.push({
      input: "Empty input",
      expectedOutput: "Appropriate error message",
      actualOutput: "No input validation found",
      passed: false,
    });
  }
  
  // If we couldn't generate specific test cases, add general ones
  if (testCases.length < 3) {
    testCases.push({
      input: "General functionality test",
      expectedOutput: "Expected behavior",
      actualOutput: hasFunctions ? "Function executes as expected" : "No clear function structure detected",
      passed: hasFunctions,
    });
    
    if (testCases.length < 3) {
      testCases.push({
        input: "Edge case: Boundary values",
        expectedOutput: "Handles edge cases properly",
        actualOutput: hasInputValidation ? "Edge cases are handled" : "No edge case handling detected",
        passed: hasInputValidation,
      });
    }
  }
  
  return testCases;
};

// Function to analyze code and extract issues
const analyzeCodeForIssues = (code: string): string[] => {
  const issues: string[] = [];
  
  // Check for long functions (simplistic approach)
  const lines = code.split('\n');
  let longestFunction = 0;
  let currentFunction = 0;
  let inFunction = false;
  
  for (const line of lines) {
    if (line.includes('function') || line.includes('=>')) {
      inFunction = true;
      currentFunction = 0;
    }
    
    if (inFunction) {
      currentFunction++;
      if (line.includes('}') && line.trim() === '}') {
        inFunction = false;
        longestFunction = Math.max(longestFunction, currentFunction);
      }
    }
  }
  
  if (longestFunction > 20) {
    issues.push("Function length exceeds 20 lines - consider breaking down into smaller functions");
  }
  
  // Check for nested conditions
  let maxNesting = 0;
  let currentNesting = 0;
  
  for (const line of lines) {
    const openBraces = (line.match(/{/g) || []).length;
    const closedBraces = (line.match(/}/g) || []).length;
    
    currentNesting += openBraces - closedBraces;
    maxNesting = Math.max(maxNesting, currentNesting);
  }
  
  if (maxNesting > 3) {
    issues.push("Nesting level exceeds 3 - consider restructuring to reduce complexity");
  }
  
  // Check for missing error handling
  if (!code.includes('try') || !code.includes('catch')) {
    issues.push("No error handling mechanisms (try-catch) detected");
  }
  
  // Check for documentation
  const commentLines = lines.filter(line => line.trim().startsWith('//') || 
                                          line.trim().startsWith('/*') || 
                                          line.trim().startsWith('*')).length;
  const commentRatio = commentLines / lines.length;
  
  if (commentRatio < 0.1) {
    issues.push("Low comment-to-code ratio (< 10%) - consider adding more documentation");
  }
  
  // Check for variable naming
  const shortVarMatches = code.match(/\bvar\s+[a-z]{1,2}\b|\blet\s+[a-z]{1,2}\b|\bconst\s+[a-z]{1,2}\b/g);
  if (shortVarMatches && shortVarMatches.length > 0) {
    issues.push("Short variable names detected - use descriptive naming for better readability");
  }
  
  return issues;
};

export const generateMockAnalysis = (code: string, language: string): CodeAnalysis => {
  // Apply ML-based analysis (simulated)
  
  // Calculate code metrics based on actual code patterns
  const lines = code.split('\n').filter(line => line.trim() !== '');
  const linesOfCode = lines.length;
  
  // Calculate basic complexity
  const conditionals = (code.match(/if|else|switch|case|&&|\|\|/g) || []).length;
  const loops = (code.match(/for|while|do|forEach|map|reduce|filter/g) || []).length;
  const functions = (code.match(/function|\=\>/g) || []).length;
  
  // Simulated metrics based on actual code patterns
  const baseComplexity = Math.min(100, Math.max(10, conditionals * 5 + loops * 3 + functions * 2));
  
  // Analyze the code structure
  const hasErrorHandling = code.includes('try') && code.includes('catch');
  const hasInputValidation = code.includes('if') && 
    (code.includes('undefined') || code.includes('null') || code.includes('typeof'));
  const hasDocumentation = code.includes('//') || code.includes('/*');
  
  // Calculate more detailed metrics
  let complexityScore = baseComplexity;
  if (hasErrorHandling) complexityScore += 10;
  if (hasInputValidation) complexityScore += 10;
  if (hasDocumentation) complexityScore += 10;
  
  // Cap at 100
  complexityScore = Math.min(100, complexityScore);
  
  // Maintainability is inversely related to complexity
  const maintainabilityScore = Math.min(100, Math.max(10, 110 - complexityScore));
  
  // Reliability is related to error handling and input validation
  let reliabilityScore = 50;
  if (hasErrorHandling) reliabilityScore += 25;
  if (hasInputValidation) reliabilityScore += 25;
  
  // Generate test cases based on actual code
  const testCases = generateTestCasesFromCode(code, language);
  
  // Analyze for violations
  const issues = analyzeCodeForIssues(code);
  
  // Determine major vs minor issues
  const majorIssues = issues.filter(issue => 
    issue.includes("exceeds") || 
    issue.includes("No error handling") || 
    issue.includes("critical")
  );
  
  const minorIssues = issues.filter(issue => !majorIssues.includes(issue));
  
  // Generate detailed violations report
  const violations = {
    major: majorIssues.length,
    minor: minorIssues.length,
    details: [...majorIssues.map(issue => `Major: ${issue}`), ...minorIssues.map(issue => `Minor: ${issue}`)]
  };

  // Generate AI feedback specifically tailored to the code
  const aiSuggestions = `# Code Analysis Feedback

## Cyclomatic Complexity (${complexityScore}/100)
${getRating(complexityScore).reason}
${complexityScore < 70 ? "- High number of conditional statements and loops detected" : "- Good structure with manageable decision paths"}
${conditionals > 5 ? "- Consider refactoring complex conditionals into separate functions" : "- Logical conditions are well-structured"}
${loops > 3 ? "- Multiple nested loops increase complexity" : "- Loop structures are well-managed"}

## Maintainability (${maintainabilityScore}/100)
${getRating(maintainabilityScore).reason}
${hasDocumentation ? "- Good documentation practices detected" : "- Limited or missing documentation"}
${linesOfCode > 30 ? "- Function length exceeds recommended size" : "- Functions are concise and focused"}
${(code.match(/\=\>/g) || []).length > 3 ? "- Multiple nested callbacks detected - consider refactoring" : "- Clean callback structure"}

## Reliability (${reliabilityScore}/100)
${getRating(reliabilityScore).reason}
${hasErrorHandling ? "- Error handling mechanisms present" : "- Missing error handling - add try/catch blocks"}
${hasInputValidation ? "- Input validation detected" : "- No input validation found - add validation for all inputs"}
${testCases.filter(tc => tc.passed).length === testCases.length ? "- All test cases pass" : "- Some test cases are failing - review error handling"}

## Code Improvements

${issues.map(issue => `- ${issue}`).join('\n')}

## Code Highlights
${hasErrorHandling ? "- Good use of error handling" : ""}
${hasInputValidation ? "- Proper input validation practices" : ""}
${hasDocumentation ? "- Well-documented code" : ""}
${conditionals <= 5 ? "- Clean conditional logic" : ""}
`;

  return {
    cyclomaticComplexity: {
      ...getRating(complexityScore),
      reason: getRating(complexityScore).reason
    },
    maintainability: {
      ...getRating(maintainabilityScore),
      reason: getRating(maintainabilityScore).reason
    },
    reliability: {
      ...getRating(reliabilityScore),
      reason: getRating(reliabilityScore).reason
    },
    violations,
    testCases,
    aiSuggestions,
    correctedCode: violations.major > 0 
      ? `// Improved solution with better structure
${code.includes('function') ? 
`function processInput(input) {
  // Input validation
  if (input === null || input === undefined) {
    throw new Error('Input is required');
  }
  
  try {
    // Process the input with proper error handling
    const result = validateAndProcess(input);
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return 'Error: ' + error.message;
  }
}

function validateAndProcess(input) {
  // Add specific validation logic
  if (Array.isArray(input)) {
    return input.filter(item => item !== null && item !== undefined);
  } else if (typeof input === 'object') {
    return Object.keys(input).map(key => input[key]);
  } else {
    return String(input);
  }
}` : 
`// Example improved code structure
const processInput = (input) => {
  // Input validation
  if (input === null || input === undefined) {
    throw new Error('Input is required');
  }
  
  try {
    // Process the input with proper error handling
    const result = validateAndProcess(input);
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    return 'Error: ' + error.message;
  }
};

const validateAndProcess = (input) => {
  // Add specific validation logic
  if (Array.isArray(input)) {
    return input.filter(item => item !== null && item !== undefined);
  } else if (typeof input === 'object') {
    return Object.keys(input).map(key => input[key]);
  } else {
    return String(input);
  }
};`}`
      : undefined
  };
};
