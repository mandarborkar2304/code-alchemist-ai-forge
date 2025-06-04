import { MetricsResult, ScoreGrade, ReliabilityIssue } from '@/types';

// Constants for metric calculation and penalties - SonarQube aligned
const RUNTIME_CRITICAL_PENALTY = 20;  // Higher penalty for critical bugs
const EXCEPTION_HANDLING_PENALTY = 10; // Medium penalty for exception issues
const DEEP_NESTING_PENALTY = 5;        // Structural issue penalty
const READABILITY_PENALTY = 3;         // Code smells penalty
const REDUNDANT_LOGIC_PENALTY = 2;     // Minor code smell penalty

// SonarQube-aligned McCabe's Cyclomatic Complexity calculation
export const calculateCyclomaticComplexity = (code: string, language: string): number => {
  const lines = code.split("\n");
  let totalComplexity = 0;
  let currentFunctionComplexity = 0;
  let inFunction = false;
  let braceDepth = 0;
  let functionStartDepth = 0;
  let parenthesesDepth = 0;
  
  // Track nested contexts (functions, callbacks, etc.)
  const contextStack: { type: string, depth: number, complexity: number }[] = [];
  
  // Track function boundaries to calculate complexity per function
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const originalLine = lines[i]; // Keep original for indentation analysis
    
    // Skip empty lines and comments
    if (line.length === 0 || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      continue;
    }
    
    // Track brace and parentheses depth for nested contexts
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    
    braceDepth += openBraces - closeBraces;
    parenthesesDepth += openParens - closeParens;
    
    // Function start detection (SonarQube: each method starts with complexity 1)
    if (isFunctionDeclaration(line)) {
      // If we were already in a function, finalize the previous one
      if (inFunction) {
        totalComplexity += Math.max(1, currentFunctionComplexity);
      }
      
      // Skip getter/setter boilerplate and empty constructors
      if (isBoilerplateFunction(line, lines, i)) {
        inFunction = false;
        currentFunctionComplexity = 0;
        continue;
      }
      
      // Start new function with base complexity of 1
      inFunction = true;
      currentFunctionComplexity = 1;
      functionStartDepth = braceDepth;
      continue;
    }
    
    // Detect nested function contexts (arrow functions, callbacks, lambdas)
    if (inFunction && isNestedFunctionContext(line)) {
      contextStack.push({
        type: 'nested_function',
        depth: braceDepth,
        complexity: 1 // Nested functions start with complexity 1
      });
    }
    
    // Function end detection
    if (inFunction && braceDepth <= functionStartDepth && closeBraces > 0) {
      // Add any remaining nested context complexity
      while (contextStack.length > 0) {
        const context = contextStack.pop()!;
        currentFunctionComplexity += context.complexity;
      }
      
      totalComplexity += Math.max(1, currentFunctionComplexity);
      inFunction = false;
      currentFunctionComplexity = 0;
      continue;
    }
    
    // Only count complexity within functions
    if (!inFunction) {
      continue;
    }
    
    // Calculate line complexity with comprehensive SonarQube rules - NOW WITH LANGUAGE PARAMETER
    let lineComplexity = calculateLineComplexity(line, lines, i, language);
    
    // Add complexity to current context (main function or nested)
    if (contextStack.length > 0) {
      contextStack[contextStack.length - 1].complexity += lineComplexity;
    } else {
      currentFunctionComplexity += lineComplexity;
    }
    
    // Handle nested context closures
    if (closeBraces > 0 && contextStack.length > 0) {
      const currentContext = contextStack[contextStack.length - 1];
      if (braceDepth <= currentContext.depth) {
        const context = contextStack.pop()!;
        // Add nested context complexity to parent
        if (contextStack.length > 0) {
          contextStack[contextStack.length - 1].complexity += context.complexity;
        } else {
          currentFunctionComplexity += context.complexity;
        }
      }
    }
  }
  
  // Handle case where file ends while still in a function
  if (inFunction) {
    // Add any remaining nested context complexity
    while (contextStack.length > 0) {
      const context = contextStack.pop()!;
      currentFunctionComplexity += context.complexity;
    }
    totalComplexity += Math.max(1, currentFunctionComplexity);
  }
  
  // If no functions detected, treat entire file as one unit with base complexity 1
  return totalComplexity || 1;
};

