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
    {
      id: "redundant-computation", 
      pattern: "for\\s*\\(.+\\)\\s*{[^}]*for\\s*\\(.+\\)",
      message: "Possible redundant computation in nested loops",
      severity: "major"
    }
  ] as Array<{ id: string; pattern: string; message: string; severity?: 'major' | 'minor' }>,
};

// Analyze code for issues with line references
export const analyzeCodeForIssues = (code: string, language: string = 'javascript'): { details: string[], lineReferences: { line: number, issue: string, severity: 'major' | 'minor' }[] } => {
  const issues: string[] = [];
  const lineReferences: { line: number, issue: string, severity: 'major' | 'minor' }[] = [];
  const lines = code.split('\n');
  
  // Skip analysis for very simple code
  const hasControlFlow = code.includes('if') || code.includes('for') || code.includes('while');
  if (!hasControlFlow && lines.length < 15) {
    return { details: [], lineReferences: [] };
  }

  // Find initialization and bounds context to prevent false positives
  const boundedLoopVars = extractBoundedVariables(lines, language);
  const nullProtectedVars = extractNullCheckedVariables(lines, language);
  const mainFunctionInputs = extractMainFunctionInputs(lines, language);
  
  // Collect function information for context
  let currentFunction = 0;
  let inFunction = false;
  let functionStartLine = 0;
  let currentFunctionName = "";
  let currentFunctionVars: string[] = [];

  // Track main computation methods for correctly positioning error handling warnings
  let mainComputeMethodLines: number[] = [];

  // Check for long functions and track context
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
      
      // Extract function/method name for better context
      if (language === 'java') {
        const methodMatch = line.match(/(?:public|private|protected)(?:\s+static)?\s+\w+\s+(\w+)\s*\(/);
        if (methodMatch && methodMatch[1]) {
          currentFunctionName = methodMatch[1];
          // Identify main compute methods in Java
          if (currentFunctionName.match(/compute|calculate|solve|process|main/i)) {
            mainComputeMethodLines.push(functionStartLine);
          }
        }
      }
      
      currentFunctionVars = extractFunctionParameters(line, language);
    }

    // Detect variable declarations in function scope
    if (inFunction) {
      const varDeclarations = extractVariableDeclarations(line, language);
      currentFunctionVars.push(...varDeclarations);
      
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

  // Check for deep nesting with improved context tracking
  let maxNesting = 0;
  let currentNesting = 0;
  let nestingLines: Map<number, number> = new Map(); // line -> nesting level
  let nestingBlocks: Map<number, {start: number, end: number}[]> = new Map(); // nesting level -> blocks

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openBraces = (line.match(/{/g) || []).length;
    const closedBraces = (line.match(/}/g) || []).length;

    // Track opening braces
    for (let j = 0; j < openBraces; j++) {
      currentNesting++;
      if (currentNesting > rules.nestingDepth.warnThreshold) {
        nestingLines.set(i + 1, currentNesting);
        
        // Track blocks at each nesting level for deduplication
        if (!nestingBlocks.has(currentNesting)) {
          nestingBlocks.set(currentNesting, []);
        }
        nestingBlocks.get(currentNesting)!.push({
          start: i + 1,
          end: -1 // Will be set when the brace is closed
        });
      }
    }

    maxNesting = Math.max(maxNesting, currentNesting);

    // Track closing braces
    for (let j = 0; j < closedBraces; j++) {
      // Update end line for nesting blocks
      if (currentNesting > rules.nestingDepth.warnThreshold) {
        const blocks = nestingBlocks.get(currentNesting);
        if (blocks && blocks.length > 0) {
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock.end === -1) {
            lastBlock.end = i + 1;
          }
        }
      }
      currentNesting--;
    }
  }

  // Add deep nesting warnings with improved deduplication
  if (maxNesting > rules.nestingDepth.warnThreshold) {
    // Find the start of each unique nesting block to avoid duplicate warnings
    const uniqueNestingStarts = new Set<number>();
    
    nestingBlocks.forEach((blocks) => {
      blocks.forEach(block => {
        uniqueNestingStarts.add(block.start);
      });
    });
    
    // Report deep nesting at each unique starting point
    uniqueNestingStarts.forEach(line => {
      const nestingLevel = nestingLines.get(line) || 0;
      if (nestingLevel > rules.nestingDepth.warnThreshold) {
        lineReferences.push({ 
          line, 
          issue: `Deep nesting (level ${nestingLevel}) - consider extracting nested blocks into helper methods`, 
          severity: nestingLevel > rules.nestingDepth.failThreshold ? 'major' : 'minor' 
        });
      }
    });
    
    issues.push(`Nesting level exceeds ${rules.nestingDepth.warnThreshold} (max: ${maxNesting}) - consider restructuring to reduce complexity`);
  }

  // Check for error handling based on main computation methods
  const needsErrorHandling = hasControlFlow && code.length > 100;
  const hasTryCatch = code.includes('try') && code.includes('catch');
  
  if (needsErrorHandling && !hasTryCatch) {
    const issue = "No error handling mechanisms (try-catch) detected in complex code";
    issues.push(issue);
    
    // Position warning at main compute method starts rather than line 1
    if (mainComputeMethodLines.length > 0) {
      lineReferences.push({ 
        line: mainComputeMethodLines[0], 
        issue: "Missing error handling - consider adding try-catch blocks for robust code", 
        severity: 'major' 
      });
    } else {
      // Fall back to the first function if no main compute method identified
      const firstMethodLine = functionStartLine > 0 ? functionStartLine : 1;
      lineReferences.push({ 
        line: firstMethodLine, 
        issue: "Missing error handling - consider adding try-catch blocks for robust code", 
        severity: 'major' 
      });
    }
  }

  // Check comment density with same logic as before
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

  // Check for single-letter variable names with improved exemption logic
  // Keep exempt vars for loop indices
  const exemptVars = new Set(['i', 'j', 'k', 'n', 'm']);
  const varPatternByLanguage = language === 'java' ? 
    /\b(int|double|String|boolean|char|float|long)\s+([a-zA-Z]{1})\b/ : 
    /\b(var|let|const)\s+([a-zA-Z]{1})\b/;

  // Track already reported single-letter variables to avoid duplicates
  const reportedShortVars = new Set<string>();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const shortVarMatch = line.match(varPatternByLanguage);
    if (shortVarMatch) {
      const varName = shortVarMatch[2];
      
      // Skip if already reported or is an exempt loop variable
      if (!reportedShortVars.has(varName) && !exemptVars.has(varName)) {
        // Check if this is a loop counter in a bounded context
        const isLoopVar = (line.includes('for') || boundedLoopVars.includes(varName));
                         
        if (!isLoopVar) {
          const issue = `Single-letter variable name "${varName}" detected - use descriptive naming for better readability`;
          issues.push(issue);
          lineReferences.push({ 
            line: i + 1, 
            issue: `Short variable name "${varName}" - use descriptive names`, 
            severity: 'minor' 
          });
          
          // Mark as reported
          reportedShortVars.add(varName);
        }
      }
    }
  }

  // Check for magic numbers with improved deduplication
  if (lines.length > 10) {
    // Map to track magic numbers by their actual value to avoid duplicates
    const magicNumbersByValue = new Map<string, Set<number>>(); // value -> line numbers
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comments, string literals, and typical test case input
      const isComment = line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*');
      const isStringLiteral = line.includes('"') || line.includes("'");
      const isTypicalIntInput = line.includes("Scanner") || line.includes("BufferedReader") ||
                             line.includes("readLine") || line.includes("parseInt") ||
                             line.includes("nextInt");
                              
      if (!isComment && !isTypicalIntInput) {
        // Match numbers not part of identifiers or decimal points
        const magicNumberMatches = line.match(/[^a-zA-Z0-9_\.]([3-9]|[1-9][0-9]+)(?![a-zA-Z0-9_\.])/g);
        
        if (magicNumberMatches) {
          magicNumberMatches.forEach(match => {
            // Extract just the number part
            const numMatch = match.match(/([3-9]|[1-9][0-9]+)/);
            if (numMatch) {
              const numValue = numMatch[1];
              
              // Skip if in a string context
              if (isStringLiteral && (line.indexOf('"' + numValue) >= 0 || line.indexOf("'" + numValue) >= 0)) {
                return;
              }
              
              // Track this number by value
              if (!magicNumbersByValue.has(numValue)) {
                magicNumbersByValue.set(numValue, new Set());
              }
              magicNumbersByValue.get(numValue)!.add(i + 1);
            }
          });
        }
      }
    }
    
    // Report only the first occurrence of each unique magic number
    magicNumbersByValue.forEach((lineSet, value) => {
      // Only report if there are lines containing this magic number
      if (lineSet.size > 0) {
        const firstLine = Math.min(...Array.from(lineSet));
        lineReferences.push({ 
          line: firstLine, 
          issue: `Magic number ${value} - replace with named constant`, 
          severity: 'minor' 
        });
      }
    });
    
    if (magicNumbersByValue.size > 0) {
      issues.push("Magic numbers detected - consider using named constants");
    }
  }

  // Find try-catch blocks to avoid flagging protected code
  const tryCatchBlocks = findTryCatchBlocks(lines);
  
  // Analyze for unhandled exceptions with improved context awareness
  if (rules.unhandledExceptions.enabled) {
    // Create a map to deduplicate similar issues
    const exceptionIssueMap = new Map<string, {count: number, lines: Set<number>}>();
    
    // Check for risky operations outside try-catch blocks
    rules.unhandledExceptions.riskOperations
      .filter(operation => !operation.languages || operation.languages.includes(language))
      .forEach(operation => {
        const regex = new RegExp(operation.pattern);
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Skip comments
          if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
            continue;
          }
          
          if (regex.test(line)) {
            // Check if this line is within a try-catch block
            const isInTryCatch = tryCatchBlocks.some(block => i >= block.start && i <= block.end);
            
            // Enhanced context check for different operation types
            if (!isInTryCatch && shouldFlagRiskyOperation(line, operation.id, boundedLoopVars, nullProtectedVars, mainFunctionInputs)) {
              const key = operation.id;
              
              if (!exceptionIssueMap.has(key)) {
                exceptionIssueMap.set(key, {count: 0, lines: new Set()});
              }
              
              const entry = exceptionIssueMap.get(key)!;
              entry.count++;
              entry.lines.add(i + 1);
            }
          }
        }
      });
    
    // Add exactly one issue per line with proper prioritization
    const lineToIssue = new Map<number, {message: string, severity: 'major' | 'minor'}>(); 
    
    // Process each issue type
    exceptionIssueMap.forEach((value, key) => {
      const operation = rules.unhandledExceptions.riskOperations.find(op => op.id === key);
      if (operation) {
        // Add summarized issue to the issues list
        let issue = `${operation.message} (found in ${value.count} locations)`;
        issues.push(issue);
        
        // Add line references, but ensure only one issue per line with proper prioritization
        Array.from(value.lines).forEach(line => {
          // Only add if this line doesn't have a higher priority issue yet
          if (!lineToIssue.has(line) || 
              (lineToIssue.get(line)!.severity === 'minor' && key.includes('null') || key.includes('array'))) {
            lineToIssue.set(line, {
              message: operation.message,
              severity: 'major' // Most unhandled exceptions are major
            });
          }
        });
      }
    });
    
    // Convert the map to line references after deduplication
    lineToIssue.forEach((value, line) => {
      lineReferences.push({
        line,
        issue: value.message,
        severity: value.severity
      });
    });
  }

  // Check for redundant loops or inefficient computations
  const redundantComputationIssues = new Map<number, string>();
  
  for (let i = 0; i < lines.length; i++) {
    const nextFewLines = lines.slice(i, i + 5).join('\n');
    
    // Check for nested loops with potential redundant computation
    if (/for\s*\([^)]+\)\s*{[^}]*for\s*\([^)]+\)/.test(nextFewLines)) {
      const innerVars = extractLoopVariables(nextFewLines, language);
      const outerVars = extractLoopVariables(lines[i], language);
      
      // Check if loops have dependency that could be optimized
      const hasRedundancy = innerVars.some(v => outerVars.includes(v));
      
      if (hasRedundancy) {
        // Only flag the outer loop start to avoid duplication
        redundantComputationIssues.set(i + 1, "Potential inefficient nested loops - check for redundant computation");
      }
    }
  }
  
  redundantComputationIssues.forEach((issue, line) => {
    lineReferences.push({
      line,
      issue,
      severity: 'major'
    });
  });
  
  if (redundantComputationIssues.size > 0) {
    issues.push("Potential performance issues detected with nested loops");
  }

  // Analyze for custom code smells with improved deduplication
  const customSmellLines = new Map<string, Set<number>>();
  
  rules.customSmells.forEach((smell) => {
    const regex = new RegExp(smell.pattern, "g");
    lines.forEach((line, idx) => {
      const isComment = line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*');
      if (regex.test(line) && !isComment) {
        const key = smell.id;
        
        if (!customSmellLines.has(key)) {
          customSmellLines.set(key, new Set());
        }
        
        const lineSet = customSmellLines.get(key)!;
        lineSet.add(idx + 1);
      }
    });
  });
  
  // Add only first occurrence of each smell type
  customSmellLines.forEach((lineSet, smellId) => {
    if (lineSet.size > 0) {
      const smell = rules.customSmells.find(s => s.id === smellId);
      if (smell) {
        // Add the issue description once
        issues.push(smell.message);
        
        // Report only the first occurrence
        const firstLine = Math.min(...Array.from(lineSet));
        lineReferences.push({ 
          line: firstLine, 
          issue: smell.message, 
          severity: smell.severity || 'minor' 
        });
      }
    }
  });

  // Java-specific checks with context awareness
  if (language === 'java') {
    // Check for proper exception declarations in method signatures
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Only flag explicit throw statements outside of both try-catch and throws declaration
      if (line.includes('throw ') && !hasTryCatch) {
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

  // Deduplicate issues by combining similar line references and ensure only one issue per line
  return { 
    details: [...new Set(issues)], 
    lineReferences: deduplicateLineReferences(lineReferences)
  };
};

// Helper function to deduplicate line references with improved logic to avoid duplicates
function deduplicateLineReferences(refs: { line: number, issue: string, severity: 'major' | 'minor' }[]): typeof refs {
  const lineToIssue = new Map<number, { issue: string, severity: 'major' | 'minor' }>();
  
  // First pass: prioritize major over minor issues on the same line
  refs.forEach(ref => {
    const existingIssue = lineToIssue.get(ref.line);
    
    // Check if we should replace the existing issue
    if (!existingIssue || 
        (ref.severity === 'major' && existingIssue.severity === 'minor') || 
        (ref.severity === existingIssue.severity && ref.issue.length > existingIssue.issue.length)) {
      // Prefer major issues, or more detailed issues of the same severity
      lineToIssue.set(ref.line, { issue: ref.issue, severity: ref.severity });
    }
  });
  
  // Convert back to array
  return Array.from(lineToIssue.entries()).map(([line, {issue, severity}]) => ({
    line, issue, severity
  }));
}

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

// Helper function to identify bounded loop variables
function extractBoundedVariables(lines: string[], language: string): string[] {
  const boundedVars: string[] = [];
  
  for (const line of lines) {
    // For 'for' loops with explicit bounds
    if (line.includes('for') && line.includes(';')) {
      const match = line.match(/for\s*\(\s*\w+\s+(\w+)\s*=.+?;\s*\1\s*[<>]=?\s*.+?;\s*\1/);
      if (match && match[1]) {
        boundedVars.push(match[1]);
      }
    }
  }
  
  return boundedVars;
}

// Helper function to find variables that have null checks
function extractNullCheckedVariables(lines: string[], language: string): string[] {
  const checkedVars: string[] = [];
  
  for (const line of lines) {
    if (language === 'java') {
      // Java null checks
      const match = line.match(/(\w+)\s*!=\s*null/);
      if (match && match[1]) {
        checkedVars.push(match[1]);
      }
    } else {
      // JS null/undefined checks
      const match = line.match(/(\w+)\s*!==?\s*(null|undefined)/);
      if (match && match[1]) {
        checkedVars.push(match[1]);
      }
    }
  }
  
  return checkedVars;
}

// Helper function to extract loop variables
function extractLoopVariables(code: string, language: string): string[] {
  const vars: string[] = [];
  
  // For 'for' loops with initialization
  const forMatches = language === 'java' 
    ? code.match(/for\s*\(\s*\w+\s+(\w+)\s*=/)
    : code.match(/for\s*\(\s*(let|var|const)?\s*(\w+)\s*=/);
    
  if (forMatches) {
    vars.push(language === 'java' ? forMatches[1] : (forMatches[2] || ''));
  }
  
  return vars.filter(Boolean);
}

// Helper to extract function parameters
function extractFunctionParameters(line: string, language: string): string[] {
  const parameters: string[] = [];
  
  // Extract parameters from function definition
  const paramMatch = line.match(/\(([^)]*)\)/);
  if (paramMatch && paramMatch[1]) {
    const params = paramMatch[1].split(',');
    
    params.forEach(param => {
      // Different parsing based on language
      if (language === 'java') {
        // Java: type paramName
        const match = param.trim().match(/\w+\s+(\w+)/);
        if (match && match[1]) {
          parameters.push(match[1]);
        }
      } else {
        // JS: paramName (or typing)
        const match = param.trim().match(/(\w+)(\s*:|$)/);
        if (match && match[1]) {
          parameters.push(match[1]);
        }
      }
    });
  }
  
  return parameters;
}

// Helper to extract main function inputs in competitive programming context
function extractMainFunctionInputs(lines: string[], language: string): string[] {
  const inputs: string[] = [];
  
  if (language === 'java') {
    // Look for Scanner or BufferedReader inputs in Java
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('Scanner') || line.includes('BufferedReader')) {
        // Extract the variable name
        const match = line.match(/(\w+)\s*=\s*new\s+(Scanner|BufferedReader)/);
        if (match && match[1]) {
          inputs.push(match[1]); // Add the scanner/reader name
          
          // Also look for the next few lines for input variables
          for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            const nextLine = lines[j];
            const nextMatch = nextLine.match(/(\w+)\s*=\s*\w+\.(nextInt|nextLine|readLine)/);
            if (nextMatch && nextMatch[1]) {
              inputs.push(nextMatch[1]); // Add input variables
            }
          }
        }
      }
    }
  }
  
  return inputs;
}

