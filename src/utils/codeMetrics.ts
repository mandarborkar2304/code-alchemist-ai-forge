
/**
 * Utility functions for calculating code metrics
 */

// Calculate cyclomatic complexity of code
export const calculateCyclomaticComplexity = (code: string): number => {
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

// Calculate maintainability index
export const calculateMaintainability = (code: string): number => {
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
  const cyclomaticComplexity = calculateCyclomaticComplexity(code);
  let maintainability = 100 - (linesOfCode * 0.1) - (cyclomaticComplexity * 0.2) - (maxNesting * 5) + (commentPercentage * 0.4) + (functionCount > 0 ? 10 : 0);
  
  // Cap between 0 and 100
  maintainability = Math.min(100, Math.max(0, maintainability));
  
  return Math.round(maintainability);
};

// Calculate reliability score
export const calculateReliability = (code: string): number => {
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
  const commentPercentage = (commentLines / linesOfCode) * 100;
  
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
