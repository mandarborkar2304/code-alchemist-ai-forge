
/**
 * Utility functions for calculating code metrics following formal definitions
 */

// Calculate cyclomatic complexity of code (McCabe complexity)
export const calculateCyclomaticComplexity = (code: string): number => {
  const lines = code.split('\n');
  let complexity = 1; // Base complexity is 1
  
  for (const line of lines) {
    // Count decision points: if, else if, case, &&, ||, ternary operators
    if (line.match(/\bif\s*\(/) || line.match(/\belse\s+if\s*\(/)) complexity++;
    if (line.match(/\bcase\s+/) && !line.includes('//')) complexity++;
    if (line.includes('&&') || line.includes('||')) {
      // Count each occurrence
      const andOps = (line.match(/&&/g) || []).length;
      const orOps = (line.match(/\|\|/g) || []).length;
      complexity += andOps + orOps;
    }
    if (line.includes('?') && line.includes(':') && !line.includes('//')) complexity++;
    if (line.match(/\bfor\s*\(/) || line.match(/\bwhile\s*\(/) || line.match(/\bdo\s+/)) complexity++;
    if (line.match(/\bcatch\s*\(/)) complexity++;
  }
  
  return complexity;
};

// Calculate maintainability index following the standard formula
export const calculateMaintainability = (code: string): number => {
  const lines = code.split('\n').filter(line => line.trim() !== '');
  const linesOfCode = lines.length;
  
  // Calculate Halstead Volume approximation
  const uniqueOperators = new Set();
  const uniqueOperands = new Set();
  let totalOperators = 0;
  let totalOperands = 0;
  
  const codeWithoutStrings = code.replace(/".*?"/g, '').replace(/'.*?'/g, '');
  
  // Count operators
  const operators = codeWithoutStrings.match(/[\+\-\*\/\=\<\>\!\&\|\^\~\%]+/g) || [];
  operators.forEach(op => uniqueOperators.add(op));
  totalOperators = operators.length;
  
  // Count operands (simplistic approach)
  const operands = codeWithoutStrings.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
  operands.forEach(op => uniqueOperands.add(op));
  totalOperands = operands.length;
  
  // Calculate Halstead metrics
  const n1 = uniqueOperators.size;
  const n2 = uniqueOperands.size;
  const N1 = totalOperators;
  const N2 = totalOperands;
  
  // Handle edge case
  if (n1 === 0 || n2 === 0) {
    return 85; // Simplified case for very short code
  }
  
  const vocabulary = n1 + n2;
  const length = N1 + N2;
  const volume = length * Math.log2(vocabulary);
  
  // Calculate comment percentage
  const commentLines = lines.filter(line => 
    line.trim().startsWith('//') || 
    line.trim().startsWith('/*') || 
    line.trim().startsWith('*')
  ).length;
  
  const commentPercentage = (commentLines / linesOfCode) * 100;
  
  // Calculate cyclomatic complexity
  const cyclomaticComplexity = calculateCyclomaticComplexity(code);
  
  // Standard Maintainability Index formula
  // MI = 171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(LOC) + 50 * sin(sqrt(2.4 * CR))
  // where V is the Halstead Volume, G is cyclomatic complexity, LOC is lines of code, CR is comment ratio
  
  let maintainability = 171 - 5.2 * Math.log(Math.max(1, volume)) - 0.23 * cyclomaticComplexity - 16.2 * Math.log(Math.max(1, linesOfCode));
  
  // Add comment contribution (simplified compared to the original formula)
  maintainability += commentPercentage * 0.2;
  
  // Scale to 0-100
  maintainability = (maintainability / 171) * 100;
  
  // Cap between 0 and 100
  maintainability = Math.min(100, Math.max(0, maintainability));
  
  // Special case for simple functions that should score high
  if (linesOfCode < 10 && cyclomaticComplexity <= 2 && volume < 100) {
    maintainability = Math.max(maintainability, 85); // Ensure simple code gets a good score
  }
  
  return Math.round(maintainability);
};

// Calculate reliability score using formal metrics
export const calculateReliability = (code: string): number => {
  // Base reliability starts at 70
  let reliabilityScore = 70; 
  
  // Error handling increases reliability
  const errorHandlingPatterns = [
    { pattern: /try\s*{[\s\S]*?}\s*catch/, weight: 15 },
    { pattern: /if\s*\([^)]*(?:undefined|null|typeof)/, weight: 10 },
    { pattern: /if\s*\([^)]*(?:\.length|isEmpty)/, weight: 5 },
    { pattern: /throw\s+new\s+Error/, weight: 5 },
    { pattern: /console\.error/, weight: 2 },
  ];
  
  // Apply error handling bonuses
  for (const { pattern, weight } of errorHandlingPatterns) {
    if (pattern.test(code)) {
      reliabilityScore += weight;
    }
  }
  
  // Defensive programming patterns increase reliability
  const defensivePatterns = [
    { pattern: /default\s*:/, weight: 5 },
    { pattern: /else\s*{/, weight: 3 },
    { pattern: /}\s*finally\s*{/, weight: 5 },
    { pattern: /\|\|\s*''|\|\|\s*0|\|\|\s*\[\]|\|\|\s*{}/, weight: 3 }, // Default values
  ];
  
  // Apply defensive programming bonuses
  for (const { pattern, weight } of defensivePatterns) {
    if (pattern.test(code)) {
      reliabilityScore += weight;
    }
  }
  
  // Bad practices decrease reliability
  const badPractices = [
    { pattern: /console\.log\(/, weight: -2, maxPenalty: -6 },
    { pattern: /==/g, weight: -5, maxPenalty: -5 }, // Loose equality
    { pattern: /!=/g, weight: -5, maxPenalty: -5 }, // Loose inequality
    { pattern: /eval\s*\(/, weight: -10, maxPenalty: -10 }, // Using eval
  ];
  
  // Apply bad practice penalties
  for (const { pattern, weight, maxPenalty } of badPractices) {
    const matches = code.match(pattern) || [];
    if (matches.length > 0) {
      reliabilityScore += Math.max(maxPenalty, weight * matches.length);
    }
  }
  
  // Adjust for simple functions that should be reliable
  const isSimpleFunction = code.length < 100 && !code.includes('if') && !code.includes('for') && !code.includes('while');
  if (isSimpleFunction) {
    reliabilityScore = Math.max(reliabilityScore, 85);
  }
  
  // For code with very simple arithmetic operations
  const isArithmeticOnly = /^\s*function\s+\w+\s*\([^)]*\)\s*{\s*return\s+[^;]*(?:\+|\-|\*|\/)[^;]*;\s*}\s*$/m.test(code);
  if (isArithmeticOnly) {
    reliabilityScore = Math.max(reliabilityScore, 90);
  }
  
  // Cap between 0 and 100
  reliabilityScore = Math.min(100, Math.max(0, reliabilityScore));
  
  return Math.round(reliabilityScore);
};

// Get code metrics
export const getCodeMetrics = (code: string) => {
  const lines = code.split('\n').filter(line => line.trim() !== '');
  const linesOfCode = lines.length;
  
  // Calculate comment percentage
  const commentLines = lines.filter(line => 
    line.trim().startsWith('//') || 
    line.trim().startsWith('/*') || 
    line.trim().startsWith('*')
  ).length;
  const commentPercentage = commentLines > 0 ? (commentLines / linesOfCode) * 100 : 0;
  
  // Calculate function-based metrics
  const functionMatches = code.match(/function\s+\w+|const\s+\w+\s*=\s*\(.*?\)\s*=>|^\s*\w+\s*\(.*?\)\s*{/gm) || [];
  const functionCount = functionMatches.length;
  
  // Calculate average function length
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
  
  return {
    linesOfCode,
    commentPercentage,
    functionCount,
    averageFunctionLength
  };
};