// Helper to extract variable declarations in current scope
function extractVariableDeclarations(line: string, language: string): string[] {
  const variables: string[] = [];
  
  if (language === 'java') {
    // Java variable declarations: type varName
    const matches = line.match(/\b(int|double|String|boolean|char|float|long|Integer|Double|Boolean)\s+(\w+)\s*(=|;)/g);
    if (matches) {
      matches.forEach(match => {
        const varMatch = match.match(/\b(int|double|String|boolean|char|float|long|Integer|Double|Boolean)\s+(\w+)\s*(=|;)/);
        if (varMatch && varMatch[2]) {
          variables.push(varMatch[2]);
        }
      });
    }
  } else {
    // JS variable declarations
    const matches = line.match(/\b(var|let|const)\s+(\w+)\s*(=|;)/g);
    if (matches) {
      matches.forEach(match => {
        const varMatch = match.match(/\b(var|let|const)\s+(\w+)\s*(=|;)/);
        if (varMatch && varMatch[2]) {
          variables.push(varMatch[2]);
        }
      });
    }
  }
  
  return variables;
}

// Find try-catch blocks in code
function findTryCatchBlocks(lines: string[]): {start: number, end: number}[] {
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
}

// Context-aware decision on whether to flag a risky operation - updated with better context
function shouldFlagRiskyOperation(
  line: string, 
  operationType: string, 
  boundedVars: string[], 
  nullCheckedVars: string[], 
  mainInputs: string[]
): boolean {
  // For array access in bounded loops, avoid flagging
  if (operationType === 'array-unsafe' || operationType === 'java-array-index') {
    // Extract the variable used for array indexing
    const match = line.match(/\[(\w+)\]/);
    if (match && match[1] && boundedVars.includes(match[1])) {
      return false; // Don't flag if index is a bounded loop variable
    }
    
    // Check if this is a literal index that is likely safe
    const literalMatch = line.match(/\[(\d+)\]/);
    if (literalMatch && parseInt(literalMatch[1]) < 100) {
      // Small literal indices are usually safe
      return false;
    }
  }
  
  // For null pointer access, don't flag if null-checked
  if (operationType === 'null-unsafe' || operationType === 'java-null-pointer') {
    // Extract the object being accessed
    const match = line.match(/(\w+)\.\w+\(/);
    if (match && match[1] && 
      (nullCheckedVars.includes(match[1]) || mainInputs.includes(match[1]))) {
      return false; // Don't flag if object has null check or is a main input
    }
  }
  
  // For division, look for explicit non-zero checks
  if (operationType === 'java-arithmetic' && line.includes('/')) {
    // Skip division by constants which are safe
    if (line.match(/\/\s*\d+([^.]|$)/)) {
      return false; // Division by integer constant
    }
    
    // Skip division in typical counter/average calculations
    if (line.match(/\/\s*(length|size)\(\)/i)) {
      return false; // Division by array/collection size
    }
  }
  
  return true; // Flag by default
}

// Categorize violations with major, and minor - improved with deduplication
export const categorizeViolations = (issuesList: string[], lineRefs: { line: number, issue: string, severity: 'major' | 'minor' }[]): CodeViolations => {
  // Use the severity from line references to categorize issues
  const uniqueMajorLineRefs = new Map<number, string>();
  const uniqueMinorLineRefs = new Map<number, string>();
  
  // Prioritize major issues and deduplicate issues on the same line
  lineRefs.forEach(ref => {
    if (ref.severity === 'major') {
      uniqueMajorLineRefs.set(ref.line, ref.issue);
    } else if (!uniqueMajorLineRefs.has(ref.line)) {
      // Only add minor if there's no major issue on this line
      uniqueMinorLineRefs.set(ref.line, ref.issue);
    }
  });
  
  const majorIssues = Array.from(uniqueMajorLineRefs.entries())
    .map(([line, issue]) => `Line ${line}: ${issue}`);
  
  const minorIssues = Array.from(uniqueMinorLineRefs.entries())
    .map(([line, issue]) => `Line ${line}: ${issue}`);
  
  // Add any issues that don't have line references
  const lineRefIssues = new Set([...majorIssues, ...minorIssues].map(i => i.replace(/^Line \d+: /, '')));
  
  // Classify issues without line references
  const issuesToCategorize = issuesList.filter(issue => 
    !Array.from(lineRefIssues).some(lineIssue => issue.includes(lineIssue))
  );
  
  issuesToCategorize.forEach(issue => {
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
        issue.includes("ClassCastException") ||
        issue.includes("redundant computation") ||
        issue.includes("inefficient nested")) {
      majorIssues.push(issue);
    } else {
      minorIssues.push(issue);
    }
  });

  // Build the violations object with deduplicated issues
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
    // Look for competitive programming patterns in Java
    const hasMainMethod = code.match(/public\s+static\s+void\s+main\s*\(/);
    const hasStdinInput = code.match(/Scanner|BufferedReader|System\.in/);
    
    if (hasMainMethod && hasStdinInput) {
      // Identify the input/output pattern
      testCases.push({
        name: "Sample Test Case",
        description: "Competitive programming sample input/output test",
        input: "3\n1 2 3",
        expectedOutput: "6",
        passed: true,
        actualOutput: "6",
        executionDetails: "Execution completed successfully"
      });
      
      testCases.push({
        name: "Edge Case Test",
        description: "Testing with edge case values",
        input: "1\n0",
        expectedOutput: "0",
        passed: true,
        actualOutput: "0",
        executionDetails: "Execution completed successfully"
      });
      
      testCases.push({
        name: "Stress Test",
        description: "Testing with larger input sizes",
        input: "1000\n" + Array.from({length: 1000}, (_, i) => i + 1).join(" "),
        expectedOutput: "500500",
        passed: false,
        actualOutput: "Time limit exceeded",
        executionDetails: "Execution timed out after 1000ms"
      });
    } else {
      // Regular Java method testing
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
