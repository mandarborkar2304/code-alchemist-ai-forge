
import { CodeAnalysis, CodeQualityRating, TestCase } from "@/types";

// Helper function to extract actual code execution based on language and input
const executeCode = (code: string, input: string, language: string): string => {
  // In a real implementation, this would execute the code in a sandbox
  // For our mock, we'll simulate execution based on code patterns
  
  if (code.includes('function sum') || code.includes('const sum')) {
    if (input.includes('sum(5, 3)')) return '8';
    if (input.includes('sum(-5, 5)')) return '0';
    if (input.includes('sum("5", 3)')) return 'Error: Invalid input types';
  }
  
  if (code.includes('function filter') || code.includes('array.filter')) {
    if (input.includes('filter([1,2,3,4,5]')) return '[4,5]';
    if (input.includes('filter([])')) return '[]';
    if (input.includes('filter(null')) return 'Error: Cannot read properties of null';
  }
  
  if (code.includes('try') && code.includes('catch')) {
    if (input.includes('null') || input.includes('undefined')) {
      return 'Error: Invalid input';
    }
  }
  
  // Default response based on expected patterns
  if (input.includes('sort')) return 'Sorted array';
  if (input.includes('map')) return 'Transformed array';
  if (input.includes('reduce')) return 'Reduced value';
  
  return 'Could not determine exact output - would require actual execution';
};

// More accurate cyclomatic complexity calculation
const calculateCyclomaticComplexity = (code: string): number => {
  const lines = code.split('\n');
  let complexity = 1; // Base complexity is 1
  
  for (const line of lines) {
    // Count decision points: if, else if, case, &&, ||, ternary operators
    if (line.includes('if ') || line.includes('else if')) complexity++;
    if (line.includes('case ') && !line.includes('//')) complexity++;
    if (line.includes('&&') || line.includes('||')) {
      // Count each occurrence
      const andOps = (line.match(/&&/g) || []).length;
      const orOps = (line.match(/\|\|/g) || []).length;
      complexity += andOps + orOps;
    }
    if (line.includes('?') && line.includes(':') && !line.includes('//')) complexity++;
    if (line.includes('for ') || line.includes('while ') || line.includes('do ')) complexity++;
    if (line.includes('catch ')) complexity++;
  }
  
  return complexity;
};

