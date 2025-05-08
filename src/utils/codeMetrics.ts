
import { MetricsResult, ScoreGrade, ReliabilityIssue } from '@/types';

// Constants for metric calculation and penalties
const RUNTIME_CRITICAL_PENALTY = 5;
const EXCEPTION_HANDLING_PENALTY = 3;
const DEEP_NESTING_PENALTY = 3;
const READABILITY_PENALTY = 2;
const REDUNDANT_LOGIC_PENALTY = 1;

// Calculate cyclomatic complexity with clearer thresholds
export const calculateCyclomaticComplexity = (code: string, language: string): number => {
  // Calculate base complexity (1)
  let complexity = 1;

  // Count decision points
  const lines = code.split("\n");
  
  for (const line of lines) {
    // Count conditional statements
    if (line.includes("if ") || line.includes("else if") || 
        line.includes("? ") || line.includes("case ")) {
      complexity++;
    }
    
    // Count loops
    if (line.includes("for ") || line.includes("while ") || 
        line.includes("do {") || line.includes("forEach")) {
      complexity++;
    }
    
    // Count catch blocks
    if (line.includes("catch ")) {
      complexity++;
    }
    
    // Count logical operators (&&, ||) that create additional paths
    const logicalOps = (line.match(/&&|\|\|/g) || []).length;
    complexity += logicalOps;
  }
  
  return complexity;
};

// Calculate maintainability with improved balancing
export const calculateMaintainability = (code: string, language: string): number => {
  let baseScore = 100;
  const lines = code.split("\n");
  
  // Count meaningful code lines (non-empty, non-comment)
  const codeLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && 
           !trimmed.startsWith("//") && 
           !trimmed.startsWith("*") &&
           !trimmed.startsWith("/*");
  }).length;
  
  // Logic size penalty (reduced from previous version)
  if (codeLines > 200) baseScore -= 5;
  else if (codeLines > 100) baseScore -= 3;
  else if (codeLines > 50) baseScore -= 1;
  
  // Gather metrics for normalization
  const functionsCount = countFunctions(code, language);
  const logicalBlocks = Math.max(1, countLogicalBlocks(code)); // Avoid division by zero
  
  // Function length penalties
  const avgFunctionLength = functionsCount > 0 ? codeLines / functionsCount : codeLines;
  if (avgFunctionLength > 50) baseScore -= 5;
  else if (avgFunctionLength > 30) baseScore -= 3;
  else if (avgFunctionLength > 20) baseScore -= 1;
  
  // Nesting depth penalties (reduced)
  const maxNestingDepth = calculateMaxNestingDepth(code);
  if (maxNestingDepth > 5) baseScore -= 3;
  else if (maxNestingDepth > 3) baseScore -= 2;
  else if (maxNestingDepth > 2) baseScore -= 1;
  
  // Comment density penalties (more lenient)
  const commentLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith("//") || 
           trimmed.startsWith("*") ||
           trimmed.startsWith("/*");
  }).length;
  
  const commentRatio = codeLines > 0 ? commentLines / codeLines : 0;
  if (commentRatio < 0.05) baseScore -= 2;
  else if (commentRatio < 0.1) baseScore -= 1;
  
  // Magic number penalties (only if exceeding threshold)
  const magicNumbers = findMagicNumbers(code);
  if (magicNumbers.length > 5) baseScore -= Math.min(3, Math.floor(magicNumbers.length / 5));
  
  // Single-letter variable penalties (only if exceeding threshold)
  const singleLetterVarCount = countSingleLetterVariables(code, language);
  if (singleLetterVarCount.count > 3) baseScore -= Math.min(2, Math.floor(singleLetterVarCount.count / 3));
  
  // Normalize penalties by code size
  const normalizedScore = baseScore + (10 - Math.min(10, Math.max(0, (100 - baseScore) / logicalBlocks)));
  
  // Ensure score is within bounds
  return Math.max(0, Math.min(100, normalizedScore));
};