// Comprehensive line complexity calculation following SonarQube rules
function calculateLineComplexity(line: string, lines: string[], currentIndex: number, language: string): number {
  let lineComplexity = 0;
  
  // 1. Conditional statements (+1 each)
  lineComplexity += countMatches(line, /\bif\s*\(/g);
  lineComplexity += countMatches(line, /\belse\s+if\s*\(/g);
  lineComplexity += countMatches(line, /\belse\b/g);
  lineComplexity += countMatches(line, /\bfor\s*\(/g);
  lineComplexity += countMatches(line, /\bwhile\s*\(/g);
  lineComplexity += countMatches(line, /\bdo\s*{/g);
  
  // 2. Exception handling (+1 each)
  lineComplexity += countMatches(line, /\bcatch\s*\(/g);
  lineComplexity += countMatches(line, /\bthrow\b/g);
  
  // 3. Switch cases (+1 for each case/default that leads to distinct path)
  lineComplexity += countMatches(line, /\bcase\s+/g);
  lineComplexity += countMatches(line, /\bdefault\s*:/g);
  
  // 4. Loop control statements (+1 each when in loops)
  if (isInLoop(lines, currentIndex)) {
    lineComplexity += countMatches(line, /\bcontinue\s*;/g);
    lineComplexity += countMatches(line, /\bbreak\s*;/g);
  }
  
  // 5. Return statements with conditions (+1 each)
  lineComplexity += countConditionalReturns(line);
  
  // 6. Logical operators in conditions (+1 each)
  lineComplexity += countLogicalOperators(line);
  
  // 7. Ternary operators (+1 each)
  lineComplexity += countTernaryOperators(line);
  
  // 8. Short-circuiting conditions (&&, || outside of if conditions)
  lineComplexity += countShortCircuitOperators(line);
  
  // 9. JSX conditional rendering (React specific)
  if (['javascript', 'typescript', 'jsx', 'tsx'].includes(language?.toLowerCase() || '')) {
    lineComplexity += countJSXConditionals(line);
  }
  
  // 10. Embedded callbacks with control flow (.map, .filter, .reduce, etc.)
  lineComplexity += countCallbackComplexity(line);
  
  // 11. Lambda/Arrow function control flows
  lineComplexity += countLambdaComplexity(line);
  
  return lineComplexity;
}

// Helper function to count regex matches
function countMatches(str: string, regex: RegExp): number {
  const matches = str.match(regex);
  return matches ? matches.length : 0;
}

// Enhanced function declaration detection
function isFunctionDeclaration(line: string): boolean {
  return /function\s+\w+\s*\(/.test(line) ||
         /\w+\s*=\s*function\s*\(/.test(line) ||
         /\w+\s*:\s*function\s*\(/.test(line) ||
         /\w+\s*\([^)]*\)\s*{/.test(line) ||
         /\w+\s*=\s*\([^)]*\)\s*=>/.test(line) ||
         /\w+\s*=>\s*{/.test(line) ||
         /constructor\s*\(/.test(line) ||
         /(?:public|private|protected|static)?\s*\w+\s*\([^)]*\)\s*{/.test(line) ||
         /(?:async\s+)?(?:public|private|protected|static)?\s*\w+\s*\([^)]*\)\s*{/.test(line);
}

// Detect nested function contexts (callbacks, arrow functions, etc.)
function isNestedFunctionContext(line: string): boolean {
  return /=>\s*{/.test(line) ||
         /function\s*\([^)]*\)\s*{/.test(line) ||
         /\.\s*(?:map|filter|reduce|forEach|find|some|every|sort)\s*\([^)]*(?:=|function)/.test(line);
}

// Check if function is boilerplate (getter/setter/empty constructor)
function isBoilerplateFunction(line: string, lines: string[], startIndex: number): boolean {
  // Getter/setter patterns
  if (/\b(?:get|set)\s+\w+\s*\(/.test(line)) {
    return true;
  }
  
  // Empty constructor detection
  if (/constructor\s*\(/.test(line)) {
    // Look ahead to see if constructor body is empty or just super() call
    let braceCount = 0;
    let hasContent = false;
    
    for (let i = startIndex; i < Math.min(startIndex + 10, lines.length); i++) {
      const checkLine = lines[i].trim();
      braceCount += (checkLine.match(/{/g) || []).length;
      braceCount -= (checkLine.match(/}/g) || []).length;
      
      // Check for actual content (not just super() or this())
      if (braceCount > 0 && checkLine.length > 0 && 
          !checkLine.includes('{') && !checkLine.includes('}') &&
          !/^\s*(?:super|this)\s*\([^)]*\)\s*;?\s*$/.test(checkLine)) {
        hasContent = true;
        break;
      }
      
      if (braceCount === 0 && checkLine.includes('}')) {
        break;
      }
    }
    
    return !hasContent;
  }
  
  return false;
}

// Check if current line is within a loop context
function isInLoop(lines: string[], currentIndex: number): boolean {
  let loopDepth = 0;
  let braceDepth = 0;
  
  // Look backwards to find loop context
  for (let i = currentIndex - 1; i >= 0; i--) {
    const line = lines[i].trim();
    
    // Count braces to track scope
    braceDepth += (line.match(/}/g) || []).length;
    braceDepth -= (line.match(/{/g) || []).length;
    
    // If we've gone back beyond current scope, stop
    if (braceDepth > 0) {
      break;
    }
    
    // Check for loop keywords
    if (/\b(?:for|while|do)\b/.test(line) && line.includes('{')) {
      loopDepth++;
    }
  }
  
  return loopDepth > 0;
}

// Enhanced conditional return detection
function countConditionalReturns(line: string): number {
  let count = 0;
  
  // Return with ternary operator
  if (/\breturn\b/.test(line) && /\?[^:]*:/.test(line)) {
    count++;
  }
  
  // Return with logical operators
  if (/\breturn\b/.test(line) && /(&&|\|\|)/.test(line)) {
    count++;
  }
  
  // Early returns in conditions (guard clauses)
  if (/\breturn\b/.test(line) && /\b(?:if|when|unless)\b/.test(line)) {
    count++;
  }
  
  return count;
}

// Enhanced logical operators counting with context awareness
function countLogicalOperators(line: string): number {
  let count = 0;
  let inString = false;
  let stringChar = '';
  let inComment = false;
  
  for (let i = 0; i < line.length - 1; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    // Skip if in comment
    if (char === '/' && nextChar === '/') {
      inComment = true;
      break;
    }
    
    if (inComment) continue;
    
    // Track string boundaries
    if ((char === '"' || char === "'" || char === '`') && line[i - 1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }
    
    // Count logical operators outside strings
    if (!inString) {
      if ((char === '&' && nextChar === '&') || (char === '|' && nextChar === '|')) {
        count++;
        i++; // Skip next character since we processed the pair
      }
    }
  }
  
  return count;
}

// Enhanced ternary operator counting
function countTernaryOperators(line: string): number {
  let count = 0;
  let inString = false;
  let stringChar = '';
  let questionMarks = 0;
  let colons = 0;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    // Track string boundaries
    if ((char === '"' || char === "'" || char === '`') && line[i - 1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }
    
    // Count ternary operators outside strings
    if (!inString) {
      if (char === '?') {
        questionMarks++;
      } else if (char === ':' && questionMarks > colons) {
        colons++;
        count++; // Complete ternary operator found
      }
    }
  }
  
  return count;
}

// Count short-circuiting operators that create complexity
function countShortCircuitOperators(line: string): number {
  // Only count logical operators that are not part of if/while/for conditions
  if (/\b(?:if|while|for)\s*\(/.test(line)) {
    return 0; // These are already counted in conditional statements
  }
  
  // Count standalone logical operators (assignment, return values, etc.)
  return countLogicalOperators(line);
}

// Count JSX conditional rendering complexity
function countJSXConditionals(line: string): number {
  let count = 0;
  
  // JSX conditional rendering patterns
  count += countMatches(line, /{[^}]*\?[^}]*:[^}]*}/g); // {condition ? a : b}
  count += countMatches(line, /{[^}]*&&[^}]*}/g);       // {condition && element}
  count += countMatches(line, /{[^}]*\|\|[^}]*}/g);     // {condition || fallback}
  
  return count;
}

// Count complexity in embedded callbacks
function countCallbackComplexity(line: string): number {
  let count = 0;
  
  // Array methods with callbacks that can contain control flow
  const callbackMethods = [
    'map', 'filter', 'reduce', 'forEach', 'find', 'findIndex',
    'some', 'every', 'sort', 'reduceRight'
  ];
  
  callbackMethods.forEach(method => {
    const methodRegex = new RegExp(`\\.${method}\\s*\\([^)]*(?:=>|function)`, 'g');
    if (methodRegex.test(line)) {
      // Each callback method with control flow adds complexity
      count++;
      
      // Additional complexity for control structures within callbacks
      if (/\?|\|\||&&|if|for|while/.test(line)) {
        count++;
      }
    }
  });
  
  return count;
}

// Count lambda/arrow function complexity
function countLambdaComplexity(line: string): number {
  let count = 0;
  
  // Arrow functions with control flow
  if (/=>\s*{/.test(line) || /=>\s*\(/.test(line)) {
    // Base complexity for arrow function
    count++;
    
    // Additional complexity for control structures in arrow functions
    if (/\?|\|\||&&|if|return/.test(line)) {
      count++;
    }
  }
  
  // Inline arrow functions with ternary or logical operators
  if (/=>\s*[^{]/.test(line) && (/\?|\|\||&&/.test(line))) {
    count++;
  }
  
  return count;
}

// Calculate maintainability using a formula similar to Maintainability Index with SonarQube calibration
export const calculateMaintainability = (code: string, language: string): number => {
  let baseScore = 100;  // Start with perfect score
  const lines = code.split("\n");
  
  // Calculate Halstead Volume approximation
  const halsteadMetrics = calculateHalsteadMetrics(code);
  
  // Count logical lines of code (non-empty, non-comment)
  const codeLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && 
           !trimmed.startsWith("//") && 
           !trimmed.startsWith("*") &&
           !trimmed.startsWith("/*");
  }).length;
  
  // Function size analysis
  const functionInfo = analyzeFunctionSizes(code, language);
  const avgFunctionLength = functionInfo.avgSize;
  const maxFunctionSize = functionInfo.maxSize;
  
  // Calculate nesting depth
  const maxNestingDepth = calculateMaxNestingDepth(code);
  
  // Maintainability metrics with SonarQube-aligned thresholds
  
  // 1. Size penalties
  if (codeLines > 1000) baseScore -= 15; 
  else if (codeLines > 500) baseScore -= 10;
  else if (codeLines > 250) baseScore -= 5;
  
  // 2. Function size penalties
  if (maxFunctionSize > 100) baseScore -= 15;  // SonarQube critical threshold
  else if (maxFunctionSize > 60) baseScore -= 10; // SonarQube major threshold
  else if (maxFunctionSize > 30) baseScore -= 5;  // SonarQube minor threshold
  
  // 3. Nesting depth penalties
  if (maxNestingDepth > 5) baseScore -= 15;  // SonarQube critical threshold
  else if (maxNestingDepth > 4) baseScore -= 10; // SonarQube major threshold
  else if (maxNestingDepth > 3) baseScore -= 5;  // SonarQube minor threshold
  
  // 4. Comment density (prefer quality over quantity)
  const commentLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith("//") || 
           trimmed.startsWith("*") ||
           trimmed.startsWith("/*");
  }).length;
  
  const commentRatio = codeLines > 0 ? commentLines / codeLines : 0;
  
  // SonarQube-like approach to comment coverage
  if (commentRatio < 0.05 && codeLines > 100) baseScore -= 5;
  
  // 5. Halstead volume penalties
  if (halsteadMetrics.volume > 8000) baseScore -= 10;  // Very high complexity
  else if (halsteadMetrics.volume > 4000) baseScore -= 5; // High complexity
  
  // 6. Cyclomatic complexity contribution to maintainability
  const complexityScore = calculateCyclomaticComplexity(code, language);
  if (complexityScore > 30) baseScore -= 15;
  else if (complexityScore > 20) baseScore -= 10;
  else if (complexityScore > 10) baseScore -= 5;
  
  // 7. Code duplication penalties
  const codeRepetitionPenalty = calculateCodeRepetitionPenalty(code, language);
  baseScore -= codeRepetitionPenalty;
  
  // 8. Variable naming quality
  const namingPenalty = calculateNamingQualityPenalty(code, language);
  baseScore -= namingPenalty;
  
  // Ensure score is within bounds
  return Math.max(0, Math.min(100, baseScore));
};

// Helper function to calculate an approximation of Halstead metrics
const calculateHalsteadMetrics = (code: string): { volume: number } => {
  // Count operators and operands
  const operatorPatterns = [
    /[+\-*/%=&|^<>!~?:]/g,  // Basic operators
    /\+\+|--|&&|\|\||\+=|-=|\*=|\/=|%=|<<=|>>=|&=|\|=|\^=/g, // Compound operators
    /for|if|while|do|switch|return|throw|try|catch|new|delete|typeof|instanceof|void|yield|await/g // Keywords as operators
  ];
  
  let operators = 0;
  operatorPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) operators += matches.length;
  });
  
  // Approximate operands (variables, literals, etc.)
  const operandPatterns = [
    /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g,  // Identifiers
    /\b\d+(\.\d+)?\b/g,  // Number literals
    /"([^"\\]|\\[^"])*"|'([^'\\]|\\[^'])*'|`([^`\\]|\\[^`])*`/g  // String literals
  ];
  
  let operands = 0;
  operandPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) operands += matches.length;
  });
  
  const n1 = Math.max(1, operators); // number of unique operators
  const n2 = Math.max(1, operands);  // number of unique operands
  const N1 = operators;              // total operators
  const N2 = operands;               // total operands
  
  // Calculate Halstead volume: (N1 + N2) * log2(n1 + n2)
  const volume = (N1 + N2) * Math.log2(n1 + n2);
  
  return { volume };
};