// Calculate maintainability index using simplified Coleman-Richards formula
const calculateMaintainability = (code: string): number => {
  const lines = code.split('\n').filter(line => line.trim() !== '');
  const linesOfCode = lines.length;
  
  // Calculate a proxy for Halstead Volume
  const uniqueOperators = new Set();
  const codeWithoutStrings = code.replace(/".*?"/g, '').replace(/'.*?'/g, '');
  const operators = codeWithoutStrings.match(/[\+\-\*\/\=\<\>\!\&\|\^\~\%]+/g) || [];
  operators.forEach(op => uniqueOperators.add(op));
  
  // Calculate comment percentage
  const commentLines = lines.filter(line => 
    line.trim().startsWith('//') || 
    line.trim().startsWith('/*') || 
    line.trim().startsWith('*')
  ).length;
  
  const commentPercentage = (commentLines / linesOfCode) * 100;
  
  // Calculate function-based metrics
  const functionMatches = code.match(/function\s+\w+|const\s+\w+\s*=\s*\(.*?\)\s*=>|^\s*\w+\s*\(.*?\)\s*{/gm) || [];
  const functionCount = functionMatches.length;
  
  // Calculate nesting level
  let maxNesting = 0;
  let currentNesting = 0;
  for (const line of lines) {
    const openBraces = (line.match(/{/g) || []).length;
    const closedBraces = (line.match(/}/g) || []).length;
    currentNesting += openBraces - closedBraces;
    maxNesting = Math.max(maxNesting, currentNesting);
  }
  
  // Simplified maintainability formula (higher is better)
  // Real MI = 171 - 5.2*ln(V) - 0.23*G - 16.2*ln(LOC) + 50*sin(sqrt(2.4*C))
  // Where V is Halstead Volume, G is Cyclomatic Complexity, LOC is lines of code, C is comment percentage
  const cyclomaticComplexity = calculateCyclomaticComplexity(code);
  let maintainability = 100 - (linesOfCode * 0.1) - (cyclomaticComplexity * 0.2) - (maxNesting * 5) + (commentPercentage * 0.4) + (functionCount > 0 ? 10 : 0);
  
  // Cap between 0 and 100
  maintainability = Math.min(100, Math.max(0, maintainability));
  
  return Math.round(maintainability);
};

// Calculate reliability score based on error handling, input validation, etc.
const calculateReliability = (code: string): number => {
  let reliabilityScore = 60; // Start with a baseline score
  
  // Check for error handling
  if (code.includes('try') && code.includes('catch')) {
    reliabilityScore += 15;
  }
  
  // Check for input validation
  const hasInputValidation = code.includes('if') && 
    (code.includes('undefined') || code.includes('null') || code.includes('typeof') || 
     code.includes('length') || code.includes('isEmpty'));
  
  if (hasInputValidation) {
    reliabilityScore += 15;
  }
  
  // Check for defensive programming patterns
  if (code.includes('default:') || code.includes('else {')) {
    reliabilityScore += 5;
  }
  
  // Penalize for potential issues
  if (code.includes('console.log(') && !code.includes('// Debug:')) {
    reliabilityScore -= 5; // Penalize for excessive logging without comments
  }
  
  if ((code.match(/\/\//g) || []).length < code.split('\n').length * 0.1) {
    reliabilityScore -= 5; // Penalize for lack of comments
  }
  
  // Analyze potential bugs
  const potentialBugs = [
    { pattern: /==/g, issue: "Using loose equality (==) instead of strict equality (===)" },
    { pattern: /\!\=/g, issue: "Using loose inequality (!=) instead of strict inequality (!==)" },
    { pattern: /for\s*\(\s*var/g, issue: "Using 'var' in loop declarations instead of 'let'" },
    { pattern: /\.length\s*\-\s*1/g, issue: "Potential off-by-one error with array indexing" },
  ];
  
  for (const bug of potentialBugs) {
    if ((code.match(bug.pattern) || []).length > 0) {
      reliabilityScore -= 5;
    }
  }
  
  // Cap between 0 and 100
  reliabilityScore = Math.min(100, Math.max(0, reliabilityScore));
  
  return Math.round(reliabilityScore);
};

const getRatingFromScore = (score: number, metricType: 'cyclomaticComplexity' | 'maintainability' | 'reliability'): CodeQualityRating => {
  // Adjust scoring criteria based on metric type
  if (metricType === 'cyclomaticComplexity') {
    // For cyclomatic complexity, lower is better
    if (score <= 10) {
      return { 
        score: 'A', 
        description: 'Low complexity', 
        reason: 'The code has a straightforward control flow with minimal decision points.',
        issues: [],
        improvements: ['Code maintains an excellent level of simplicity']
      };
    } else if (score <= 20) {
      return { 
        score: 'B', 
        description: 'Moderate complexity', 
        reason: 'The code has a reasonable number of decision points.',
        issues: ['Some conditional branches increase complexity'],
        improvements: ['Consider extracting complex conditions into named functions']
      };
    } else if (score <= 30) {
      return { 
        score: 'C', 
        description: 'High complexity', 
        reason: 'Code contains numerous decision points making it difficult to follow.',
        issues: ['Multiple nested conditions', 'Complex logical expressions'],
        improvements: ['Break down complex methods into smaller functions', 'Simplify logical conditions']
      };
    } else {
      return { 
        score: 'D', 
        description: 'Extreme complexity', 
        reason: 'Code has excessive decision points making it highly prone to errors.',
        issues: ['Excessive nesting', 'Too many decision paths', 'Complex conditional logic'],
        improvements: ['Refactor using strategy pattern', 'Break down into multiple files/modules', 'Simplify logic flow']
      };
    }
  } else if (metricType === 'maintainability') {
    // For maintainability, higher is better
    if (score >= 85) {
      return { 
        score: 'A', 
        description: 'Highly maintainable', 
        reason: 'Code is well-structured, modular, and easy to modify.',
        issues: [],
        improvements: ['Code is already highly maintainable']
      };
    } else if (score >= 65) {
      return { 
        score: 'B', 
        description: 'Maintainable', 
        reason: 'Code is reasonably structured but has some areas for improvement.',
        issues: ['Some functions could be more modular'],
        improvements: ['Add more descriptive comments', 'Consider extracting some functionality into helper methods']
      };
    } else if (score >= 40) {
      return { 
        score: 'C', 
        description: 'Difficult to maintain', 
        reason: 'Code has structural issues that make modifications challenging.',
        issues: ['Functions are too long', 'Poor separation of concerns', 'Limited comments'],
        improvements: ['Break down large functions', 'Add comprehensive documentation', 'Improve function naming']
      };
    } else {
      return { 
        score: 'D', 
        description: 'Very difficult to maintain', 
        reason: 'Code structure is problematic and modifications would likely introduce bugs.',
        issues: ['Extremely long functions', 'Unclear variable names', 'No clear organization', 'Duplicated code'],
        improvements: ['Major refactoring needed', 'Restructure into a more modular design', 'Follow single responsibility principle']
      };
    }
  } else { // reliability
    // For reliability, higher is better
    if (score >= 85) {
      return { 
        score: 'A', 
        description: 'Highly reliable', 
        reason: 'Code handles errors properly and validates inputs thoroughly.',
        issues: [],
        improvements: ['Code is already designed with good reliability practices']
      };
    } else if (score >= 65) {
      return { 
        score: 'B', 
        description: 'Reliable with minor issues', 
        reason: 'Code has decent error handling but some edge cases may be missed.',
        issues: ['Some edge cases may not be handled'],
        improvements: ['Add more comprehensive input validation', 'Consider additional error cases']
      };
    } else if (score >= 40) {
      return { 
        score: 'C', 
        description: 'Reliability concerns', 
        reason: 'Code lacks proper error handling in several areas.',
        issues: ['Inadequate error handling', 'Limited input validation', 'Potential runtime exceptions'],
        improvements: ['Implement try-catch blocks', 'Add input validation', 'Handle null/undefined values']
      };
    } else {
      return { 
        score: 'D', 
        description: 'Highly unreliable', 
        reason: 'Code is likely to fail in many scenarios without proper error handling.',
        issues: ['No error handling', 'Missing input validation', 'Potential for frequent crashes'],
        improvements: ['Add comprehensive error handling', 'Implement thorough input validation', 'Add defensive programming techniques']
      };
    }
  }
};

// Function to generate test cases with actual execution outcomes
const generateTestCasesFromCode = (code: string, language: string): TestCase[] => {
  const testCases: TestCase[] = [];
  
  // Common function patterns detection
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
  
  // Check for specific code patterns to generate relevant test cases
  
  // Numerical operations
  if (code.includes('sum') || code.includes('add') || code.includes('+') && !code.includes('++')) {
    const input = "sum(5, 3)";
    const expectedOutput = "8";
    const actualOutput = executeCode(code, input, language);
    testCases.push({
      input,
      expectedOutput,
      actualOutput,
      passed: actualOutput === expectedOutput,
      executionDetails: hasInputValidation ? "Function validates input types" : "No input type validation detected"
    });
    
    const input2 = "sum(-5, 5)";
    const expectedOutput2 = "0";
    const actualOutput2 = executeCode(code, input2, language);
    testCases.push({
      input: input2,
      expectedOutput: expectedOutput2,
      actualOutput: actualOutput2,
      passed: actualOutput2 === expectedOutput2,
      executionDetails: "Testing with negative numbers"
    });
    
    // Edge case: type checking
    const input3 = 'sum("5", 3)';
    const expectedOutput3 = hasInputValidation ? "Error: Invalid input types" : "53";
    const actualOutput3 = executeCode(code, input3, language);
    testCases.push({
      input: input3,
      expectedOutput: expectedOutput3,
      actualOutput: actualOutput3,
      passed: hasInputValidation ? actualOutput3.includes("Error") : actualOutput3 === "53",
      executionDetails: "Testing with mixed types"
    });
  }
  
  // Array operations
  if (code.includes('filter') || code.includes('array.filter') || code.includes('search') || code.includes('find')) {
    const input = "filter([1,2,3,4,5], x => x > 3)";
    const expectedOutput = "[4,5]";
    const actualOutput = executeCode(code, input, language);
    testCases.push({
      input,
      expectedOutput,
      actualOutput,
      passed: actualOutput === expectedOutput || actualOutput.includes(expectedOutput),
      executionDetails: "Testing basic filtering functionality"
    });
    
    const input2 = "filter([], x => x > 0)";
    const expectedOutput2 = "[]";
    const actualOutput2 = executeCode(code, input2, language);
    testCases.push({
      input: input2,
      expectedOutput: expectedOutput2,
      actualOutput: actualOutput2,
      passed: actualOutput2 === expectedOutput2 || actualOutput2.includes(expectedOutput2),
      executionDetails: "Testing with empty array"
    });
    
    // Edge case: null handling
    const input3 = "filter(null, x => x > 0)";
    const expectedOutput3 = hasErrorHandling ? "Error: Cannot read properties of null" : "TypeError";
    const actualOutput3 = executeCode(code, input3, language);
    testCases.push({
      input: input3,
      expectedOutput: expectedOutput3,
      actualOutput: actualOutput3,
      passed: hasErrorHandling && actualOutput3.includes("Error"),
      executionDetails: "Testing null input handling"
    });
  }
  
  // String operations
  if (code.includes('string') || code.includes('substring') || code.includes('split') || code.includes('replace')) {
    const input = 'processString("Hello World")';
    const expectedOutput = code.includes('toUpperCase') ? 'HELLO WORLD' : 'Processed string';
    const actualOutput = executeCode(code, input, language);
    testCases.push({
      input,
      expectedOutput,
      actualOutput,
      passed: true, // Simplified for mock
      executionDetails: "Testing string processing"
    });
    
    // Edge case: empty string
    const input2 = 'processString("")';
    const expectedOutput2 = hasInputValidation ? "Error: Empty string" : "";
    const actualOutput2 = executeCode(code, input2, language);
    testCases.push({
      input: input2,
      expectedOutput: expectedOutput2,
      actualOutput: actualOutput2,
      passed: hasInputValidation ? actualOutput2.includes("Error") : true,
      executionDetails: "Testing with empty string"
    });
  }
  
  // Error handling test cases
  if (hasErrorHandling) {
    const input = "processInput(null)";
    const expectedOutput = "Error: Invalid input";
    const actualOutput = executeCode(code, input, language);
    testCases.push({
      input,
      expectedOutput,
      actualOutput,
      passed: actualOutput.includes("Error"),
      executionDetails: "Testing error handling with null input"
    });
    
    const input2 = "processInput(undefined)";
    const expectedOutput2 = "Error: Invalid input";
    const actualOutput2 = executeCode(code, input2, language);
    testCases.push({
      input: input2,
      expectedOutput: expectedOutput2,
      actualOutput: actualOutput2,
      passed: actualOutput2.includes("Error"),
      executionDetails: "Testing error handling with undefined input"
    });
  } else {
    testCases.push({
      input: "processInput(null)",
      expectedOutput: "Error: Invalid input",
      actualOutput: "No error handling detected - function would likely throw an uncaught exception",
      passed: false,
      executionDetails: "Missing error handling for null input"
    });
  }
  
  // If we still have fewer than 3 test cases, add generic ones based on code patterns
  if (testCases.length < 3) {
    if (hasLoops) {
      testCases.push({
        input: "processArray([1, 2, 3, 4, 5])",
        expectedOutput: "Array processed successfully",
        actualOutput: hasErrorHandling ? "Function processes array with error handling" : "Function processes array without error handling",
        passed: true,
        executionDetails: "Testing array processing with loops"
      });
    }
    
    if (hasRecursion) {
      testCases.push({
        input: "recursiveFunction(5)",
        expectedOutput: "Result from recursive operation",
        actualOutput: "Function uses recursion to process input",
        passed: true,
        executionDetails: "Testing recursive function behavior"
      });
    }
    
    // If we still need more test cases
    if (testCases.length < 3) {
      testCases.push({
        input: "generalFunctionality(validInput)",
        expectedOutput: "Expected behavior",
        actualOutput: hasFunctions ? "Function executes as expected" : "No clear function structure detected",
        passed: hasFunctions,
        executionDetails: "General functionality test"
      });
    }
  }
  
  return testCases;
};

// Function to analyze code for issues with line references
const analyzeCodeForIssues = (code: string): { details: string[], lineReferences: {line: number, issue: string}[] } => {
  const issues: string[] = [];
  const lineReferences: {line: number, issue: string}[] = [];
  const lines = code.split('\n');
  
  // Check for long functions
  let longestFunction = 0;
  let currentFunction = 0;
  let inFunction = false;
  let functionStartLine = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if ((line.includes('function') || line.includes('=>')) && !line.includes('//')) {
      inFunction = true;
      currentFunction = 0;
      functionStartLine = i + 1;
    }
    
    if (inFunction) {
      currentFunction++;
      if (line.includes('}') && line.trim() === '}') {
        inFunction = false;
        if (currentFunction > 20) {
          issues.push(`Function length exceeds 20 lines (${currentFunction} lines) - consider breaking down into smaller functions`);
          lineReferences.push({
            line: functionStartLine,
            issue: `Long function (${currentFunction} lines)`
          });
        }
        longestFunction = Math.max(longestFunction, currentFunction);
      }
    }
  }
  
  // Check for nested conditions
  let maxNesting = 0;
  let currentNesting = 0;
  let nestingStartLines: number[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openBraces = (line.match(/{/g) || []).length;
    const closedBraces = (line.match(/}/g) || []).length;
    
    if (openBraces > 0) {
      for (let j = 0; j < openBraces; j++) {
        currentNesting++;
        if (currentNesting > 2) {
          nestingStartLines.push(i + 1);
        }
      }
    }
    
    maxNesting = Math.max(maxNesting, currentNesting);
    
    if (closedBraces > 0) {
      for (let j = 0; j < closedBraces; j++) {
        currentNesting--;
      }
    }
  }
  
  if (maxNesting > 3) {
    issues.push(`Nesting level exceeds 3 (max: ${maxNesting}) - consider restructuring to reduce complexity`);
    nestingStartLines.forEach(line => {
      lineReferences.push({
        line,
        issue: "Deep nesting"
      });
    });
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
    issues.push(`Low comment-to-code ratio (${(commentRatio * 100).toFixed(1)}% < 10%) - consider adding more documentation`);
  }
  
  // Check for variable naming
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const shortVarMatch = line.match(/\bvar\s+([a-z]{1,2})\b|\blet\s+([a-z]{1,2})\b|\bconst\s+([a-z]{1,2})\b/);
    if (shortVarMatch) {
      const varName = shortVarMatch[1] || shortVarMatch[2] || shortVarMatch[3];
      issues.push(`Short variable name "${varName}" detected - use descriptive naming for better readability`);
      lineReferences.push({
        line: i + 1,
        issue: `Short variable name "${varName}"`
      });
    }
  }
  
  // Check for magic numbers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for numbers in code that aren't 0, 1, or -1 (common acceptable magic numbers)
    const magicNumberMatch = line.match(/[^a-zA-Z0-9_]([2-9]|[1-9][0-9]+)[^a-zA-Z0-9_]/g);
    if (magicNumberMatch && !line.includes('//')) {
      lineReferences.push({
        line: i + 1,
        issue: "Magic number"
      });
      // Only add this issue once
      if (!issues.includes("Magic numbers detected - consider using named constants")) {
        issues.push("Magic numbers detected - consider using named constants");
      }
    }
  }
  
  return { details: issues, lineReferences };
};

export const generateMockAnalysis = (code: string, language: string): CodeAnalysis => {
  // Calculate actual metrics
  const cyclomaticComplexityScore = calculateCyclomaticComplexity(code);
  const maintainabilityScore = calculateMaintainability(code);
  const reliabilityScore = calculateReliability(code);
  
  // Generate test cases based on actual code
  const testCases = generateTestCasesFromCode(code, language);
  
  // Analyze for violations
  const { details: issuesList, lineReferences } = analyzeCodeForIssues(code);
  
  // Determine major vs minor issues
  const majorIssues = issuesList.filter(issue => 
    issue.includes("exceeds") || 
    issue.includes("No error handling") || 
    issue.includes("critical") ||
    issue.includes("exceeds 3")
  );
  
  const minorIssues = issuesList.filter(issue => !majorIssues.includes(issue));
  
  // Generate detailed violations report
  const violations = {
    major: majorIssues.length,
    minor: minorIssues.length,
    details: [...majorIssues.map(issue => `Major: ${issue}`), ...minorIssues.map(issue => `Minor: ${issue}`)],
    lineReferences
  };

  // Extract code patterns for analysis feedback
  const lines = code.split('\n').filter(line => line.trim() !== '');
  const linesOfCode = lines.length;
  const commentLines = lines.filter(line => 
    line.trim().startsWith('//') || 
    line.trim().startsWith('/*') || 
    line.trim().startsWith('*')
  ).length;
  const commentPercentage = (commentLines / linesOfCode) * 100;
  
  // Calculate function-based metrics
  const functionMatches = code.match(/function\s+\w+|const\s+\w+\s*=\s*\(.*?\)\s*=>|^\s*\w+\s*\(.*?\)\s*{/gm) || [];
  const functionCount = functionMatches.length;
  
  // Calculate average function length (simplified)
  let totalFunctionLines = 0;
  let currentFunction = 0;
  let inFunction = false;
  
  for (const line of lines) {
    if ((line.includes('function') || line.includes('=>')) && !line.includes('//')) {
      inFunction = true;
      currentFunction = 0;
    }
    
    if (inFunction) {
      currentFunction++;
      if (line.includes('}') && line.trim() === '}') {
        inFunction = false;
        totalFunctionLines += currentFunction;
      }
    }
  }
  
  const averageFunctionLength = functionCount > 0 ? Math.round(totalFunctionLines / functionCount) : 0;
  
  // Generate detailed AI feedback specific to this code
  const aiSuggestions = `# Code Analysis Feedback

## Cyclomatic Complexity (Score: ${cyclomaticComplexityScore})
${getRatingFromScore(cyclomaticComplexityScore, 'cyclomaticComplexity').reason}

${cyclomaticComplexityScore > 10 ? 
`**Issues Found:**
${getRatingFromScore(cyclomaticComplexityScore, 'cyclomaticComplexity').issues?.map(issue => `- ${issue}`).join('\n') || ''}

**Improvement Recommendations:**
${getRatingFromScore(cyclomaticComplexityScore, 'cyclomaticComplexity').improvements?.map(imp => `- ${imp}`).join('\n') || ''}` : 
'**Excellent work!** Your code has a clean, straightforward flow that is easy to follow and maintain.'}

## Maintainability (Score: ${maintainabilityScore})
${getRatingFromScore(maintainabilityScore, 'maintainability').reason}

${maintainabilityScore < 85 ? 
`**Issues Found:**
${getRatingFromScore(maintainabilityScore, 'maintainability').issues?.map(issue => `- ${issue}`).join('\n') || ''}

**Improvement Recommendations:**
${getRatingFromScore(maintainabilityScore, 'maintainability').improvements?.map(imp => `- ${imp}`).join('\n') || ''}` : 
'**Great job!** Your code is well-structured and modular, making it easy to maintain and extend.'}

## Reliability (Score: ${reliabilityScore})
${getRatingFromScore(reliabilityScore, 'reliability').reason}

${reliabilityScore < 85 ? 
`**Issues Found:**
${getRatingFromScore(reliabilityScore, 'reliability').issues?.map(issue => `- ${issue}`).join('\n') || ''}

**Improvement Recommendations:**
${getRatingFromScore(reliabilityScore, 'reliability').improvements?.map(imp => `- ${imp}`).join('\n') || ''}` : 
'**Well done!** Your code handles errors appropriately and includes proper input validation.'}

## Code Metrics
- **Lines of Code:** ${linesOfCode}
- **Comment Coverage:** ${commentPercentage.toFixed(1)}%
- **Function Count:** ${functionCount}
- **Average Function Length:** ${averageFunctionLength} lines

## Line-Specific Issues
${lineReferences.length > 0 ? 
lineReferences.map(ref => `- Line ${ref.line}: ${ref.issue}`).join('\n') : 
'No specific line issues detected.'}

## Test Results
${testCases.filter(tc => tc.passed).length === testCases.length ? 
'**All tests passing!** Your code is functioning as expected.' : 
`**${testCases.filter(tc => tc.passed).length}/${testCases.length} tests passing.** Review the failing tests to improve code robustness.`}

## Code Highlights
${code.includes('try') && code.includes('catch') ? "- Good use of error handling with try-catch blocks\n" : ""}
${code.includes('if') && (code.includes('undefined') || code.includes('null') || code.includes('typeof')) ? "- Proper input validation detected\n" : ""}
${commentPercentage >= 15 ? "- Well-documented code with good comment coverage\n" : ""}
${cyclomaticComplexityScore <= 10 ? "- Clean control flow with reasonable complexity\n" : ""}
${functionCount > 0 && averageFunctionLength <= 15 ? "- Functions are appropriately sized and focused\n" : ""}
`;

  // Determine if corrected code should be provided
  const needsCorrection = violations.major > 0 || cyclomaticComplexityScore > 20 || maintainabilityScore < 50 || reliabilityScore < 50;
  
  return {
    cyclomaticComplexity: getRatingFromScore(cyclomaticComplexityScore, 'cyclomaticComplexity'),
    maintainability: getRatingFromScore(maintainabilityScore, 'maintainability'),
    reliability: getRatingFromScore(reliabilityScore, 'reliability'),
    violations,
    testCases,
    aiSuggestions,
    metrics: {
      linesOfCode,
      commentPercentage,
      functionCount,
      averageFunctionLength
    },
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

// Helper function to generate corrected code based on issues found
const generateCorrectedCode = (code: string, metrics: { 
  cyclomaticComplexity: number, 
  maintainability: number, 
  reliability: number,
  violations: any
}): string => {
  let correctedCode = code;
  
  // Add input validation if missing
  if (metrics.reliability < 65 && !code.includes('if') && !code.includes('undefined') && !code.includes('null')) {
    if (code.includes('function')) {
      correctedCode = correctedCode.replace(
        /function\s+(\w+)\s*\(([^)]*)\)\s*{/,
        function(match, funcName, params) {
          const paramList = params.split(',').map(p => p.trim());
          const validations = paramList.map(p => `  if (${p} === undefined || ${p} === null) {\n    throw new Error('${p} is required');\n  }`).join('\n');
          return `function ${funcName}(${params}) {\n${validations}\n`;
        }
      );
    } else if (code.includes('=>')) {
      correctedCode = correctedCode.replace(
        /const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/,
        function(match, funcName, params) {
          const paramList = params.split(',').map(p => p.trim());
          const validations = paramList.map(p => `  if (${p} === undefined || ${p} === null) throw new Error('${p} is required');`).join('\n');
          return `const ${funcName} = (${params}) => {\n${validations}\n  return `;
        }
      );
      // Close the arrow function
      if (!correctedCode.includes('return')) {
        correctedCode = correctedCode.replace(/}\s*$/, '  }\n');
      } else if (!correctedCode.includes('return {')) {
        correctedCode = correctedCode + ';\n}';
      }
    }
  }
  
  // Add error handling if missing
  if (metrics.reliability < 65 && !code.includes('try') && !code.includes('catch')) {
    if (code.includes('function')) {
      correctedCode = correctedCode.replace(
        /function\s+(\w+)\s*\(([^)]*)\)\s*{/,
        function(match, funcName, params) {
          return `function ${funcName}(${params}) {\n  try {\n`;
        }
      );
      // Add catch block at the end
      correctedCode = correctedCode.replace(
        /}(\s*)$/,
        '  } catch (error) {\n    console.error(`An error occurred in ${funcName}:`, error);\n    throw error;\n  }\n}$1'
      );
    }
  }
  
  // Improve code format and structure
  if (metrics.maintainability < 65) {
    // Add comments to functions
    correctedCode = correctedCode.replace(
      /function\s+(\w+)\s*\(([^)]*)\)/g,
      function(match, funcName, params) {
        const paramList = params.split(',').map(p => p.trim());
        const paramComments = paramList.length > 0 ? 
          `${paramList.map(p => ` * @param {any} ${p} - Description of ${p}`).join('\n')}\n` : '';
        
        return `/**\n * ${funcName} performs an operation based on the provided parameters\n${paramComments} * @returns {any} - The result of the operation\n */\nfunction ${funcName}(${params})`;
      }
    );
    
    // Convert magic numbers to named constants
    const magicNumberMatches = [...correctedCode.matchAll(/[^a-zA-Z0-9_"](\d+)[^a-zA-Z0-9_"]/g)];
    const uniqueNumbers = new Set();
    magicNumberMatches.forEach(match => {
      const num = match[1];
      if (num !== '0' && num !== '1' && num.length < 5) {
        uniqueNumbers.add(num);
      }
    });
    
    let constDeclarations = '';
    uniqueNumbers.forEach(num => {
      const constName = `CONSTANT_${num}`;
      constDeclarations += `const ${constName} = ${num};\n`;
      const regex = new RegExp(`([^a-zA-Z0-9_"])${num}([^a-zA-Z0-9_"])`, 'g');
      correctedCode = correctedCode.replace(regex, `$1${constName}$2`);
    });
    
    if (constDeclarations) {
      correctedCode = constDeclarations + '\n' + correctedCode;
    }
  }
  
  // Break long functions into smaller ones
  if (metrics.cyclomaticComplexity > 20) {
    // Simplified approach: identify and extract complex conditions
    const complexConditions = [...correctedCode.matchAll(/if\s*\((.*&&.*\|\|.*)\)/g)];
    let extractedFunctions = '';
    
    complexConditions.forEach((match, index) => {
      const condition = match[1];
      const funcName = `isConditionMet${index + 1}`;
      extractedFunctions += `/**\n * Helper function to evaluate a complex condition\n * @returns {boolean} - Whether the condition is met\n */\nfunction ${funcName}() {\n  return ${condition};\n}\n\n`;
      correctedCode = correctedCode.replace(
        `if (${condition})`,
        `if (${funcName}())`
      );
    });
    
    if (extractedFunctions) {
      correctedCode = extractedFunctions + correctedCode;
    }
  }
  
  return correctedCode;
};
