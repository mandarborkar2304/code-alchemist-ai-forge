
import { MetricsResult, ScoreGrade } from '@/types';

// Constants for metric calculation
const CYCLOMATIC_COMPLEXITY_WEIGHT = 1;
const NESTING_DEPTH_WEIGHT = 0.8;
const ERROR_HANDLING_WEIGHT = 0.7;
const BOUNDS_CHECK_WEIGHT = 0.5;
const NULL_CHECK_WEIGHT = 0.6;

// Calculate cyclomatic complexity
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

// Calculate maintainability with improved balancing and normalization
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
  const magicNumberCount = countMagicNumbers(code);
  if (magicNumberCount > 5) baseScore -= Math.min(3, Math.floor(magicNumberCount / 5));
  
  // Single-letter variable penalties (only if exceeding threshold)
  const singleLetterVarCount = countSingleLetterVariables(code, language);
  if (singleLetterVarCount > 3) baseScore -= Math.min(2, Math.floor(singleLetterVarCount / 3));
  
  // Normalize penalties by code size
  const normalizedScore = baseScore + (10 - Math.min(10, Math.max(0, (100 - baseScore) / logicalBlocks)));
  
  // Ensure score is within bounds
  return Math.max(0, Math.min(100, normalizedScore));
};

// Calculate reliability with contextual awareness and safer defaults
export const calculateReliability = (code: string, language: string): number => {
  let baseScore = 100;
  const lines = code.split("\n");
  
  // Context detection for reliability assessment
  const isCompetitiveProgrammingContext = detectCompetitiveProgrammingContext(code, language);
  const safeLoopVariables = extractSafeLoopVariables(code, language);
  const nullCheckedVariables = extractNullCheckedVariables(code, language);
  const isSimpleNonErrorProneCode = code.length < 200 && !containsRiskyOperations(code, language);
  
  // Significantly reduce penalties for certain contexts
  const contextMultiplier = isCompetitiveProgrammingContext ? 0.5 : 
                            isSimpleNonErrorProneCode ? 0.7 : 1.0;
  
  // Error handling penalties with context awareness
  if (requiresErrorHandling(code, language) && !hasErrorHandling(code, language)) {
    // Less severe penalty when code has low complexity or is competitive programming
    baseScore -= Math.round(5 * contextMultiplier);
  }
  
  // Check for unsafe array access with context awareness
  const unsafeArrayAccesses = countUnsafeArrayAccesses(code, language, safeLoopVariables);
  if (unsafeArrayAccesses > 0) {
    // Reduce penalty for competitive programming or if it's a simple example
    baseScore -= Math.min(10, unsafeArrayAccesses * 2) * contextMultiplier;
  }
  
  // Check for null safety issues with context awareness
  const nullSafetyIssues = countNullSafetyIssues(code, language, nullCheckedVariables);
  if (nullSafetyIssues > 0) {
    baseScore -= Math.min(8, nullSafetyIssues * 2) * contextMultiplier;
  }
  
  // Input validation issues
  if (hasUserInput(code, language) && !hasInputValidation(code, language) && !isCompetitiveProgrammingContext) {
    baseScore -= 3;
  }
  
  // Exception handling consistency for Java
  if (language === 'java' && hasExplicitThrows(code) && !hasTryCatchOrThrowsDeclaration(code)) {
    baseScore -= 3 * contextMultiplier;
  }
  
  // Normalize by risk level
  const riskLevel = assessCodeRiskLevel(code, language);
  const normalizedScore = baseScore + ((100 - baseScore) * (1 - riskLevel / 10));
  
  // Ensure the score is within bounds
  return Math.max(0, Math.min(100, normalizedScore));
};