// Helper to analyze function sizes
const analyzeFunctionSizes = (code: string, language: string): { avgSize: number, maxSize: number } => {
  const lines = code.split('\n');
  const functionRanges: { start: number, end: number }[] = [];
  
  let inFunction = false;
  let functionStart = 0;
  let braceCount = 0;
  
  // Simple function detection heuristic
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Function start detection
    if (!inFunction && 
        (line.match(/function\s+\w+\s*\(/) || 
         line.match(/\w+\s*=\s*function\s*\(/) ||
         line.match(/\w+\s*:\s*function\s*\(/) ||
         line.match(/\w+\s*\([^)]*\)\s*{/) ||
         line.match(/\w+\s*=\s*\([^)]*\)\s*=>/) ||
         line.match(/\w+\s*=>\s*{/))) {
      inFunction = true;
      functionStart = i;
      braceCount = 0;
    }
    
    // Count braces to track function body
    if (inFunction) {
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      // Function end detection
      if (braceCount === 0 && line.includes('}')) {
        functionRanges.push({ start: functionStart, end: i });
        inFunction = false;
      }
    }
  }
  
  // Calculate function sizes
  const functionSizes = functionRanges.map(range => range.end - range.start + 1);
  const totalFunctionLines = functionSizes.reduce((sum, size) => sum + size, 0);
  const maxSize = functionSizes.length > 0 ? Math.max(...functionSizes) : 0;
  const avgSize = functionSizes.length > 0 ? totalFunctionLines / functionSizes.length : 0;
  
  return { avgSize, maxSize };
};

// Calculate the maximum nesting depth
const calculateMaxNestingDepth = (code: string): number => {
  const lines = code.split('\n');
  let maxDepth = 0;
  let currentDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Count only control structure nesting, not all braces
    if (line.match(/\b(if|for|while|switch|catch)\b.*{/) || 
        (line.includes('{') && line.includes('function'))) {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } 
    else if (line.includes('}')) {
      // Only decrease depth if we're likely closing a control structure
      // This is a simplification; a real parser would be more accurate
      if (currentDepth > 0 && !line.match(/{.*}/)) {
        currentDepth--;
      }
    }
  }
  
  return maxDepth;
};

// Calculate code repetition penalty (simplified duplication analysis)
const calculateCodeRepetitionPenalty = (code: string, language: string): number => {
  let penalty = 0;
  const lines = code.split('\n');
  
  // Check for repeated blocks with at least 5 lines
  const blockSize = 5;
  const blocks = new Map<string, number>();
  
  for (let i = 0; i <= lines.length - blockSize; i++) {
    const block = lines.slice(i, i + blockSize).join('\n').trim();
    if (block.length > 30) { // Ignore trivial blocks
      blocks.set(block, (blocks.get(block) || 0) + 1);
    }
  }
  
  // Calculate duplication penalty
  let duplicationRate = 0;
  let duplicatedLines = 0;
  
  blocks.forEach((count, block) => {
    if (count > 1) {
      // Count duplicated lines (minus 1 for the first occurrence)
      const linesInBlock = block.split('\n').length;
      duplicatedLines += linesInBlock * (count - 1);
    }
  });
  
  // Calculate duplication percentage
  duplicationRate = lines.length > 0 ? (duplicatedLines / lines.length) * 100 : 0;
  
  // SonarQube-aligned duplication penalties
  if (duplicationRate > 20) penalty += 15;  // Critical duplication
  else if (duplicationRate > 10) penalty += 10; // Significant duplication
  else if (duplicationRate > 5) penalty += 5;   // Moderate duplication
  
  return penalty;
};

// Calculate naming quality penalties
const calculateNamingQualityPenalty = (code: string, language: string): number => {
  let penalty = 0;
  
  // Count single-letter variables (excluding common loop counters)
  const singleLetterVars = countSingleLetterVariables(code, language);
  
  // Count inconsistent naming conventions
  const namingInconsistencies = detectNamingInconsistencies(code, language);
  
  // Apply penalties based on SonarQube-like rules
  if (singleLetterVars.count > 8) penalty += 5;
  else if (singleLetterVars.count > 4) penalty += 3;
  else if (singleLetterVars.count > 2) penalty += 1;
  
  if (namingInconsistencies > 5) penalty += 5;
  else if (namingInconsistencies > 2) penalty += 3;
  else if (namingInconsistencies > 0) penalty += 1;
  
  return penalty;
};

// Comprehensive reliability calculation aligned with SonarQube bug detection
export const calculateReliability = (code: string, language: string): { score: number, issues: ReliabilityIssue[] } => {
  let baseScore = 100;
  const reliabilityIssues: ReliabilityIssue[] = [];
  const lines = code.split('\n');
  
  // 1. Null pointer / undefined checks
  detectNullDereference(code, language).forEach(issue => {
    reliabilityIssues.push({
      type: 'critical',
      description: `Potential null/undefined reference at line ${issue.line}`,
      impact: RUNTIME_CRITICAL_PENALTY,
      category: 'runtime',
      line: issue.line
    });
    baseScore -= RUNTIME_CRITICAL_PENALTY;
  });
  
  // 2. Detect divide by zero
  lines.forEach((line, index) => {
    if (line.match(/\/\s*0/) || 
        (line.match(/\/\s*[a-zA-Z_][a-zA-Z0-9_]*\s*(?!\s*[!=><])/) && 
         !line.includes("!= 0") && !line.includes("!== 0") && 
         !line.includes("> 0"))) {
      reliabilityIssues.push({
        type: 'critical',
        description: 'Potential divide by zero',
        impact: RUNTIME_CRITICAL_PENALTY,
        category: 'runtime',
        line: index + 1
      });
      baseScore -= RUNTIME_CRITICAL_PENALTY;
    }
  });
  
  // 3. Unchecked array access
  const safeLoopVariables = extractSafeLoopVariables(code, language);
  const unsafeArrayAccesses = detectUnsafeArrayAccesses(code, language, safeLoopVariables);
  
  unsafeArrayAccesses.forEach(access => {
    reliabilityIssues.push({
      type: 'major',
      description: `Unchecked array access using ${access.indexVar}`,
      impact: RUNTIME_CRITICAL_PENALTY,
      category: 'runtime',
      line: access.line
    });
    baseScore -= RUNTIME_CRITICAL_PENALTY;
  });
  
  // 4. Detect resource leaks
  const resourceLeaks = detectResourceLeaks(code, language);
  resourceLeaks.forEach(leak => {
    reliabilityIssues.push({
      type: 'major',
      description: `Potential resource leak: ${leak.resource}`,
      impact: EXCEPTION_HANDLING_PENALTY,
      category: 'runtime',
      line: leak.line
    });
    baseScore -= EXCEPTION_HANDLING_PENALTY;
  });
  
  // 5. Improper exception handling
  if (hasRiskyOperations(code, language) && !hasAdequateErrorHandling(code, language)) {
    const riskyLines = findRiskyOperationLines(code, language);
    riskyLines.forEach(lineNum => {
      reliabilityIssues.push({
        type: 'major',
        description: `Risky operation without proper error handling`,
        impact: EXCEPTION_HANDLING_PENALTY,
        category: 'exception',
        line: lineNum
      });
    });
    baseScore -= EXCEPTION_HANDLING_PENALTY * Math.min(3, riskyLines.length);
  }
  
  // 6. Deep nesting
  const nestingDepth = calculateMaxNestingDepth(code);
  if (nestingDepth > 5) {
    reliabilityIssues.push({
      type: 'minor',
      description: `Excessive nesting depth of ${nestingDepth} levels`,
      impact: DEEP_NESTING_PENALTY,
      category: 'structure'
    });
    baseScore -= DEEP_NESTING_PENALTY;
  }
  
  // 7. Detect dead code and unreachable branches (simplified)
  const deadCodeIssues = detectDeadCode(code, language);
  deadCodeIssues.forEach(issue => {
    reliabilityIssues.push({
      type: 'minor',
      description: issue.description,
      impact: READABILITY_PENALTY,
      category: 'structure',
      line: issue.line
    });
    baseScore -= READABILITY_PENALTY;
  });
  
  // 8. Check for input validation
  if (hasUserInput(code, language) && !hasInputValidation(code, language)) {
    reliabilityIssues.push({
      type: 'major',
      description: 'User input without proper validation',
      impact: EXCEPTION_HANDLING_PENALTY,
      category: 'exception'
    });
    baseScore -= EXCEPTION_HANDLING_PENALTY;
  }
  
  // Ensure score doesn't go below 0
  return {
    score: Math.max(0, baseScore),
    issues: reliabilityIssues
  };
};

// Helper function to detect null/undefined dereferences
const detectNullDereference = (code: string, language: string): { line: number }[] => {
  const results: { line: number }[] = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    // Match patterns like obj.property without a preceding null check
    const matches = line.match(/(\w+)\.(\w+)/g);
    if (matches) {
      for (const match of matches) {
        const objectName = match.split('.')[0];
        
        // Check if this variable was checked for null/undefined in this or previous lines
        const wasChecked = lines.slice(0, index + 1).some(prevLine => 
          prevLine.includes(`${objectName} !==`) || 
          prevLine.includes(`${objectName} !=`) || 
          prevLine.includes(`typeof ${objectName}`) ||
          prevLine.includes(`if (${objectName})`) ||
          prevLine.includes(`if(!${objectName})`)
        );
        
        // Exclude console.log and common safe patterns
        const isSafePattern = 
          match.startsWith('console.') ||
          match.startsWith('Math.') || 
          match.startsWith('Object.') ||
          match.startsWith('Array.');
          
        if (!wasChecked && !isSafePattern && objectName !== 'this') {
          results.push({ line: index + 1 });
          break; // Only report one issue per line
        }
      }
    }
  });
  
  return results;
};

