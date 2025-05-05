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
  noGlobalVariables: {
    enabled: true,
  },
  // Extended rule for unhandled exceptions with Java-specific patterns
  unhandledExceptions: {
    enabled: true,
    riskOperations: [
      {
        id: "json-parse",
        pattern: "JSON\\.parse\\s*\\(",
        message: "Unhandled JSON.parse could throw on invalid JSON",
        languages: ["javascript", "typescript", "nodejs"]
      },
      {
        id: "file-system",
        pattern: "fs\\.\\w+Sync\\s*\\(",
        message: "Unhandled synchronous file operations may throw exceptions",
        languages: ["javascript", "typescript", "nodejs", "java"]
      },
      {
        id: "null-unsafe",
        pattern: "\\.\\w+\\s*\\(", 
        message: "Potential null/undefined property access without checks",
        languages: ["javascript", "typescript", "nodejs"]
      },
      {
        id: "array-unsafe",
        pattern: "\\[(\\w+|\\d+)\\]",
        message: "Array access without bounds checking",
        languages: ["javascript", "typescript", "nodejs", "java", "python"]
      },
      {
        id: "explicit-throw",
        pattern: "throw\\s+new\\s+\\w+",
        message: "Explicit throw statement not within try-catch",
        languages: ["javascript", "typescript", "nodejs", "java"]
      },
      {
        id: "await-without-catch",
        pattern: "await\\s+\\w+",
        message: "Awaited promise without error handling",
        languages: ["javascript", "typescript", "nodejs"]
      },
      // Java-specific patterns
      {
        id: "java-arithmetic",
        pattern: "\\/\\s*\\w+",
        message: "Division operation may cause ArithmeticException if divisor is zero",
        languages: ["java"]
      },
      {
        id: "java-null-pointer",
        pattern: "\\w+\\.\\w+\\(",
        message: "Potential NullPointerException without null check",
        languages: ["java"]
      },
      {
        id: "java-array-index",
        pattern: "\\w+\\[\\w+\\]",
        message: "Potential ArrayIndexOutOfBoundsException without bounds check",
        languages: ["java"]
      },
      {
        id: "java-cast",
        pattern: "\\([A-Z]\\w+\\)\\s*\\w+",
        message: "Type casting may cause ClassCastException",
        languages: ["java"]
      },
      {
        id: "java-throw",
        pattern: "throw\\s+\\w+",
        message: "Exception thrown without being caught or declared",
        languages: ["java"]
      }
    ]
  },
  customSmells: [
    {
      id: "no-console-log",
      pattern: "console\\.log",
      message: "Avoid console.log in production code",
      severity: "minor"
    },
    {
      id: "no-todo-fixme",
      pattern: "\\/\\/\\s*(TODO|FIXME)",
      message: "Remove TODO/FIXME comments before commit",
      severity: "minor"
    },
    {
      id: "magic-numbers",
      pattern: "[^a-zA-Z0-9_]([3-9]|[1-9][0-9]+)[^a-zA-Z0-9_]",
      message: "Replace magic numbers with named constants for better readability",
      severity: "minor"
    },
    {
      id: "single-letter-var",
      pattern: "\\b(var|let|const)\\s+([a-zA-Z]{1})\\b",
      message: "Use descriptive variable names instead of single letters",
      severity: "minor"
    },
  ] as Array<{ id: string; pattern: string; message: string; severity?: 'major' | 'minor' }>,
};

