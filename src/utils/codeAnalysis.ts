import { CodeViolations } from '@/types';
import { TestCase } from '@/types';

// Quality Rules Configuration
const rules = {
  cyclomaticComplexity: {
    warnThreshold: 10,
    failThreshold: 15,
  },
  functionLength: {
    warnThreshold: 25,
    failThreshold: 40,
  },
  nestingDepth: {
    warnThreshold: 4,
    failThreshold: 6,
  },
  commentDensity: {
    warnThresholdPercent: 10,
    failThresholdPercent: 5,
  },
  codeDuplication: {
    warnThresholdPercent: 20,
    failThresholdPercent: 30,
  },
  noGlobalVariables: {
    enabled: true,
  },
  customSmells: [
    {
      id: "no-console-log",
      pattern: "console\\.log",
      message: "Avoid console.log in production code",
    },
    {
      id: "no-todo-fixme",
      pattern: "\\/\\/\\s*(TODO|FIXME)",
      message: "Remove TODO/FIXME comments before commit",
    },
  ] as Array<{ id: string; pattern: string; message: string }>,
};

// Analyze code for issues with line references
export const analyzeCodeForIssues = (code: string): { details: string[], lineReferences: { line: number, issue: string }[] } => {
  const issues: string[] = [];
  const lineReferences: { line: number, issue: string }[] = [];
  const lines = code.split('\n');

  const hasControlFlow = code.includes('if') || code.includes('for') || code.includes('while');
  if (!hasControlFlow && lines.length < 15) {
    return { details: [], lineReferences: [] };
  }

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
        if (currentFunction > rules.functionLength.warnThreshold) {
          issues.push(`Function length exceeds ${rules.functionLength.warnThreshold} lines (${currentFunction} lines) - consider breaking down into smaller functions`);
          lineReferences.push({ line: functionStartLine, issue: `Long function (${currentFunction} lines)` });
        }
      }
    }
  }

  let maxNesting = 0;
  let currentNesting = 0;
  let nestingStartLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openBraces = (line.match(/{/g) || []).length;
    const closedBraces = (line.match(/}/g) || []).length;

    for (let j = 0; j < openBraces; j++) {
      currentNesting++;
      if (currentNesting > rules.nestingDepth.warnThreshold) {
        nestingStartLines.push(i + 1);
      }
    }

    maxNesting = Math.max(maxNesting, currentNesting);

    for (let j = 0; j < closedBraces; j++) {
      currentNesting--;
    }
  }

  if (maxNesting > rules.nestingDepth.failThreshold) {
    issues.push(`Nesting level exceeds ${rules.nestingDepth.failThreshold} (max: ${maxNesting}) - consider restructuring to reduce complexity`);
    nestingStartLines.forEach(line => {
      lineReferences.push({ line, issue: "Deep nesting" });
    });
  }

  if (hasControlFlow && !code.includes('try') && !code.includes('catch') && code.length > 100) {
    issues.push("No error handling mechanisms (try-catch) detected in complex code");
  }

  if (lines.length > 20) {
    const commentLines = lines.filter(line =>
      line.trim().startsWith('//') ||
      line.trim().startsWith('/*') ||
      line.trim().startsWith('*')
    ).length;

    const commentRatio = commentLines / lines.length;
    if (commentRatio < rules.commentDensity.failThresholdPercent / 100) {
      issues.push(`Low comment-to-code ratio (${(commentRatio * 100).toFixed(1)}% < ${rules.commentDensity.failThresholdPercent}%) - consider adding more documentation`);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const shortVarMatch = line.match(/\b(var|let|const)\s+([a-zA-Z]{1})\b/);
    if (shortVarMatch) {
      const varName = shortVarMatch[2];
      issues.push(`Single-letter variable name "${varName}" detected - use descriptive naming for better readability`);
      lineReferences.push({ line: i + 1, issue: `Short variable name "${varName}"` });
    }
  }

  if (lines.length > 10) {
    let hasMagicNumbers = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const magicNumberMatch = line.match(/[^a-zA-Z0-9_]([3-9]|[1-9][0-9]+)[^a-zA-Z0-9_]/g);
      if (magicNumberMatch && !line.includes('//')) {
        lineReferences.push({ line: i + 1, issue: "Magic number" });
        hasMagicNumbers = true;
      }
    }

    if (hasMagicNumbers) {
      issues.push("Magic numbers detected - consider using named constants");
    }
  }

  rules.customSmells.forEach((smell) => {
    const regex = new RegExp(smell.pattern, "g");
    lines.forEach((line, idx) => {
      if (regex.test(line)) {
        issues.push(smell.message);
        lineReferences.push({ line: idx + 1, issue: smell.id });
      }
    });
  });

  return { details: issues, lineReferences };
};