// Get code metrics
export const getCodeMetrics = (code: string, language: string): MetricsResult => {
  const lines = code.split('\n');
  const codeLines = lines.filter(line => line.trim().length > 0).length;
  
  const functionsCount = countFunctions(code, language);
  const avgFunctionLength = functionsCount > 0 ? 
    lines.length / functionsCount : lines.length;
  
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
    totalLines: lines.length,
    codeLines,
    commentLines,
    commentPercentage,
    functionsCount,
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

// Count magic numbers
const countMagicNumbers = (code: string): number => {
  // Exclude common safe numbers like 0, 1, 2
  const magicNumberMatches = code.match(/[^a-zA-Z0-9_\.]([3-9]|[1-9][0-9]+)(?![a-zA-Z0-9_\.])/g);
  return magicNumberMatches ? magicNumberMatches.length : 0;
};

// Count single-letter variables
const countSingleLetterVariables = (code: string, language: string): number => {
  const lines = code.split('\n');
  let count = 0;
  const safeVars = new Set(['i', 'j', 'k', 'x', 'y', 'n', 'm']); // Common loop variables
  
  for (const line of lines) {
    // Skip loop declarations where single-letter variables are common
    if (line.includes('for ')) continue;
    
    let matches;
    if (language === 'java') {
      matches = line.match(/\b(?:int|String|boolean|double|char|long)\s+([a-zA-Z])\b/g);
    } else {
      matches = line.match(/\b(?:let|const|var)\s+([a-zA-Z])\b/g);
    }
    
    if (matches) {
      for (const match of matches) {
        const varName = match.split(/\s+/).pop();
        if (varName && varName.length === 1 && !safeVars.has(varName)) {
          count++;
        }
      }
    }
  }
  
  return count;
};

// Context detection for competitive programming
const detectCompetitiveProgrammingContext = (code: string, language: string): boolean => {
  // Common competitive programming patterns
  const hasMainMethod = code.includes('public static void main') || code.includes('function main');
  const hasStdinInput = code.includes('Scanner') || code.includes('BufferedReader') || 
                      code.includes('readline') || code.includes('process.stdin');
  const hasArrayManipulation = code.includes('[') && code.includes(']') && 
                               (code.includes('sort') || code.includes('length') || code.includes('push'));
  const hasAlgorithmicPatterns = code.includes('for') && 
                                (code.includes('min') || code.includes('max') || code.includes('sum'));
  
  // Typical competitive programming file size is small to medium
  const isSmallToMedium = code.length < 1000;
  
  return (hasMainMethod && hasStdinInput && isSmallToMedium) || 
         (hasMainMethod && hasArrayManipulation && hasAlgorithmicPatterns && isSmallToMedium);
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

// Extract variables that have null checks
const extractNullCheckedVariables = (code: string, language: string): string[] => {
  const nullCheckedVars: string[] = [];
  const lines = code.split('\n');
  
  for (const line of lines) {
    // Check for null checks (obj != null, obj !== null, etc)
    const nullCheckMatch = line.match(/if\s*\(\s*(\w+)\s*!==?\s*null\b/);
    if (nullCheckMatch && nullCheckMatch[1]) {
      nullCheckedVars.push(nullCheckMatch[1]);
    }
    
    // Check for existence checks (if (obj), etc)
    const existenceCheckMatch = line.match(/if\s*\(\s*(\w+)\s*\)/);
    if (existenceCheckMatch && existenceCheckMatch[1]) {
      nullCheckedVars.push(existenceCheckMatch[1]);
    }
    
    // Optional chaining in JavaScript/TypeScript
    if (language !== 'java') {
      const optionalChainingMatch = line.match(/(\w+)\?\./g);
      if (optionalChainingMatch) {
        for (const match of optionalChainingMatch) {
          nullCheckedVars.push(match.replace('?.', ''));
        }
      }
    }
    
    // Java Optional or Objects.nonNull
    if (language === 'java') {
      if (line.includes('Optional<') || line.includes('Objects.nonNull')) {
        const optionalMatch = line.match(/(\w+)\.(?:isPresent|get|orElse|orElseGet)\(/);
        if (optionalMatch && optionalMatch[1]) {
          nullCheckedVars.push(optionalMatch[1]);
        }
      }
    }
  }
  
  return nullCheckedVars;
};

// Check if code contains risky operations that would require error handling
const containsRiskyOperations = (code: string, language: string): boolean => {
  // These patterns indicate higher risk operations
  const riskyPatterns = [
    /\.parse\(/, // JSON.parse or similar
    /new FileReader|new Scanner/, // File operations
    /fetch\(|axios\.|http\./, // Network requests
    /throw new Error|throw new Exception/, // Explicit throws
    /\/\s*0|%\s*0/, // Division by zero risk
    /\.substring\(\s*\d+\s*\)|\.charAt\(\s*\d+\s*\)/ // String operations without bounds check
  ];
  
  return riskyPatterns.some(pattern => pattern.test(code));
};

// Check if code requires error handling based on operations performed
const requiresErrorHandling = (code: string, language: string): boolean => {
  // Simple code without risky operations doesn't need explicit error handling
  if (!containsRiskyOperations(code, language)) {
    return false;
  }
  
  // Check for code complexity that would warrant error handling
  const hasComplexFlow = code.includes('if') && code.includes('for');
  const isLongEnough = code.split('\n').length > 15;
  
  return hasComplexFlow && isLongEnough;
};

// Check if code has error handling mechanisms
const hasErrorHandling = (code: string, language: string): boolean => {
  return code.includes('try') && code.includes('catch');
};

// Count unsafe array accesses that aren't protected
const countUnsafeArrayAccesses = (code: string, language: string, safeVariables: string[]): number => {
  const lines = code.split('\n');
  let count = 0;
  
  for (const line of lines) {
    // Skip array access within loop or with constant index, which is generally safe
    if (line.includes('for') || line.includes('while')) continue;
    
    // Match array accesses with variable index
    const arrayAccessMatches = line.match(/\w+\s*\[\s*(\w+)\s*\]/g);
    if (arrayAccessMatches) {
      for (const match of arrayAccessMatches) {
        const indexVarMatch = match.match(/\[\s*(\w+)\s*\]/);
        if (indexVarMatch && indexVarMatch[1]) {
          const indexVar = indexVarMatch[1];
          // Only count as unsafe if not a safe loop variable and not a number literal
          if (!safeVariables.includes(indexVar) && !/^\d+$/.test(indexVar)) {
            count++;
          }
        }
      }
    }
  }
  
  return count;
};

// Count null safety issues
const countNullSafetyIssues = (code: string, language: string, nullCheckedVars: string[]): number => {
  const lines = code.split('\n');
  let count = 0;
  
  for (const line of lines) {
    // Skip lines with null checks
    if (line.includes('!= null') || line.includes('!== null') || 
        line.includes('?.') || line.includes('||') || line.includes('&&')) {
      continue;
    }
    
    // Match property access with dot notation
    const propertyAccessMatches = line.match(/(\w+)\.\w+/g);
    if (propertyAccessMatches) {
      for (const match of propertyAccessMatches) {
        const objectName = match.split('.')[0];
        // Only count as unsafe if not previously null-checked
        if (!nullCheckedVars.includes(objectName)) {
          count++;
          break; // Count only once per line to avoid over-penalization
        }
      }
    }
  }
  
  return count;
};

// Check for user input handling
const hasUserInput = (code: string, language: string): boolean => {
  const inputPatterns = [
    /Scanner|BufferedReader|readline|readLine|prompt\(|process\.stdin|input\(/,
    /getElementById|querySelector|event\.|onChange|onClick/
  ];
  
  return inputPatterns.some(pattern => pattern.test(code));
};

// Check for input validation
const hasInputValidation = (code: string, language: string): boolean => {
  const validationPatterns = [
    /if\s*\(\s*\w+\s*(==|!=|>=|<=|>|<)/,
    /parseInt|parseFloat|trim\(\)|\.length\s*(?:>|<|===|!==)/,
    /try\s*{[\s\S]*?}\s*catch/,
    /\w+\s*instanceof\s+\w+/,
    /isNaN\(|typeof\s+\w+\s*===|\.test\(/
  ];
  
  return validationPatterns.some(pattern => pattern.test(code));
};

// Java-specific: Check for explicit throws
const hasExplicitThrows = (code: string): boolean => {
  return /throw\s+new\s+\w+/.test(code);
};

// Java-specific: Check for proper exception handling
const hasTryCatchOrThrowsDeclaration = (code: string): boolean => {
  return /try\s*{[\s\S]*?}\s*catch/.test(code) || /\)\s*throws\s+\w+/.test(code);
};

// Assess overall code risk level (0-10 scale)
const assessCodeRiskLevel = (code: string, language: string): number => {
  let riskScore = 0;
  
  // High-risk operations
  if (code.includes('parse(') || code.includes('eval(')) riskScore += 2;
  if (code.includes('File') || code.includes('fs.')) riskScore += 2;
  if (code.includes('fetch(') || code.includes('axios')) riskScore += 1;
  
  // Data handling risks
  const hasArrays = (code.match(/\[.*\]/g) || []).length > 2;
  const hasLoops = (code.match(/for\s*\(|while\s*\(/g) || []).length > 1;
  if (hasArrays && hasLoops) riskScore += 1;
  
  // User input risk
  if (hasUserInput(code, language)) riskScore += 1;
  
  // External dependencies risk
  const hasExternalDeps = (code.match(/import\s+|require\(/g) || []).length > 3;
  if (hasExternalDeps) riskScore += 1;
  
  // Risk mitigations
  if (hasErrorHandling(code, language)) riskScore -= 1;
  if (hasInputValidation(code, language)) riskScore -= 1;
  
  // Context-based risk adjustments
  if (detectCompetitiveProgrammingContext(code, language)) riskScore = Math.max(1, riskScore - 2);
  
  return Math.max(0, Math.min(10, riskScore));
};