// Completely revised reliability calculation with specific penalties
export const calculateReliability = (code: string, language: string): { score: number, issues: ReliabilityIssue[] } => {
  let baseScore = 100;
  const lines = code.split('\n');
  const reliabilityIssues: ReliabilityIssue[] = [];
  
  // Detect critical runtime issues
  
  // 1. Check for potential divide-by-zero
  lines.forEach((line, index) => {
    if (line.match(/\/\s*0/) || line.match(/\/\s*[a-zA-Z_][a-zA-Z0-9_]*\s*(?!\s*[!=><])/) && !line.includes("!= 0") && !line.includes("!== 0")) {
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
  
  // 2. Check for unchecked array access
  const safeLoopVariables = extractSafeLoopVariables(code, language);
  const unsafeAccesses = findUnsafeArrayAccesses(code, language, safeLoopVariables);
  
  unsafeAccesses.forEach(access => {
    reliabilityIssues.push({
      type: 'critical',
      description: `Unchecked array access using ${access.indexVar} at line ${access.line}`,
      impact: RUNTIME_CRITICAL_PENALTY,
      category: 'runtime',
      line: access.line
    });
    baseScore -= RUNTIME_CRITICAL_PENALTY;
  });
  
  // 3. Check for uncaught exceptions in risky operations
  if (hasRiskyOperations(code, language) && !hasAppropriateErrorHandling(code, language)) {
    const riskyLines = findRiskyOperationLines(code, language);
    riskyLines.forEach(lineNum => {
      reliabilityIssues.push({
        type: 'major',
        description: `Risky operation without proper error handling at line ${lineNum}`,
        impact: EXCEPTION_HANDLING_PENALTY,
        category: 'exception',
        line: lineNum
      });
    });
    baseScore -= EXCEPTION_HANDLING_PENALTY * Math.min(3, riskyLines.length); // Cap the penalty
  }
  
  // 4. Check for deep nesting
  const nestingDepth = calculateMaxNestingDepth(code);
  if (nestingDepth > 5) {
    reliabilityIssues.push({
      type: 'major',
      description: `Excessive nesting depth of ${nestingDepth} levels`,
      impact: DEEP_NESTING_PENALTY,
      category: 'structure'
    });
    baseScore -= DEEP_NESTING_PENALTY;
  }
  
  // 5. Check for magic numbers
  const magicNumbers = findMagicNumbers(code);
  if (magicNumbers.length > 0) {
    reliabilityIssues.push({
      type: 'minor',
      description: `${magicNumbers.length} magic numbers found`,
      impact: READABILITY_PENALTY,
      category: 'readability'
    });
    baseScore -= Math.min(READABILITY_PENALTY, Math.floor(magicNumbers.length / 3));
  }
  
  // 6. Check for redundant logic
  const redundantPatterns = findRedundantPatterns(code, language);
  redundantPatterns.forEach(pattern => {
    reliabilityIssues.push({
      type: 'minor',
      description: pattern.description,
      impact: REDUNDANT_LOGIC_PENALTY,
      category: 'structure',
      line: pattern.line
    });
    baseScore -= REDUNDANT_LOGIC_PENALTY;
  });
  
  // 7. Check for missing input validation
  if (hasUserInput(code, language) && !hasInputValidation(code, language)) {
    reliabilityIssues.push({
      type: 'major',
      description: 'User input without proper validation',
      impact: EXCEPTION_HANDLING_PENALTY,
      category: 'exception'
    });
    baseScore -= EXCEPTION_HANDLING_PENALTY;
  }

  // 8. Check for single-letter variable names
  const singleLetterVariables = countSingleLetterVariables(code, language);
    if (singleLetterVariables.variables.length > 0) {
      singleLetterVariables.variables.forEach(variable => {
      reliabilityIssues.push({
        type: 'minor',
        description: `Single-letter variable '${variable.name}' found at line ${variable.line}`,
        impact: READABILITY_PENALTY,  
        category: 'readability',
        line: variable.line
      });
      baseScore -= READABILITY_PENALTY;
    });
  }

  
  // Cumulative effect for multiple issues
  if (reliabilityIssues.length > 3) {
    const additionalPenalty = Math.min(10, Math.floor(reliabilityIssues.length / 2));
    baseScore -= additionalPenalty;
  }
  
  // Ensure the score doesn't go below 0
  const finalScore = Math.max(0, baseScore);
  
  return { 
    score: finalScore,
    issues: reliabilityIssues
  };
};

// Get code metrics with updated properties
export const getCodeMetrics = (code: string, language: string): MetricsResult => {
  const lines = code.split('\n');
  const codeLines = lines.filter(line => line.trim().length > 0).length;
  
  const functionCount = countFunctions(code, language);
  const avgFunctionLength = functionCount > 0 ? 
    lines.length / functionCount : lines.length;
  
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
    functionCount,
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

// Helper functions for reliability assessment

// Count functions in code
const countFunctions = (code: string, language: string): number => {
  const lines = code.split('\n');
  let count = 0;
  
  for (const line of lines) {
    // Match function declarations based on language
    if (language === 'java') {
      if (/(?:public|private|protected)(?:\s+static)?\s+\w+\s+\w+\s*\([^)]*\)\s*\{/.test(line)) {
        count++;
      }
    } else {
      // JavaScript/TypeScript function detection
      if (/function\s+\w+\s*\(/.test(line) || 
          /const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/.test(line) ||
          /^\s*\w+\s*\([^)]*\)\s*\{/.test(line)) {
        count++;
      }
    }
  }
  
  return Math.max(1, count); // At least 1 function
};

// Count logical blocks (if, for, while, etc.)
const countLogicalBlocks = (code: string): number => {
  const blockMatches = code.match(/if\s*\(|for\s*\(|while\s*\(|switch\s*\(|case\s+|else\s*\{|try\s*\{|catch\s*\(/g);
  return blockMatches ? blockMatches.length : 1; // At least 1 block
};

// Calculate maximum nesting depth
const calculateMaxNestingDepth = (code: string): number => {
  const lines = code.split('\n');
  let maxDepth = 0;
  let currentDepth = 0;
  
  for (const line of lines) {
    const openBraces = (line.match(/{/g) || []).length;
    const closingBraces = (line.match(/}/g) || []).length;
    
    currentDepth += openBraces - closingBraces;
    maxDepth = Math.max(maxDepth, currentDepth);
  }
  
  return maxDepth;
};

// Find magic numbers (non-standard hardcoded literals)
const findMagicNumbers = (code: string): { value: string, line: number }[] => {
  const results: { value: string, line: number }[] = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    // Exclude common safe numbers like 0, 1, 2 and numbers in strings
    const magicNumberMatches = line.match(/(?<!\w|\.|-|"|'|`)\s*-?[3-9]\d*(?!\w|\.|-|"|'|`)/g);
    
    // Exclude numbers in variable declarations, array indices, and common patterns
    if (magicNumberMatches && 
        !line.includes('for') && 
        !line.includes('case') && 
        !line.includes('const') && 
        !line.includes('=')) {
      magicNumberMatches.forEach(match => {
        results.push({
          value: match.trim(),
          line: index + 1
        });
      });
    }
  });
  
  return results;
};

// Count single-letter variable declarations, tuned per language
const countSingleLetterVariables = (code: string, language: string): { count: number, variables: { name: string, line: number }[] } => {
  const results: { name: string, line: number }[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    let match: RegExpMatchArray[] = [];

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        match = [...line.matchAll(/\b(?:let|const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|;|\s)/g)];
        break;

      case 'java':
        match = [...line.matchAll(/\b(?:int|float|double|char|String|long|short|boolean)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|;|\s)/g)];
        break;

      case 'c':
      case 'c++':
        match = [...line.matchAll(/\b(?:int|float|double|char|long|short|unsigned|signed|void)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|;|\s)/g)];
        break;

      case 'python':
        // Avoid matches in function definitions, loops, imports, and class definitions
        if (!/^\s*(def|class|for|while|if|elif|else|try|except|import|from)\b/.test(line)) {
          match = [...line.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*[^=]/g)];
        }
        break;

      default:
        // Generic fallback (assumes common `let`, `var`, or `type name =`)
        match = [...line.matchAll(/\b(?:let|const|var|int|float|char|string)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g)];
        break;
    }

    match.forEach(m => {
      const variableName = m[1];
      if (variableName.length === 1 && /^[a-zA-Z_]$/.test(variableName)) {
        results.push({ name: variableName, line: index + 1 });
      }
    });
  });

  return { count: results.length, variables: results };
};



// Extract variables that are safely bounded in loops
const extractSafeLoopVariables = (code: string, language: string): string[] => {
  const safeVars: string[] = [];
  const lines = code.split('\n');
  
  // Extract bounded loop indices
  for (const line of lines) {
    if (line.includes('for')) {
      // Regular for loops with explicit bounds
      const forMatch = line.match(/for\s*\(\s*(?:let|var|const|int)\s+(\w+)\s*=.*?;\s*\1\s*<(?:=)?\s*(?:\w+).*?;\s*\1\s*(?:\+\+|--|\+=)/);
      if (forMatch && forMatch[1]) {
        safeVars.push(forMatch[1]);
      }
      
      // For-of loops are safe for array access
      const forOfMatch = line.match(/for\s*\(\s*(?:let|var|const|int)\s+(\w+)\s+of\s+(\w+)/);
      if (forOfMatch && forOfMatch[1]) {
        safeVars.push(forOfMatch[1]);
      }
    }
  }
  
  return safeVars;
};

// Find unsafe array accesses
const findUnsafeArrayAccesses = (code: string, language: string, safeVariables: string[]): { indexVar: string, line: number }[] => {
  const results: { indexVar: string, line: number }[] = [];
  const lines = code.split('\n');
  
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    // Skip array access within loop headers, which is generally safe
    if (line.includes('for') && line.includes(';')) {
      continue;
    }
    
    // Match array accesses with variable index
    const arrayAccessMatches = line.match(/\w+\s*\[\s*(\w+)\s*\]/g);
    if (arrayAccessMatches) {
      for (const match of arrayAccessMatches) {
        const indexVarMatch = match.match(/\[\s*(\w+)\s*\]/);
        if (indexVarMatch && indexVarMatch[1]) {
          const indexVar = indexVarMatch[1];
          // Only count as unsafe if not a safe loop variable, not a number literal,
          // and not checked with bounds validation in the same line
          if (!safeVariables.includes(indexVar) && 
              !/^\d+$/.test(indexVar) &&
              !line.includes(`${indexVar} < `) &&
              !line.includes(`${indexVar} <= `) &&
              !line.includes('length')) {
            results.push({
              indexVar,
              line: index + 1
            });
          }
        }
      }
    }
  }
  
  return results;
};

// Check if code has risky operations
const hasRiskyOperations = (code: string, language: string): boolean => {
  const riskyPatterns = [
    /\.parse\(/, // JSON.parse or similar
    /new FileReader|new Scanner/, // File operations
    /fetch\(|axios\.|http\./, // Network requests
    /\/\s*[a-zA-Z_][a-zA-Z0-9_]*\s*(?!\s*[!=><])/, // Division by variable without zero check
    /throw\s+new\s+\w+/, // Explicit throws
    /\.substring\(\s*\d+\s*\)|\.charAt\(\s*\d+\s*\)/ // String operations without bounds check
  ];
  
  return riskyPatterns.some(pattern => pattern.test(code));
};

// Find lines with risky operations
const findRiskyOperationLines = (code: string, language: string): number[] => {
  const results: number[] = [];
  const lines = code.split('\n');
  
  const riskyPatterns = [
    /\.parse\(/,
    /new FileReader|new Scanner/,
    /fetch\(|axios\.|http\./,
    /\/\s*[a-zA-Z_][a-zA-Z0-9_]*\s*(?!\s*[!=><])/,
    /throw\s+new\s+\w+/,
    /\.substring\(\s*\d+\s*\)|\.charAt\(\s*\d+\s*\)/
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

// Check for appropriate error handling
const hasAppropriateErrorHandling = (code: string, language: string): boolean => {
  // Check if there are try-catch blocks
  const hasTryCatch = code.includes('try') && code.includes('catch');
  
  // Check if there are error objects being thrown
  const hasErrorThrows = /throw\s+new\s+\w+/.test(code);
  
  // Check for error return patterns
  const hasErrorReturnPattern = /return\s+(?:null|undefined|false|err|\{.*?error|\{\s*success:\s*false)/.test(code);
  
  return hasTryCatch || (hasErrorThrows && hasErrorReturnPattern);
};

// Find redundant patterns in code
const findRedundantPatterns = (code: string, language: string): { description: string, line: number }[] => {
  const results: { description: string, line: number }[] = [];
  const lines = code.split('\n');
  
  // Check for redundant if-else patterns
  let prevCondition = '';
  lines.forEach((line, index) => {
    // Check for identical consecutive if conditions
    const ifMatch = line.match(/if\s*\((.*?)\)/);
    if (ifMatch && ifMatch[1] === prevCondition && prevCondition !== '') {
      results.push({
        description: 'Redundant condition check',
        line: index + 1
      });
    }
    if (ifMatch) prevCondition = ifMatch[1];
    
    // Check for negated conditions in else-if that could be simplified
    if (line.includes('else if') && line.includes('!')) {
      results.push({
        description: 'Negated condition in else-if could be simplified',
        line: index + 1
      });
    }
    
    // Check for redundant null checks
    if ((line.includes('=== null') || line.includes('!== null')) && 
        (line.includes('=== undefined') || line.includes('!== undefined'))) {
      results.push({
        description: 'Redundant null/undefined check',
        line: index + 1
      });
    }
  });
  
  return results;
};

// Check for user input
const hasUserInput = (code: string, language: string): boolean => {
  const inputPatterns = [
    /Scanner|BufferedReader|readline|readLine|prompt\(|process\.stdin|input\(/,
    /getElementById|querySelector|event\.|onChange|onClick/,
    /\.value|\.val\(\)|e\.target\.value/
  ];
  
  return inputPatterns.some(pattern => pattern.test(code));
};

// Check for input validation
const hasInputValidation = (code: string, language: string): boolean => {
  const validationPatterns = [
    /if\s*\(\s*\w+/,
    /parseInt|parseFloat|trim\(\)|\.length/,
    /try\s*{[\s\S]*?}\s*catch/,
    /\w+\s*instanceof\s+\w+/,
    /isNaN\(|typeof\s+\w+\s*===|\.test\(/,
    /validate|validation|sanitize|check|isValid/
  ];
  
  return validationPatterns.some(pattern => pattern.test(code));
};