// Categorize violations with major, and minor
export const categorizeViolations = (issuesList: string[]): CodeViolations => {
  const majorIssues = issuesList.filter(issue =>
      issue.includes("Function length exceeds 25") ||
      issue.includes("Nesting level exceeds") ||
      issue.includes("No error handling")
  );

  const minorIssues = issuesList.filter(issue =>
    !majorIssues.includes(issue)
  );

  return {
    major: majorIssues.length,
    minor: minorIssues.length,
    details: [
      ...majorIssues.map(issue => `Major: ${issue}`),
      ...minorIssues.map(issue => `Minor: ${issue}`),
    ],
  };
};

// Generate test cases from code (this function was missing and causing the error)
export const generateTestCasesFromCode = (code: string, language: string): TestCase[] => {
  // Simple test case detection based on function signatures
  const testCases: TestCase[] = [];
  
  // Check if code is empty or too short for meaningful test cases
  if (!code || code.length < 20) {
    return [];
  }
  
  const lines = code.split('\n');
  
  // Different parsing strategies based on language
  if (language === 'javascript' || language === 'typescript' || language === 'nodejs') {
    // Look for function declarations
    const functionMatches = code.match(/function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\(([^)]*)\)/g) || [];
    const arrowFunctionMatches = code.match(/const\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*(\([^)]*\)|[a-zA-Z_$][0-9a-zA-Z_$]*)\s*=>/g) || [];
    
    // Generate test case for each function found
    functionMatches.forEach((match, index) => {
      const functionName = match.replace(/function\s+/, '').split('(')[0];
      
      testCases.push({
        name: `Test ${functionName}`,
        description: `Test case for ${functionName} function`,
        input: `${functionName}(value)`,
        expectedOutput: "Expected result",
        passed: Math.random() > 0.3, // Randomly pass/fail for demo
        actualOutput: "Actual result",
      });
    });
    
    if (testCases.length === 0 && code.length > 100) {
      // Add a generic test case for JS/TS code
      testCases.push({
        name: "General test",
        description: "General code execution test",
        input: "Input parameters",
        expectedOutput: "Expected output",
        passed: true,
        actualOutput: "Output matches expected result",
      });
    }
  } else if (language === 'python' || language === 'python3') {
    // Look for Python function definitions
    const functionMatches = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\):/g) || [];
    
    functionMatches.forEach((match, index) => {
      const functionName = match.replace(/def\s+/, '').split('(')[0];
      
      testCases.push({
        name: `Test ${functionName}`,
        description: `Test case for ${functionName} function`,
        input: `${functionName}(args)`,
        expectedOutput: "Expected result",
        passed: Math.random() > 0.3,
        actualOutput: "Actual result",
      });
    });
    
    if (testCases.length === 0 && code.length > 100) {
      // Add a generic test case for Python code
      testCases.push({
        name: "General test",
        description: "General code execution test",
        input: "Input parameters",
        expectedOutput: "Expected output",
        passed: true,
        actualOutput: "Output matches expected result",
      });
    }
  } else {
    // Generic test cases for other languages
    if (code.length > 50) {
      testCases.push({
        name: "Test 1",
        description: "Basic functionality test",
        input: "Sample input",
        expectedOutput: "Expected output",
        passed: true,
        actualOutput: "Expected output",
      });
      
      testCases.push({
        name: "Test 2",
        description: "Edge case test",
        input: "Edge case input",
        expectedOutput: "Expected edge case output",
        passed: Math.random() > 0.5,
        actualOutput: Math.random() > 0.5 ? "Expected edge case output" : "Unexpected output",
        executionDetails: "Additional execution details when needed"
      });
    }
  }
  
  return testCases;
};
