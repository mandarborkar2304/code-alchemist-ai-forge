import { CodeViolations } from '@/types';
import { TestCase } from '@/types';

// Quality Rules Configuration
export const rules = {
  cyclomaticComplexity: {
    warnThreshold: 10,
    failThreshold: 15
  },
  functionLength: {
    warnThreshold: 25,
    failThreshold: 40
  },
  nestingDepth: {
    warnThreshold: 4,
    failThreshold: 6
  },
  commentDensity: {
    warnThresholdPercent: 10,
    failThresholdPercent: 5
  },
  noGlobalVariables: {
    enabled: true
  },
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
        pattern: "\\b\\w+\\[\\w+\\]",
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
      {
        id: "java-arithmetic",
        pattern: "\\w+\\s*/\\s*\\w+",
        message: "Division operation may cause ArithmeticException if divisor is zero",
        languages: ["java"]
      },
      {
        id: "java-null-pointer",
        pattern: "(?<!arr|s)\\.\\w+\\(",
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
        pattern: "\\([A-Z][A-Za-z0-9_]*\\)\\s*\\w+",
        message: "Type casting may cause ClassCastException",
        languages: ["java"]
      },
      {
        id: "java-throw",
        pattern: "throw\\s+new\\s+\\w+",
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
      pattern: "(?<![a-zA-Z0-9_])([3-9]|[1-9][0-9]+)(?![a-zA-Z0-9_])",
      message: "Replace magic numbers with constants",
      severity: "minor"
    },
    {
      id: "single-letter-var",
      pattern: "\\b(int|String|boolean|double|char|long)\\s+([a-zA-Z])\\b",
      message: "Use descriptive variable names instead of single letters",
      severity: "minor"
    },
    {
      id: "redundant-computation",
      pattern: "for\\s*\\(.+?\\)\\s*{[^}]*for\\s*\\(.+?\\)",
      message: "Possible redundant computation in nested loops",
      severity: "major"
    }
  ] as Array<{ id: string; pattern: string; message: string; severity?: 'major' | 'minor' }>
};