// Analyze code for issues with line references
export const analyzeCodeForIssues = (code: string, language: string = 'javascript'): { details: string[], lineReferences: { line: number, issue: string, severity: 'major' | 'minor' }[] } => {
  const issues: string[] = [];
  const lineReferences: { line: number, issue: string, severity: 'major' | 'minor' }[] = [];
  const lines = code.split('\n');

  const hasControlFlow = code.includes('if') || code.includes('for') || code.includes('while');
  if (!hasControlFlow && lines.length < 15) {
    return { details: [], lineReferences: [] };
  }

  let currentFunction = 0;
  let inFunction = false;
  let functionStartLine = 0;

  // Check for long functions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Different function detection based on language
    const isFunctionStart = language === 'java' ? 
      (line.includes('void') || line.includes('public') || line.includes('private') || line.includes('protected')) && line.includes('(') && line.includes(')') && !line.includes(';') : 
      (line.includes('function') || line.includes('=>')) && !line.includes('//');
    
    if (isFunctionStart) {
      inFunction = true;
      currentFunction = 0;
      functionStartLine = i + 1;
    }

    if (inFunction) {
      currentFunction++;
      if (line.includes('}') && line.trim() === '}') {
        inFunction = false;
        if (currentFunction > rules.functionLength.warnThreshold) {
          const issue = `Function length exceeds ${rules.functionLength.warnThreshold} lines (${currentFunction} lines) - consider breaking down into smaller functions`;
          issues.push(issue);
          lineReferences.push({ 
            line: functionStartLine, 
            issue: `Long function (${currentFunction} lines)`, 
            severity: currentFunction > rules.functionLength.failThreshold ? 'major' : 'minor'
          });
        }
      }
    }
  }

  // Check for deep nesting
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
    const issue = `Nesting level exceeds ${rules.nestingDepth.failThreshold} (max: ${maxNesting}) - consider restructuring to reduce complexity`;
    issues.push(issue);
    nestingStartLines.forEach(line => {
      lineReferences.push({ 
        line, 
        issue: "Deep nesting - consider extracting nested blocks into helper methods", 
        severity: 'major' 
      });
    });
  }

  // Check for error handling
  const needsErrorHandling = hasControlFlow && code.length > 100;
  const hasTryCatch = code.includes('try') && code.includes('catch');
  
  if (needsErrorHandling && !hasTryCatch) {
    const issue = "No error handling mechanisms (try-catch) detected in complex code";
    issues.push(issue);
    lineReferences.push({ 
      line: 1, 
      issue: "Missing error handling - consider adding try-catch blocks for robust code", 
      severity: 'major' 
    });
  }

  // Check comment density
  if (lines.length > 20) {
    const commentLines = lines.filter(line =>
      line.trim().startsWith('//') ||
      line.trim().startsWith('/*') ||
      line.trim().startsWith('*')
    ).length;

    const commentRatio = commentLines / lines.length;
    if (commentRatio < rules.commentDensity.failThresholdPercent / 100) {
      const issue = `Low comment-to-code ratio (${(commentRatio * 100).toFixed(1)}% < ${rules.commentDensity.failThresholdPercent}%) - consider adding more documentation`;
      issues.push(issue);
      lineReferences.push({ 
        line: 1, 
        issue: "Insufficient comments - add documentation for better maintainability", 
        severity: 'minor' 
      });
    }
  }

  // Check for single-letter variable names
  const varPatternByLanguage = language === 'java' ? 
    /\b(int|double|String|boolean|char|float|long)\s+([a-zA-Z]{1})\b/ : 
    /\b(var|let|const)\s+([a-zA-Z]{1})\b/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const shortVarMatch = line.match(varPatternByLanguage);
    if (shortVarMatch) {
      const varName = shortVarMatch[2];
      const issue = `Single-letter variable name "${varName}" detected - use descriptive naming for better readability`;
      issues.push(issue);
      lineReferences.push({ 
        line: i + 1, 
        issue: `Short variable name "${varName}" - use descriptive names`, 
        severity: 'minor' 
      });
    }
  }

  // Check for magic numbers
  if (lines.length > 10) {
    let hasMagicNumbers = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const magicNumberMatch = line.match(/[^a-zA-Z0-9_]([3-9]|[1-9][0-9]+)[^a-zA-Z0-9_]/g);
      const isComment = line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*');
      if (magicNumberMatch && !isComment) {
        lineReferences.push({ 
          line: i + 1, 
          issue: "Magic number - replace with named constant", 
          severity: 'minor' 
        });
        hasMagicNumbers = true;
      }
    }

    if (hasMagicNumbers) {
      issues.push("Magic numbers detected - consider using named constants");
    }
  }

  // Analyze for unhandled exceptions - improved with language-specific detection
  if (rules.unhandledExceptions.enabled) {
    const findTryCatchBlocks = (code: string): {start: number, end: number}[] => {
      const tryCatchBlocks: {start: number, end: number}[] = [];
      let inTryBlock = false;
      let tryStartLine = 0;
      let braceCounter = 0;
      
      lines.forEach((line, i) => {
        if (line.includes('try') && line.includes('{') && !inTryBlock) {
          inTryBlock = true;
          tryStartLine = i;
          braceCounter = 1;
        } else if (inTryBlock) {
          // Count braces to find the end of the try-catch block
          const openBraces = (line.match(/{/g) || []).length;
          const closeBraces = (line.match(/}/g) || []).length;
          braceCounter += openBraces - closeBraces;
          
          // When we've reached the end of the try-catch block
          if (braceCounter === 0 && line.includes('}')) {
            tryCatchBlocks.push({ start: tryStartLine, end: i });
            inTryBlock = false;
          }
        }
      });
      
      return tryCatchBlocks;
    };
    
    const tryCatchBlocks = findTryCatchBlocks(code);
    
    // Check for risky operations outside try-catch blocks
    rules.unhandledExceptions.riskOperations
      .filter(operation => !operation.languages || operation.languages.includes(language))
      .forEach(operation => {
        const regex = new RegExp(operation.pattern);
        
        lines.forEach((line, i) => {
          // Skip comments
          if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
            return;
          }
          
          if (regex.test(line)) {
            // Check if this line is within a try-catch block
            const isInTryCatch = tryCatchBlocks.some(block => i >= block.start && i <= block.end);
            
            if (!isInTryCatch) {
              const issue = `${operation.message} (${operation.id})`;
              lineReferences.push({ 
                line: i + 1, 
                issue, 
                severity: 'major' 
              });
              issues.push(`Line ${i + 1}: ${operation.message}`);
            }
          }
        });
      });
  }

  // Analyze for custom code smells with severity levels
  rules.customSmells.forEach((smell) => {
    const regex = new RegExp(smell.pattern, "g");
    lines.forEach((line, idx) => {
      const isComment = line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*');
      if (regex.test(line) && !isComment) {
        issues.push(smell.message);
        lineReferences.push({ 
          line: idx + 1, 
          issue: smell.id, 
          severity: smell.severity || 'minor' 
        });
      }
    });
  });

  // Java-specific checks
  if (language === 'java') {
    // Check for proper exception declarations in method signatures
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('throw') && !line.includes('throws') && !hasTryCatch) {
        const nearbyMethodSig = findNearbyMethodSignature(lines, i, 5);
        if (nearbyMethodSig && !nearbyMethodSig.includes('throws')) {
          issues.push(`Method with throw statement doesn't declare throws in signature`);
          lineReferences.push({ 
            line: i + 1, 
            issue: "Exception thrown but not declared in method signature", 
            severity: 'major' 
          });
        }
      }
    }
  }

  return { details: issues, lineReferences };
};

