/**
 * Utility functions for calculating code metrics using standardized algorithms
 */

// Calculate cyclomatic complexity of code using proper McCabe complexity algorithm
export const calculateCyclomaticComplexity = (code: string, language: string = 'javascript'): number => {
  const lines = code.split('\n');
  // McCabe's cyclomatic complexity: E - N + 2P
  // Where E = edges, N = nodes, P = connected components (typically 1)
  // Simplified: Start with 1 and add 1 for each decision point
  let complexity = 1; // Base complexity is 1 for single path
  
  // Check if this is likely competitive programming code
  const isCompetitiveProgramming = language === 'java' && 
                                 code.includes("public static void main") &&
                                 (code.includes("Scanner") || code.includes("BufferedReader"));
  
  // For competitive programming, we're more lenient with complexity thresholds
  const complexityMultiplier = isCompetitiveProgramming ? 0.8 : 1.0;
  
  for (const line of lines) {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
      continue;
    }
    
    // Properly count decision points based on language
    if (language === 'java') {
      // Java-specific patterns
      if (/\bif\s*\(|\belse\s+if\s*\(/.test(line)) complexity++;
      if (/\bswitch\s*\(/.test(line)) complexity++;
      if (/\bcase\s+[^:]+:/.test(line)) complexity++;
      if (/\bfor\s*\(|\bwhile\s*\(|\bdo\s*\{/.test(line)) complexity++;
      if (/\bcatch\s*\(/.test(line)) complexity++;
      if (/\breturn\s+.*\?.*:/.test(line)) complexity++; // Ternary in return
      if (/\&\&|\|\|/.test(line)) {
        // Count each logical operator
        const logicalOps = line.match(/\&\&|\|\|/g) || [];
        complexity += logicalOps.length;
      }
      // Java stream operations with predicates
      if (/\.filter\(|\.anyMatch\(|\.allMatch\(|\.noneMatch\(/.test(line)) complexity++;
    } else {
      // JavaScript/TypeScript patterns
      if (/\bif\s*\(|\belse\s+if\s*\(/.test(line)) complexity++;
      if (/\bswitch\s*\(/.test(line)) complexity++; // Base for switch
      if (/\bcase\s+[^:]+:/.test(line)) complexity++;
      if (/\bfor\s*\(|\bwhile\s*\(|\bdo\s*\{/.test(line)) complexity++;
      if (/\bcatch\s*\(/.test(line)) complexity++;
      // Count logical operators
      const logicalOps = line.match(/\s\&\&\s|\s\|\|\s/g) || [];
      complexity += logicalOps.length;
      if (/\?[^:]*\:/.test(line)) complexity++;
    }
  }
  
  return Math.round(complexity * complexityMultiplier);
};

// Calculate maintainability index using the weighted model
export const calculateMaintainability = (code: string, language: string = 'javascript'): number => {
  // Base maintainability score starts at 100
  let maintainabilityScore = 100;
  
  // Check if this is likely competitive programming code
  const isCompetitiveProgramming = language === 'java' && 
                                 code.includes("public static void main") &&
                                 (code.includes("Scanner") || code.includes("BufferedReader"));
  
  const lines = code.split('\n').filter(line => line.trim() !== '');
  const linesOfCode = lines.length;
  
  // Skip detailed analysis for very simple code
  if (linesOfCode < 10) {
    return 95; // Very simple code gets high maintainability
  }
  
  // 1. Check for deep nesting (major issue, -10 points)
  let maxNesting = 0;
  let currentNesting = 0;
  
  for (const line of lines) {
    const openBraces = (line.match(/{/g) || []).length;
    const closedBraces = (line.match(/}/g) || []).length;
    
    currentNesting += openBraces - closedBraces;
    maxNesting = Math.max(maxNesting, currentNesting);
  }
  
  // Penalize deep nesting
  if (maxNesting > 4) {
    maintainabilityScore -= Math.min(20, (maxNesting - 4) * 5); // Cap at -20 points
  }
  
  // 2. Check comment density (major issue, -10 points)
  const commentLines = lines.filter(line =>
    line.trim().startsWith('//') ||
    line.trim().startsWith('/*') ||
    line.trim().startsWith('*')
  ).length;
  
  const commentRatio = commentLines / linesOfCode;
  if (commentRatio < 0.05 && !isCompetitiveProgramming) {
    maintainabilityScore -= 10; // -10 points for insufficient comments
  } else if (commentRatio < 0.1 && !isCompetitiveProgramming) {
    maintainabilityScore -= 5; // -5 points for low comments
  }
  
  // 3. Check function length (major issue, -10 points)
  let inFunction = false;
  let currentFunctionLines = 0;
  let longestFunction = 0;
  
  for (const line of lines) {
    const isFunctionStart = language === 'java' ? 
      (line.includes('void') || line.includes('public') || line.includes('private') || line.includes('protected')) && line.includes('(') && line.includes(')') && !line.includes(';') : 
      (line.includes('function') || line.includes('=>')) && !line.includes('//');
      
    if (isFunctionStart) {
      inFunction = true;
      currentFunctionLines = 0;
    }
    
    if (inFunction) {
      currentFunctionLines++;
      if (line.includes('}') && line.trim() === '}') {
        inFunction = false;
        longestFunction = Math.max(longestFunction, currentFunctionLines);
      }
    }
  }
  
  // Penalize long functions
  if (longestFunction > 30 && !isCompetitiveProgramming) {
    maintainabilityScore -= Math.min(15, (longestFunction - 30) / 2); // Cap at -15 points
  }
  
  // 4. Check for magic numbers (minor issue, -0.5 points each, up to -10)
  const magicNumberMatches = code.match(/[^a-zA-Z0-9_\.]([3-9]|[1-9][0-9]+)(?![a-zA-Z0-9_\.])/g) || [];
  const uniqueMagicNumbers = new Set(magicNumberMatches.map(m => m.trim()));
  
  maintainabilityScore -= Math.min(10, uniqueMagicNumbers.size * 0.5);
  
  // 5. Check for single-letter variables (minor issue, -0.5 points each, up to -5)
  const varPatternByLanguage = language === 'java' ?
    /\b(int|double|String|boolean|char|float|long)\s+([a-zA-Z]{1})\b/g :
    /\b(var|let|const)\s+([a-zA-Z]{1})\b/g;
  
  const singleLetterMatches = code.match(varPatternByLanguage) || [];
  const exemptVars = new Set(['i', 'j', 'k', 'n', 'm']); // Common loop variables
  const problematicVars = singleLetterMatches.filter(match => {
    const varName = match.match(/\b[a-zA-Z]{1}\b/)?.[0];
    return varName && !exemptVars.has(varName);
  });
  
  maintainabilityScore -= Math.min(5, problematicVars.length * 0.5);
  
  // 6. Check for error handling (major issue, -15 points)
  const hasTryCatch = code.includes('try') && code.includes('catch');
  const needsErrorHandling = 
    (code.includes('throw') || 
     code.includes('/') || 
     code.includes('parse') ||
     code.includes('JSON') ||
     code.includes('readFile')) && 
    !isCompetitiveProgramming;
  
  if (needsErrorHandling && !hasTryCatch) {
    maintainabilityScore -= 15;
  }
  
  // Apply different thresholds for competitive programming
  if (isCompetitiveProgramming) {
    maintainabilityScore = Math.min(100, maintainabilityScore + 15); // Boost score for CP
  }
  
  // Ensure score stays within 0-100 range
  maintainabilityScore = Math.max(0, Math.min(100, maintainabilityScore));
  
  // Convert to letter grade
  // A: 90+, B: 80-89, C: 70-79, D: <70
  return Math.round(maintainabilityScore);
};

// Calculate reliability score based on formal static analysis principles
export const calculateReliability = (code: string, language: string = 'javascript'): number => {
  let reliabilityScore = 70; // Baseline score
  
  // Check if this is likely competitive programming code
  const isCompetitiveProgramming = language === 'java' && 
                                 code.includes("public static void main") &&
                                 (code.includes("Scanner") || code.includes("BufferedReader")) &&
                                 code.length < 1000;
  
  // Adjusted reliability detection for competitive programming context
  if (isCompetitiveProgramming) {
    reliabilityScore += 10; // More lenient baseline for competitive programming
  }
  
  // Check for bounded loop patterns that are safe in competitive programming
  const hasBoundedLoops = (code.match(/for\s*\(\s*\w+\s+\w+\s*=\s*\d+\s*;\s*\w+\s*<\s*(\w+|\d+)\s*;/g) || []).length > 0;
  
  if (hasBoundedLoops && isCompetitiveProgramming) {
    reliabilityScore += 5; // Reward proper bounded loops in competitive programming
  }
  
  // Formal reliability factors
  
  // 1. Error handling presence
  const errorHandlingPatterns = language === 'java' ? [
    { pattern: /try\s*\{[\s\S]*?catch\s*\(/g, weight: 10 },
    { pattern: /throws\s+\w+/g, weight: 5 },
    { pattern: /throw\s+new\s+\w+/g, weight: isCompetitiveProgramming ? 0 : -2 } // Don't penalize in competitive programming
  ] : [
    { pattern: /try\s*\{[\s\S]*?catch\s*\(/g, weight: 10 },
    { pattern: /\.catch\s*\(/g, weight: 5 },
    { pattern: /throw\s+new\s+Error/g, weight: 3 }
  ];
  
  for (const { pattern, weight } of errorHandlingPatterns) {
    const matches = code.match(pattern) || [];
    reliabilityScore += Math.min(15, matches.length * weight); // Cap at 15 points
  }
  
  // 2. Input validation patterns based on language
  const validationPatterns = language === 'java' ? [
    { pattern: /\w+\s*!=\s*null/g, weight: 5 },
    { pattern: /Objects\.requireNonNull\(/g, weight: 8 },
    { pattern: /if\s*\(\s*\w+\s*==\s*null\)/g, weight: 5 },
    { pattern: /\w+\.length\s*[><=]=?\s*\d+/g, weight: 3 },
    { pattern: /try\s*\{[\s\S]*?catch\s*\(\s*NumberFormatException/g, weight: 5 }
  ] : [
    { pattern: /typeof\s+\w+\s*===?\s*['"]undefined['"]/g, weight: 5 },
    { pattern: /\w+\s*===?\s*null/g, weight: 5 },
    { pattern: /\w+\s*!==?\s*undefined/g, weight: 5 },
    { pattern: /\w+\s*!==?\s*null/g, weight: 5 },
    { pattern: /\bisNaN\(/g, weight: 3 },
    { pattern: /\bisFinite\(/g, weight: 3 },
    { pattern: /\blength\s*[><=]=?\s*\d+/g, weight: 2 }
  ];
  
  for (const { pattern, weight } of validationPatterns) {
    const matches = code.match(pattern) || [];
    reliabilityScore += Math.min(15, matches.length * weight); // Cap at 15 points
  }
  
  // 3. Deduct for known potential reliability issues
  // Skip some deductions for competitive programming context
  const reliabilityIssues = language === 'java' ? [
    { pattern: /==(?!=)/g, weight: isCompetitiveProgramming ? -1 : -2 }, // == comparison, less penalty in CP
    { pattern: /\/\/\s*TODO|\/\/\s*FIXME/g, weight: -2 }, // TODO/FIXME comments
    { pattern: /System\.out\.println/g, weight: isCompetitiveProgramming ? 0 : -1 }, // Don't penalize console in CP
    { pattern: /Math\.random/g, weight: -1 }, // Non-deterministic operations
    { pattern: /\/\s*\w+/g, weight: -3 }, // Division without checking denominator
    { pattern: /\w+\[(\w+|\d+)\]/g, weight: isCompetitiveProgramming && hasBoundedLoops ? 0 : -2 } // Array access - no penalty if in bounded loop in CP
  ] : [
    { pattern: /==(?!=)/g, weight: -2 }, // Loose equality
    { pattern: /!=(?!=)/g, weight: -2 }, // Loose inequality
    { pattern: /\/\/\s*TODO|\/\/\s*FIXME/g, weight: -2 }, // TODO/FIXME comments
    { pattern: /console\.log/g, weight: -1 }, // Console logs in production code
    { pattern: /Math\.random/g, weight: -1 } // Non-deterministic operations
  ];
  
  for (const { pattern, weight } of reliabilityIssues) {
    const matches = code.match(pattern) || [];
    const deduction = Math.max(-15, matches.length * weight); // Cap deduction at -15
    reliabilityScore += deduction;
  }
  
  // 4. Check for unhandled exceptions with context awareness
  const lines = code.split('\n');
  let hasTryCatch = false;
  
  for (const line of lines) {
    if (line.includes('try') && line.includes('{')) {
      hasTryCatch = true;
      break;
    }
  }
  
  // Define risky operation patterns based on language
  const riskOperationPatterns = language === 'java' ? [
    /\/\s*\w+/, // Division operation
    /\w+\.\w+\(/, // Method call that could be on null
    /\w+\[\w+\]/, // Array access
    /\([\w\.]+\)\s*\w+/ // Type casting
  ] : [
    /JSON\.parse\s*\(/,
    /fs\.\w+Sync\s*\(/,
    /\.\w+\s*\(/,
    /\[(\w+|\d+)\]/
  ];
  
  // Count risky operations that are not in try-catch blocks
  let riskyOpCount = 0;
  let boundedArrayAccess = 0;
  let dividedByConst = 0;
  
  // In competitive programming context, also check for common safe patterns
  if (language === 'java') {
    // Check for bounded array access in for loops (index < array.length)
    boundedArrayAccess = (code.match(/for\s*\(\s*\w+\s+\w+\s*=\s*\d+\s*;\s*\w+\s*<\s*\w+\.length\s*;/g) || []).length;
    
    // Check for division by constants (safe)
    dividedByConst = (code.match(/\/\s*\d+/g) || []).length;
  }
  
  for (const pattern of riskOperationPatterns) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isComment = line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*');
      
      // Skip comments and check if it's a risky operation
      if (!isComment && pattern.test(line)) {
        // For array access in Java with bounded loops, don't count as risky
        if (pattern.toString().includes('\\[\\w+\\]') && boundedArrayAccess > 0 && isCompetitiveProgramming) {
          continue;
        }
        // For division by constants, don't count as risky
        if (pattern.toString().includes('\\/') && 
            line.match(/\/\s*\d+/) && 
            !line.match(/\/\s*\w+\s*[\+\-\*\/]/) && // Not a complex expression
            isCompetitiveProgramming) {
          continue;
        }
        riskyOpCount++;
      }
    }
  }
  
  // Higher penalty for many risky operations without try-catch
  if (!hasTryCatch && riskyOpCount > 0) {
    let penalty = isCompetitiveProgramming ? Math.min(10, riskyOpCount) : Math.min(20, riskyOpCount * 2);
    reliabilityScore -= penalty;
  }
  
  // For simple code with no decision points, ensure high reliability
  const cyclomaticComplexity = calculateCyclomaticComplexity(code, language);
  if (cyclomaticComplexity <= 2 && code.length > 0) {
    reliabilityScore = Math.max(reliabilityScore, 85); // Simple code is generally reliable
  }
  
  // Cap to 0-100 range
  reliabilityScore = Math.max(0, Math.min(100, reliabilityScore));
  
  return Math.round(reliabilityScore);
};

// Get code metrics
export const getCodeMetrics = (code: string, language: string = 'javascript') => {
  const lines = code.split('\n').filter(line => line.trim() !== '');
  const linesOfCode = lines.length;
  
  // Check for competitive programming context
  const isCompetitiveProgramming = language === 'java' && 
                                 code.includes("public static void main") &&
                                 (code.includes("Scanner") || code.includes("BufferedReader"));
  
  // Calculate comment percentage with language-specific adjustments
  let commentLines;
  if (language === 'java') {
    commentLines = lines.filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('/*') || 
      line.trim().startsWith('*') ||
      line.trim().startsWith('/**') ||
      line.trim().startsWith('@')  // Javadoc annotations
    ).length;
  } else {
    commentLines = lines.filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('/*') || 
      line.trim().startsWith('*')
    ).length;
  }
  const commentPercentage = commentLines / (linesOfCode || 1) * 100;
  
  // Calculate function-based metrics more accurately
  let functionCount;
  if (language === 'java') {
    const methodRegex = /(?:public|private|protected)(?:\s+static)?\s+\w+\s+\w+\s*\([^)]*\)/g;
    const methodMatches = code.match(methodRegex) || [];
    functionCount = methodMatches.length;
    
    // For competitive programming in Java, ensure we count at least the main method
    if (functionCount === 0 && isCompetitiveProgramming) {
      functionCount = 1; // At least count main
    }
  } else {
    const functionRegex = /function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|\w+\s*\([^)]*\)\s*{|\w+\s*=\s*function/g;
    const functionMatches = code.match(functionRegex) || [];
    functionCount = functionMatches.length;
  }
  
  // Calculate average function length
  let inFunction = false;
  let braceCount = 0;
  let currentFunctionLines = 0;
  let functionLengths: number[] = [];
  
  for (const line of lines) {
    // Detect function start based on language
    let functionStartPattern;
    if (language === 'java') {
      functionStartPattern = (line.includes('public') || line.includes('private') || line.includes('protected')) && line.includes('(') && !line.includes(';');
    } else {
      functionStartPattern = (line.includes('function') || line.includes('=>') || (line.includes('{') && line.includes('(') && !line.includes('if') && !line.includes('for') && !line.includes('while')));
    }
    
    if (functionStartPattern && !inFunction) {
      inFunction = true;
      currentFunctionLines = 1;
      braceCount = 0;
    }
    
    if (inFunction) {
      // Count opening braces
      braceCount += (line.match(/{/g) || []).length;
      // Count closing braces
      braceCount -= (line.match(/}/g) || []).length;
      
      // If all braces are balanced and we've seen at least one closing brace, the function has ended
      if (braceCount <= 0 && line.includes('}')) {
        inFunction = false;
        functionLengths.push(currentFunctionLines);
      } else {
        currentFunctionLines++;
      }
    }
  }
  
  // For competitive programming with just one main method, be lenient
  if (isCompetitiveProgramming && functionLengths.length <= 1) {
    // Don't penalize single main method in competitive programming
    functionLengths = functionLengths.map(length => Math.min(length, 20));
  }
  
  // Calculate average function length
  const averageFunctionLength = functionCount > 0 
    ? Math.round(functionLengths.reduce((sum, length) => sum + length, 0) / functionCount) 
    : 0;
  
  return {
    linesOfCode,
    commentPercentage,
    functionCount,
    averageFunctionLength
  };
};