// Helper functions needed for code analysis
// Extract variables that are bounded in loops
const extractBoundedVariables = (lines: string[], language: string): string[] => {
  const boundedVars: string[] = [];
  
  // Extract variables from for loop conditions
  for (const line of lines) {
    if (language === 'java') {
      // Match Java for loop structure: for(int i = 0; i < n; i++)
      const forMatches = line.match(/for\s*\(\s*(?:int|long|short|byte)\s+(\w+)\s*=.+?\s*(?:\+\+|--)\s*\)/);
      if (forMatches && forMatches[1]) {
        boundedVars.push(forMatches[1]);
      }
    } else {
      // Match JavaScript/TypeScript for loop: for(let i = 0; i < arr.length; i++)
      const forMatches = line.match(/for\s*\(\s*(?:let|var|const)\s+(\w+)\s*=.+?\s*(?:\+\+|--)\s*\)/);
      if (forMatches && forMatches[1]) {
        boundedVars.push(forMatches[1]);
      }
    }
    
    // Match for...of loops: for (const item of items)
    const forOfMatches = line.match(/for\s*\(\s*(?:const|let|var)\s+(\w+)\s+of/);
    if (forOfMatches && forOfMatches[1]) {
      boundedVars.push(forOfMatches[1]);
    }
    
    // Match for...in loops: for (const key in object)
    const forInMatches = line.match(/for\s*\(\s*(?:const|let|var)\s+(\w+)\s+in/);
    if (forInMatches && forInMatches[1]) {
      boundedVars.push(forInMatches[1]);
    }
    
    // Match array.forEach: array.forEach((item, index) => {...})
    const forEachMatches = line.match(/forEach\s*\(\s*(?:\([^)]*\)|(\w+))\s*=>/);
    if (forEachMatches && forEachMatches[1]) {
      boundedVars.push(forEachMatches[1]);
    }
    
    // Match Java enhanced for loop: for (Type item : items)
    if (language === 'java') {
      const enhancedForMatches = line.match(/for\s*\(\s*\w+\s+(\w+)\s*:/);
      if (enhancedForMatches && enhancedForMatches[1]) {
        boundedVars.push(enhancedForMatches[1]);
      }
    }
  }
  
  return boundedVars;
};

// Extract variables that have null checks
const extractNullCheckedVariables = (lines: string[], language: string): string[] => {
  const nullCheckedVars: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for null checks like: if (var != null), if (var !== null), etc.
    const nullCheckMatches = line.match(/if\s*\(\s*(\w+)\s*(?:!=|!==)\s*null\s*\)/);
    if (nullCheckMatches && nullCheckMatches[1]) {
      nullCheckedVars.push(nullCheckMatches[1]);
    }
    
    // Check for null checks like: if (null != var), if (null !== var), etc.
    const reversedNullCheckMatches = line.match(/if\s*\(\s*null\s*(?:!=|!==)\s*(\w+)\s*\)/);
    if (reversedNullCheckMatches && reversedNullCheckMatches[1]) {
      nullCheckedVars.push(reversedNullCheckMatches[1]);
    }
    
    // Check for Objects.nonNull(var)
    if (language === 'java') {
      const objectsNonNullMatches = line.match(/Objects\.nonNull\s*\(\s*(\w+)\s*\)/);
      if (objectsNonNullMatches && objectsNonNullMatches[1]) {
        nullCheckedVars.push(objectsNonNullMatches[1]);
      }
    }
    
    // Check for Optional checks in Java
    if (language === 'java' && line.includes('Optional')) {
      const optionalMatches = line.match(/(\w+)\.isPresent\(\)/);
      if (optionalMatches && optionalMatches[1]) {
        nullCheckedVars.push(optionalMatches[1]);
      }
    }
  }
  
  return nullCheckedVars;
};

// Extract main function input parameters
const extractMainFunctionInputs = (lines: string[], language: string): string[] => {
  const mainFunctionInputs: string[] = [];
  
  // Look for main method declaration
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (language === 'java') {
      // Java main method: public static void main(String[] args)
      const mainMethodMatch = line.match(/public\s+static\s+void\s+main\s*\(\s*String\s*\[\]\s*(\w+)/);
      if (mainMethodMatch && mainMethodMatch[1]) {
        mainFunctionInputs.push(mainMethodMatch[1]);
      }
    } else {
      // JavaScript/TypeScript main function: function main(args)
      const mainFunctionMatch = line.match(/function\s+main\s*\(\s*(\w+)/);
      if (mainFunctionMatch && mainFunctionMatch[1]) {
        mainFunctionInputs.push(mainFunctionMatch[1]);
      }
      
      // Check for default exported function or arrow function
      const exportDefaultMatch = line.match(/export\s+default\s+(?:function)?\s*\(\s*(\w+)/);
      if (exportDefaultMatch && exportDefaultMatch[1]) {
        mainFunctionInputs.push(exportDefaultMatch[1]);
      }
    }
  }
  
  return mainFunctionInputs;
};

// Extract function parameters from a function declaration
const extractFunctionParameters = (line: string, language: string): string[] => {
  const params: string[] = [];
  
  if (language === 'java') {
    // Java method parameters: methodName(Type param1, Type param2)
    const paramMatch = line.match(/\(\s*([^)]+)\s*\)/);
    if (paramMatch && paramMatch[1]) {
      const paramList = paramMatch[1].split(',');
      for (const param of paramList) {
        const paramNameMatch = param.trim().match(/\w+\s+(\w+)(?:\s*=.*)?$/);
        if (paramNameMatch && paramNameMatch[1]) {
          params.push(paramNameMatch[1]);
        }
      }
    }
  } else {
    // JavaScript/TypeScript function parameters: function name(param1, param2)
    const paramMatch = line.match(/\(\s*([^)]*)\s*\)/);
    if (paramMatch && paramMatch[1]) {
      const paramList = paramMatch[1].split(',');
      for (const param of paramList) {
        const trimmedParam = param.trim();
        if (trimmedParam) {
          // Handle destructuring, defaults, and type annotations
          const paramNameMatch = trimmedParam.match(/(?:const|let|var)?\s*(?:\{[^}]*\}|\[[^\]]*\]|(\w+))(?:\s*:[^=,]+)?(?:\s*=.*)?/);
          if (paramNameMatch && paramNameMatch[1]) {
            params.push(paramNameMatch[1]);
          }
        }
      }
    }
  }
  
  return params;
};