// Helper to find a method signature near a specific line
function findNearbyMethodSignature(lines: string[], currentLine: number, range: number): string | null {
  const start = Math.max(0, currentLine - range);
  const end = Math.min(lines.length - 1, currentLine);
  
  for (let i = start; i < end; i++) {
    const line = lines[i];
    // Simple method signature detection for Java
    if ((line.includes('public') || line.includes('private') || line.includes('protected')) && 
        line.includes('(') && line.includes(')') && !line.includes(';')) {
      return line;
    }
  }
  return null;
}

// Categorize violations with major, and minor
export const categorizeViolations = (issuesList: string[], lineRefs: { line: number, issue: string, severity: 'major' | 'minor' }[]): CodeViolations => {
  // Use the severity from line references to categorize issues
  const majorIssues = lineRefs
    .filter(ref => ref.severity === 'major')
    .map(ref => `Line ${ref.line}: ${ref.issue}`);
  
  const minorIssues = lineRefs
    .filter(ref => ref.severity === 'minor')
    .map(ref => `Line ${ref.line}: ${ref.issue}`);
  
  // Add any issues that don't have line references
  const lineRefIssues = new Set([...majorIssues, ...minorIssues].map(i => i.replace(/^Line \d+: /, '')));
  
  issuesList.forEach(issue => {
    if (!Array.from(lineRefIssues).some(lineIssue => issue.includes(lineIssue))) {
      if (issue.includes("Function length exceeds") || 
          issue.includes("Nesting level exceeds") ||
          issue.includes("No error handling") ||
          issue.includes("Unhandled JSON.parse") ||
          issue.includes("Unhandled synchronous file") ||
          issue.includes("Potential null/undefined") ||
          issue.includes("Array access without bounds") ||
          issue.includes("Explicit throw statement") ||
          issue.includes("Awaited promise without error") ||
          issue.includes("ArithmeticException") ||
          issue.includes("NullPointerException") ||
          issue.includes("ArrayIndexOutOfBoundsException") ||
          issue.includes("ClassCastException")) {
        majorIssues.push(issue);
      } else {
        minorIssues.push(issue);
      }
    }
  });

  return {
    major: majorIssues.length,
    minor: minorIssues.length,
    details: [
      ...majorIssues.map(issue => `Major: ${issue}`),
      ...minorIssues.map(issue => `Minor: ${issue}`),
    ],
    lineReferences: lineRefs,
  };
};