// Detect unsafe array accesses
const detectUnsafeArrayAccesses = (code: string, language: string, safeVariables: string[]): { indexVar: string, line: number }[] => {
  const results: { indexVar: string, line: number }[] = [];
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip array access in loop headers (typically safe)
    if (line.includes('for') && line.includes(';')) {
      continue;
    }
    
    // Find array access with variable index
    const arrayAccessMatches = line.match(/\w+\s*\[\s*(\w+)\s*\]/g);
    if (arrayAccessMatches) {
      for (const match of arrayAccessMatches) {
        const indexVarMatch = match.match(/\[\s*(\w+)\s*\]/);
        if (indexVarMatch && indexVarMatch[1]) {
          const indexVar = indexVarMatch[1];
          
          // Check if variable is used safely
          if (!safeVariables.includes(indexVar) && 
              !/^\d+$/.test(indexVar) && 
              !line.includes(`${indexVar} < `) && 
              !line.includes(`${indexVar} <= `) && 
              !line.includes('length') && 
              !line.includes('?.') && // Optional chaining
              !line.includes('||')) {  // Default value
            results.push({
              indexVar,
              line: i + 1
            });
          }
        }
      }
    }
  }
  
  return results;
};

// Extract variables that are safely bounded in loops
const extractSafeLoopVariables = (code: string, language: string): string[] => {
  const safeVars: string[] = [];
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('for')) {
      // Standard for loops with bounds check
      const forMatch = line.match(/for\s*\(\s*(?:let|var|const|int)\s+(\w+)\s*=.*?;\s*\1\s*<(?:=)?\s*(?:\w+|\w+\.\w+).*?;\s*\1\s*(?:\+\+|--|\+=)/);
      if (forMatch && forMatch[1]) {
        safeVars.push(forMatch[1]);
      }
      
      // For-of loops (safe for array access)
      const forOfMatch = line.match(/for\s*\(\s*(?:let|var|const)\s+(\w+)\s+of\s+(\w+)/);
      if (forOfMatch && forOfMatch[1]) {
        safeVars.push(forOfMatch[1]);
      }
      
      // For-in loops
      const forInMatch = line.match(/for\s*\(\s*(?:let|var|const)\s+(\w+)\s+in\s+(\w+)/);
      if (forInMatch && forInMatch[1]) {
        safeVars.push(forInMatch[1]);
      }
    }
  }
  
  return safeVars;
};

// Detect potential resource leaks
const detectResourceLeaks = (code: string, language: string): { resource: string, line: number }[] => {
  const results: { resource: string, line: number }[] = [];
  const lines = code.split('\n');
  
  // Resource creation patterns that may need explicit cleanup
  const resourcePatterns = [
    { regex: /new FileReader|new FileWriter|createReadStream|createWriteStream/, type: 'file handle' },
    { regex: /new Socket|createServer|connect\(/, type: 'network connection' },
    { regex: /new XMLHttpRequest|fetch\(/, type: 'HTTP connection' },
    { regex: /navigator\.getUserMedia|navigator\.mediaDevices\.getUserMedia/, type: 'media stream' }
  ];
  
  // Track resource variables
  const resourceVars: { name: string, type: string, line: number }[] = [];
  
  // Find resource creation
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    resourcePatterns.forEach(pattern => {
      if (pattern.regex.test(line)) {
        // Try to extract variable name
        const assignMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
        if (assignMatch && assignMatch[1]) {
          resourceVars.push({ 
            name: assignMatch[1],
            type: pattern.type, 
            line: i + 1 
          });
        } else {
          // Resource created but not stored in tracked variable
          results.push({
            resource: pattern.type,
            line: i + 1
          });
        }
      }
    });
  }
  
  // Check if resources are properly closed
  resourceVars.forEach(resource => {
    const isProperlyHandled = lines.some(line => 
      line.includes(`${resource.name}.close()`) ||
      line.includes(`${resource.name}.destroy()`) ||
      line.includes(`${resource.name}.dispose()`) ||
      line.includes(`${resource.name}.release()`) ||
      line.includes(`try`) && line.includes(`finally`) && line.includes(resource.name)
    );
    
    if (!isProperlyHandled) {
      results.push({
        resource: resource.type,
        line: resource.line
      });
    }
  });
  
  return results;
};

// Check if code has risky operations
const hasRiskyOperations = (code: string, language: string): boolean => {
  const riskyPatterns = [
    /\.parse\(/,                     // JSON.parse or similar
    /new FileReader|readFileSync/,   // File operations
    /fetch\(|axios\.|http\./,        // Network requests
    /localStorage\.|sessionStorage\./, // Browser storage
    /new Promise/,                   // Promise creation
    /\.catch\(/,                     // Existing catch suggests risk
    /throw\s+new\s+\w+/              // Explicit throws
  ];
  
  return riskyPatterns.some(pattern => pattern.test(code));
};

// Check if adequate error handling exists
const hasAdequateErrorHandling = (code: string, language: string): boolean => {
  // SonarQube-aligned error handling checks
  const hasTryCatch = code.includes('try') && code.includes('catch');
  
  // Error objects or promise rejections
  const hasErrorHandling = /\.catch\s*\(|throw\s+new\s+\w+|instanceof\s+Error/.test(code);
  
  // Explicit error return patterns
  const hasErrorReturns = /return\s+(?:null|undefined|false|err|\{.*?error|\{\s*success:\s*false)/.test(code);
  
  // Error logging
  const hasErrorLogging = /console\.error|logger\.error/.test(code);
  
  return hasTryCatch || (hasErrorHandling && (hasErrorReturns || hasErrorLogging));
};

// Find lines with risky operations
const findRiskyOperationLines = (code: string, language: string): number[] => {
  const results: number[] = [];
  const lines = code.split('\n');
  
  const riskyPatterns = [
    /\.parse\(/,
    /new FileReader|readFileSync/,
    /fetch\(|axios\.|http\./,
    /localStorage\.|sessionStorage\./,
    /new Promise/
  ];
  
  lines.forEach((line, index) => {
    if (riskyPatterns.some(pattern => pattern.test(line)) && 
        !line.includes('try') && 
        !line.includes('catch')) {
      results.push(index + 1);
    }
  });
  
  return results;
};

// Detect probable dead code segments
const detectDeadCode = (code: string, language: string): { description: string, line: number }[] => {
  const results: { description: string, line: number }[] = [];
  const lines = code.split('\n');
  
  // Pattern 1: Code after return/break/continue
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1].trim();
    
    if (line.match(/^\s*return\s+.*;$/) || 
        line === 'return;' || 
        line === 'break;' || 
        line === 'continue;') {
      
      // Check if next line is not a closing brace, comment, or empty
      if (nextLine !== '}' && 
          !nextLine.startsWith('//') && 
          !nextLine.startsWith('/*') &&
          nextLine !== '') {
        
        // Check indentation to ensure they're in the same block
        const currentIndent = lines[i].length - lines[i].trimLeft().length;
        const nextIndent = lines[i + 1].length - lines[i + 1].trimLeft().length;
        
        if (nextIndent >= currentIndent) {
          results.push({
            description: 'Unreachable code after control flow statement',
            line: i + 2  // +2 because we're reporting the line after return
          });
        }
      }
    }
  }
  
  // Pattern 2: Conditions that are always true/false
  lines.forEach((line, index) => {
    // Check for common patterns like if (true), if (false)
    if (line.includes('if (true)') || line.includes('if(true)')) {
      results.push({
        description: 'Condition is always true',
        line: index + 1
      });
    } else if (line.includes('if (false)') || line.includes('if(false)')) {
      results.push({
        description: 'Condition is always false - unreachable code',
        line: index + 1
      });
    }
    
    // Check for empty catch blocks
    if (line.includes('catch') && lines[index + 1] && lines[index + 1].trim() === '{}') {
      results.push({
        description: 'Empty catch block suppresses exceptions',
        line: index + 1
      });
    }
  });
  
  return results;
};

// Check for user input presence
const hasUserInput = (code: string, language: string): boolean => {
  const inputPatterns = [
    /(?:document|window)\.getElementById|querySelector|event\.|onChange|onClick/,
    /\.value|\.val\(\)|e\.target\.value/,
    /(?:req|request)\.(?:body|params|query)/,
    /process\.argv|prompt\(|readline|Scanner/
  ];
  
  return inputPatterns.some(pattern => pattern.test(code));
};

// Check for input validation
const hasInputValidation = (code: string, language: string): boolean => {
  const validationPatterns = [
    /(?:parseInt|parseFloat|Number)\s*\(/,
    /typeof\s+\w+\s*===?\s*["'](?:string|number|boolean)/,
    /\w+\s+instanceof\s+/,
    /\.\s*(?:match|test|exec)\s*\(/,
    /\.\s*(?:length|size)\s*[<>=]/,
    /if\s*\(\s*\w+\s*[<>=!]/,
    /Object\.prototype\.toString/,
    /\bissafeinteger\b|\bisnan\b|\bisfinite\b/i,
    /validate|sanitize|escape|check|isValid/
  ];
  
  return validationPatterns.some(pattern => pattern.test(code));
};

// Count single-letter variables
const countSingleLetterVariables = (code: string, language: string): { count: number, variables: { name: string, line: number }[] } => {
  const results: { name: string, line: number }[] = [];
  const lines = code.split('\n');
  
  // Common acceptable single-letter variables in loops
  const commonLoopVars = new Set(['i', 'j', 'k', 'n', 'x', 'y']);
  
  lines.forEach((line, index) => {
    // Different patterns based on language
    let match: RegExpMatchArray | null = null;
    
    if (['javascript', 'typescript'].includes(language.toLowerCase())) {
      match = line.match(/\b(?:let|const|var)\s+([a-zA-Z])(?![a-zA-Z0-9_])/);
    } else if (language.toLowerCase() === 'java') {
      match = line.match(/\b(?:int|float|double|char|String|long|short|boolean)\s+([a-zA-Z])(?![a-zA-Z0-9_])/);
    } else {
      // Generic fallback
      match = line.match(/\b(?:let|const|var|int|float|char|string)\s+([a-zA-Z])(?![a-zA-Z0-9_])/);
    }
    
    if (match && match[1]) {
      const varName = match[1];
      // Exclude common loop variables
      if (!commonLoopVars.has(varName)) {
        results.push({ name: varName, line: index + 1 });
      }
    }
  });
  
  return { count: results.length, variables: results };
};

// Detect naming inconsistencies
const detectNamingInconsistencies = (code: string, language: string): number => {
  const lines = code.split('\n');
  
  // Extract variable names
  const varNames: string[] = [];
  const funcNames: string[] = [];
  
  // Simple extraction - a real analyzer would use AST
  lines.forEach(line => {
    // Variable declarations
    const varMatches = line.match(/\b(?:let|const|var)\s+(\w+)/g);
    if (varMatches) {
      varMatches.forEach(match => {
        const name = match.replace(/\b(?:let|const|var)\s+/, '');
        varNames.push(name);
      });
    }
    
    // Function declarations
    const funcMatches = line.match(/function\s+(\w+)/g);
    if (funcMatches) {
      funcMatches.forEach(match => {
        const name = match.replace(/function\s+/, '');
        funcNames.push(name);
      });
    }
  });
  
  // Count inconsistencies
  let inconsistencies = 0;
  
  // Check for mixed camelCase and snake_case in variables
  const hasCamelCase = varNames.some(name => /[a-z][A-Z]/.test(name));
  const hasSnakeCase = varNames.some(name => name.includes('_'));
  
  if (hasCamelCase && hasSnakeCase) {
    inconsistencies++;
  }
  
  // Check for inconsistent function naming
  const hasCamelCaseFuncs = funcNames.some(name => /^[a-z]/.test(name) && /[a-z][A-Z]/.test(name));
  const hasPascalCaseFuncs = funcNames.some(name => /^[A-Z]/.test(name));
  
  if (hasCamelCaseFuncs && hasPascalCaseFuncs && funcNames.length > 2) {
    inconsistencies++;
  }
  
  return inconsistencies;
};

// Full code metrics calculation
export const getCodeMetrics = (code: string, language: string): MetricsResult => {
  const lines = code.split('\n');
  const codeLines = lines.filter(line => line.trim().length > 0).length;
  
  // Updated function count calculation
  const functionInfo = analyzeFunctionSizes(code, language);
  const avgFunctionLength = functionInfo.avgSize;
  
  const commentLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || 
           trimmed.startsWith('/*') ||
           trimmed.startsWith('*');
  }).length;
  
  const commentPercentage = (commentLines / Math.max(1, lines.length)) * 100;
  const maxNesting = calculateMaxNestingDepth(code);
  const complexityScore = calculateCyclomaticComplexity(code, language);
  
  return {
    linesOfCode: lines.length,
    codeLines,
    commentLines,
    commentPercentage,
    functionCount: Math.max(1, functionInfo.avgSize > 0 ? Math.round(codeLines / functionInfo.avgSize) : 1),
    averageFunctionLength: avgFunctionLength,
    maxNestingDepth: maxNesting,
    cyclomaticComplexity: complexityScore,
  };
};

// Helper function to convert score to letter grade
export const scoreToGrade = (score: number): ScoreGrade => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
};