// Extract variable declarations from a line of code
const extractVariableDeclarations = (line: string, language: string): string[] => {
  const vars: string[] = [];
  
  if (language === 'java') {
    // Java variable declarations: Type varName = value;
    const varMatches = line.match(/(?:int|long|float|double|String|boolean|char|byte|short)\s+(\w+)(?:\s*=.*)?;/g);
    if (varMatches) {
      for (const match of varMatches) {
        const nameMatch = match.match(/\s+(\w+)(?:\s*=.*)?;/);
        if (nameMatch && nameMatch[1]) {
          vars.push(nameMatch[1]);
        }
      }
    }
  } else {
    // JavaScript/TypeScript variable declarations: let/const/var varName = value;
    const varMatches = line.match(/(?:let|const|var)\s+(\w+)(?:\s*=.*)?(?:;|$)/g);
    if (varMatches) {
      for (const match of varMatches) {
        const nameMatch = match.match(/\s+(\w+)(?:\s*=.*)?(?:;|$)/);
        if (nameMatch && nameMatch[1]) {
          vars.push(nameMatch[1]);
        }
      }
    }
  }
  
  return vars;
};

// Extract variables used in loops
const extractLoopVariables = (code: string, language: string): string[] => {
  const loopVars: string[] = [];
  
  // For regular for loops
  const forLoopMatches = code.match(/for\s*\(\s*(?:let|var|const|int|long)\s+(\w+)\s*=/g);
  if (forLoopMatches) {
    for (const match of forLoopMatches) {
      const varMatch = match.match(/\s+(\w+)\s*=$/);
      if (varMatch && varMatch[1]) {
        loopVars.push(varMatch[1]);
      }
    }
  }
  
  // For for-of and for-in loops
  const forOfInMatches = code.match(/for\s*\(\s*(?:let|var|const)\s+(\w+)\s+(?:of|in)/g);
  if (forOfInMatches) {
    for (const match of forOfInMatches) {
      const varMatch = match.match(/\s+(\w+)\s+(?:of|in)$/);
      if (varMatch && varMatch[1]) {
        loopVars.push(varMatch[1]);
      }
    }
  }
  
  // For Java enhanced for loops
  if (language === 'java') {
    const enhancedForMatches = code.match(/for\s*\(\s*\w+\s+(\w+)\s*:/g);
    if (enhancedForMatches) {
      for (const match of enhancedForMatches) {
        const varMatch = match.match(/\s+(\w+)\s*:$/);
        if (varMatch && varMatch[1]) {
          loopVars.push(varMatch[1]);
        }
      }
    }
  }
  
  return loopVars;
};

// Find the nearby method signature for a line of code
const findNearbyMethodSignature = (lines: string[], currentLineIndex: number, lookbackLines: number): string | null => {
  // Look backward from current line to find method signature
  for (let i = currentLineIndex; i >= Math.max(0, currentLineIndex - lookbackLines); i--) {
    const line = lines[i];
    if (/(?:public|private|protected)(?:\s+static)?\s+\w+\s+\w+\s*\(/.test(line)) {
      return line;
    }
  }
  
  return null;
};

// Find try-catch blocks in code
function findTryCatchBlocks(lines: string[]): {start: number, end: number}[] {
  const tryCatchBlocks: {start: number, end: number}[] = [];
  let inTryBlock = false;
  let tryStartLine = 0;
  let braceCounter = 0;
   
  lines.forEach((line, i) => {
    if (line.includes('try')) {
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
let nestingBlocks: Map<number, { start: number, end: number }[]> = new Map(); // nesting level -> blocks

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
  const uniqueNestingStarts = new Set<number>();

  nestingBlocks.forEach((blocks) => {
    blocks.forEach(block => {
      uniqueNestingStarts.add(block.start);
    });
  });

  // Always treat deep nesting as major
  uniqueNestingStarts.forEach(line => {
    const nestingLevel = nestingLines.get(line) || 0;
    if (nestingLevel > rules.nestingDepth.warnThreshold) {
      lineReferences.push({
        line,
        issue: `Deep nesting (level ${nestingLevel}) - consider extracting nested blocks into helper methods`,
        severity: 'major'
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

  // Anchor the warning directly to the compute method declaration line
  const computeLine = lines.findIndex(l => 
    /public\s+static\s+\w+\s+compute/.test(l) || 
    /private\s+\w+\s+compute/.test(l) || 
    /public\s+\w+\s+calculate/.test(l) ||
    /function\s+compute/.test(l) ||
    /const\s+compute/.test(l)
  ) + 1 || 1;
  
  lineReferences.push({
    line: computeLine,
    issue: "Missing error handling - consider adding try-catch blocks for robust code",
    severity: 'major'
  });
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
      const isLoopVar = (line.includes('for') || boundedLoopVars.includes(varName));

      if (!isLoopVar) {
        const issue = `Single-letter variable name "${varName}" detected - use descriptive naming for better readability`;
        issues.push(issue);
        lineReferences.push({
          line: i + 1,
          issue: `Short variable name "${varName}" - use descriptive names`,
          severity: 'minor'
        });

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
    issues.push(`Magic numbers detected (${magicNumbersByValue.size} unique constants) - consider using named constants`);
  }
}

// Find try-catch blocks to avoid flagging protected code
const tryCatchBlocks = findTryCatchBlocks(lines);

// Create a map to deduplicate similar issues
const exceptionIssueMap = new Map<string, { count: number; lines: Set<number> }>();

// Analyze for unhandled exceptions with improved context awareness
if (rules.unhandledExceptions.enabled) {
  // Check for risky operations outside try-catch blocks
  rules.unhandledExceptions.riskOperations
    .filter(operation => !operation.languages || operation.languages.includes(language))
    .forEach(operation => {
      const regex = new RegExp(operation.pattern);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip comments
        if (
          line.trim().startsWith('//') ||
          line.trim().startsWith('*') ||
          line.trim().startsWith('/*')
        ) {
          continue;
        }

        if (regex.test(line)) {
          // Check if this line is within a try-catch block
          const isInTryCatch = tryCatchBlocks.some(block => i >= block.start && i <= block.end);

          // Enhanced context check for different operation types
          if (
            !isInTryCatch &&
            shouldFlagRiskyOperation(
              line,
              operation.id,
              boundedLoopVars,
              nullProtectedVars,
              mainFunctionInputs
            )
          ) {
            const key = operation.id;

            if (!exceptionIssueMap.has(key)) {
              exceptionIssueMap.set(key, { count: 0, lines: new Set() });
            }

            const entry = exceptionIssueMap.get(key)!;
            entry.count++;
            entry.lines.add(i + 1);
          }
        }
      }
    });

  // Push aggregated exception issues
  exceptionIssueMap.forEach((entry, key) => {
    const operationRule = rules.unhandledExceptions.riskOperations.find(op => op.id === key);
    if (operationRule) {
      const description = operationRule.message || `Potential unhandled exception: ${key}`;
      issues.push(description);

      // Report first few lines for clarity
      const lineList = Array.from(entry.lines).slice(0, 3);
      lineList.forEach(line => {
        lineReferences.push({
          line,
          issue: description,
          severity: 'major'
        });
      });
    }
  });
}

  
// Add exactly one issue per line with proper prioritization
const lineToIssue = new Map<number, { message: string, severity: 'major' | 'minor' }>();

// Process each issue type
exceptionIssueMap.forEach((value, key) => {
  const operation = rules.unhandledExceptions.riskOperations.find(op => op.id === key);
  if (operation) {
    // Add summarized issue to the issues list
    const issue = `${operation.message} (found in ${value.count} locations)`;
    issues.push(issue);

    // Add line references, but ensure only one issue per line with correct prioritization
    Array.from(value.lines).forEach(line => {
      const existing = lineToIssue.get(line);
      
      if (!existing || existing.severity === 'minor') {
        lineToIssue.set(line, {
          message: operation.message,
          severity: 'major'  // Treat all unhandled exceptions as major
        });
      }
    });
  }
});

// Convert deduplicated issues to line references
lineToIssue.forEach((value, line) => {
  lineReferences.push({
    line,
    issue: value.message,
    severity: value.severity
  });
});

// Check for redundant loops or inefficient computations
const redundantComputationIssues = new Map<number, string>();

for (let i = 0; i < lines.length; i++) {
  const nextFewLines = lines.slice(i, i + 5).join('\n');
  
  // Check for nested loops with potential redundant computation
  if (/for\s*\([^)]+\)\s*{[^}]*for\s*\([^)]+\)/.test(nextFewLines) && !nextFewLines.includes('//')) {
    const inner