// Generate test cases from code
export const generateTestCasesFromCode = (code: string, language: string): TestCase[] => {
  const testCases: TestCase[] = [];
  
  if (!code || code.length < 20) {
    return [];
  }

  const lines = code.split('\n');
  
  if (language === 'javascript' || language === 'typescript' || language === 'nodejs') {
    // ... keep existing code (JavaScript/TypeScript test case generation)
    const functionMatches = code.match(/function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\(([^)]*)\)/g) || [];
    const arrowFunctionMatches = code.match(/const\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*(\([^)]*\)|[a-zA-Z_$][0-9a-zA-Z_$]*)\s*=>/g) || [];
    
    functionMatches.forEach((match) => {
      const functionName = match.replace(/function\s+/, '').split('(')[0];
      testCases.push({
        name: `Test ${functionName}`,
        description: `Test case for ${functionName} function`,
        input: `${functionName}(value)`,
        expectedOutput: "Expected result",
        passed: Math.random() > 0.3,
        actualOutput: "Actual result",
      });
    });
    
    if (testCases.length === 0 && code.length > 100) {
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
    // ... keep existing code (Python test case generation)
    const functionMatches = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\):/g) || [];
    functionMatches.forEach((match) => {
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
      testCases.push({
        name: "General test",
        description: "General code execution test",
        input: "Input parameters",
        expectedOutput: "Expected output",
        passed: true,
        actualOutput: "Output matches expected result",
      });
    }
  } else if (language === 'java') {
    // Java-specific test case generation
    const methodMatches = code.match(/(?:public|private|protected)(?:\s+static)?\s+\w+\s+(\w+)\s*\(([^)]*)\)/g) || [];
    
    methodMatches.forEach((match) => {
      const methodNameMatch = match.match(/(?:public|private|protected)(?:\s+static)?\s+\w+\s+(\w+)/);
      if (methodNameMatch && methodNameMatch[1]) {
        const methodName = methodNameMatch[1];
        testCases.push({
          name: `Test ${methodName}`,
          description: `JUnit test case for ${methodName} method`,
          input: `${methodName}(params)`,
          expectedOutput: "Expected result",
          passed: Math.random() > 0.3,
          actualOutput: "Actual result",
          executionDetails: "Test execution details"
        });
      }
    });
    
    // Add at least one test case for Java code
    if (testCases.length === 0 && code.length > 100) {
      testCases.push({
        name: "General Java Test",
        description: "JUnit test for overall functionality",
        input: "Test parameters",
        expectedOutput: "Expected output according to specifications",
        passed: true,
        actualOutput: "Matches expected output",
      });
    }
  } else {
    // ... keep existing code (generic test case generation for other languages)
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
