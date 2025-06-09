
import { ReliabilityIssue } from '@/types';

export interface ComplexityResult {
  timeComplexity: string;
  spaceComplexity: string;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  factors: string[];
}

export interface ComplexityAnalysis {
  time: ComplexityResult;
  space: ComplexityResult;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

// Analyze time complexity based on control structures
export function analyzeTimeComplexity(code: string, language: string): ComplexityResult {
  const lines = code.split('\n');
  let maxComplexity = 'O(1)';
  let confidence: 'high' | 'medium' | 'low' = 'high';
  const factors: string[] = [];
  
  // Detect nested loops
  const nestedLoopDepth = detectNestedLoops(code);
  if (nestedLoopDepth >= 3) {
    maxComplexity = 'O(n³)';
    factors.push(`Triple nested loops detected (depth: ${nestedLoopDepth})`);
    confidence = 'high';
  } else if (nestedLoopDepth === 2) {
    maxComplexity = 'O(n²)';
    factors.push('Double nested loops detected');
    confidence = 'high';
  } else if (nestedLoopDepth === 1) {
    maxComplexity = 'O(n)';
    factors.push('Single loop detected');
    confidence = 'high';
  }
  
  // Detect recursion
  const recursionDepth = detectRecursion(code, language);
  if (recursionDepth > 0) {
    if (hasExponentialRecursion(code)) {
      maxComplexity = compareComplexity(maxComplexity, 'O(2ⁿ)');
      factors.push('Exponential recursion pattern detected');
      confidence = 'medium';
    } else if (hasDivideAndConquer(code)) {
      maxComplexity = compareComplexity(maxComplexity, 'O(n log n)');
      factors.push('Divide and conquer recursion detected');
      confidence = 'medium';
    } else {
      maxComplexity = compareComplexity(maxComplexity, 'O(n)');
      factors.push('Linear recursion detected');
      confidence = 'high';
    }
  }
  
  // Detect sorting/searching patterns
  if (hasSortingPattern(code)) {
    maxComplexity = compareComplexity(maxComplexity, 'O(n log n)');
    factors.push('Sorting algorithm pattern detected');
    confidence = 'medium';
  }
  
  if (hasBinarySearchPattern(code)) {
    maxComplexity = compareComplexity(maxComplexity, 'O(log n)');
    factors.push('Binary search pattern detected');
    confidence = 'medium';
  }
  
  const explanation = generateTimeComplexityExplanation(maxComplexity, factors);
  
  return {
    timeComplexity: maxComplexity,
    spaceComplexity: '', // Will be set by space analysis
    confidence,
    explanation,
    factors
  };
}

// Analyze space complexity based on data structures and recursion
export function analyzeSpaceComplexity(code: string, language: string): ComplexityResult {
  let maxComplexity = 'O(1)';
  let confidence: 'high' | 'medium' | 'low' = 'high';
  const factors: string[] = [];
  
  // Detect dynamic data structures
  const dynamicStructures = detectDynamicDataStructures(code, language);
  if (dynamicStructures.length > 0) {
    maxComplexity = 'O(n)';
    factors.push(`Dynamic data structures: ${dynamicStructures.join(', ')}`);
    confidence = 'high';
  }
  
  // Detect recursion depth impact on stack space
  const recursionDepth = detectRecursion(code, language);
  if (recursionDepth > 0) {
    if (hasExponentialRecursion(code)) {
      maxComplexity = compareComplexity(maxComplexity, 'O(2ⁿ)');
      factors.push('Exponential space due to recursion tree');
      confidence = 'medium';
    } else {
      maxComplexity = compareComplexity(maxComplexity, 'O(n)');
      factors.push('Linear space due to recursion stack');
      confidence = 'high';
    }
  }
  
  // Detect auxiliary space usage
  const auxiliarySpace = detectAuxiliarySpace(code);
  if (auxiliarySpace.complexity !== 'O(1)') {
    maxComplexity = compareComplexity(maxComplexity, auxiliarySpace.complexity);
    factors.push(auxiliarySpace.reason);
    confidence = 'medium';
  }
  
  const explanation = generateSpaceComplexityExplanation(maxComplexity, factors);
  
  return {
    timeComplexity: '', // Will be set by time analysis
    spaceComplexity: maxComplexity,
    confidence,
    explanation,
    factors
  };
}

// Combined complexity analysis
export function analyzeComplexity(code: string, language: string): ComplexityAnalysis {
  const timeResult = analyzeTimeComplexity(code, language);
  const spaceResult = analyzeSpaceComplexity(code, language);
  
  // Calculate overall score based on complexity
  const timeScore = getComplexityScore(timeResult.timeComplexity);
  const spaceScore = getComplexityScore(spaceResult.spaceComplexity);
  const overallScore = Math.round((timeScore * 0.6 + spaceScore * 0.4));
  
  const grade = overallScore >= 90 ? 'A' : 
                overallScore >= 80 ? 'B' : 
                overallScore >= 70 ? 'C' : 'D';
  
  return {
    time: { ...timeResult, spaceComplexity: spaceResult.spaceComplexity },
    space: { ...spaceResult, timeComplexity: timeResult.timeComplexity },
    overallScore,
    grade
  };
}

// Helper functions
function detectNestedLoops(code: string): number {
  const lines = code.split('\n');
  let maxDepth = 0;
  let currentDepth = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect loop start
    if (trimmed.match(/\b(for|while|do)\b.*{/) || 
        trimmed.match(/\bfor\b.*:/) || // Python for loops
        trimmed.includes('forEach') ||
        trimmed.includes('.map(') ||
        trimmed.includes('.filter(')) {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
    
    // Detect loop end
    if (trimmed === '}' && currentDepth > 0) {
      currentDepth--;
    }
  }
  
  return maxDepth;
}

function detectRecursion(code: string, language: string): number {
  const lines = code.split('\n');
  const functionNames = extractFunctionNames(code, language);
  
  let recursionCount = 0;
  
  for (const funcName of functionNames) {
    const funcDefinition = findFunctionDefinition(code, funcName);
    if (funcDefinition && funcDefinition.includes(funcName)) {
      recursionCount++;
    }
  }
  
  return recursionCount;
}

function hasExponentialRecursion(code: string): boolean {
  // Patterns that suggest exponential recursion (like Fibonacci)
  const patterns = [
    /\w+\s*\(\s*\w+\s*-\s*1\s*\)\s*\+\s*\w+\s*\(\s*\w+\s*-\s*2\s*\)/,
    /\w+\s*\(\s*\w+\s*\/\s*2\s*\)\s*\+\s*\w+\s*\(\s*\w+\s*\/\s*2\s*\)/
  ];
  
  return patterns.some(pattern => pattern.test(code));
}

function hasDivideAndConquer(code: string): boolean {
  // Patterns that suggest divide and conquer
  const patterns = [
    /\w+\s*\(\s*\w+\s*\/\s*2\s*\)/,
    /mid\s*=\s*\(\s*\w+\s*\+\s*\w+\s*\)\s*\/\s*2/,
    /merge\s*\(/,
    /partition\s*\(/
  ];
  
  return patterns.some(pattern => pattern.test(code));
}

function hasSortingPattern(code: string): boolean {
  const sortingKeywords = [
    'sort', 'quicksort', 'mergesort', 'heapsort', 'bubblesort',
    'insertionsort', 'selectionsort', 'Arrays.sort', '.sort('
  ];
  
  return sortingKeywords.some(keyword => code.toLowerCase().includes(keyword.toLowerCase()));
}

function hasBinarySearchPattern(code: string): boolean {
  const binarySearchPatterns = [
    /mid\s*=\s*\(\s*\w+\s*\+\s*\w+\s*\)\s*\/\s*2/,
    /\w+\s*<\s*\w+.*\w+\s*=\s*\w+\s*-\s*1/,
    /\w+\s*>\s*\w+.*\w+\s*=\s*\w+\s*\+\s*1/,
    /binarySearch/i
  ];
  
  return binarySearchPatterns.some(pattern => pattern.test(code));
}

function detectDynamicDataStructures(code: string, language: string): string[] {
  const structures: string[] = [];
  
  const patterns = {
    array: [/new\s+\w*Array/, /\[\]/, /\.push\(/, /\.pop\(/, /append\(/],
    list: [/new\s+\w*List/, /ArrayList/, /LinkedList/, /list\(/],
    map: [/new\s+\w*Map/, /HashMap/, /dict\(/, /\{\}/],
    set: [/new\s+\w*Set/, /HashSet/, /set\(/],
    stack: [/new\s+\w*Stack/, /Stack\(/],
    queue: [/new\s+\w*Queue/, /Queue\(/]
  };
  
  Object.entries(patterns).forEach(([structure, patternList]) => {
    if (patternList.some(pattern => pattern.test(code))) {
      structures.push(structure);
    }
  });
  
  return structures;
}

function detectAuxiliarySpace(code: string): { complexity: string, reason: string } {
  // Check for temporary arrays/collections
  const tempArrayPatterns = [
    /new\s+\w*\[\w+\]/,
    /\w+\s*=\s*new\s+\w*\[/,
    /temp\w*\s*=/,
    /result\s*=\s*\[/
  ];
  
  if (tempArrayPatterns.some(pattern => pattern.test(code))) {
    return { complexity: 'O(n)', reason: 'Auxiliary arrays/collections detected' };
  }
  
  return { complexity: 'O(1)', reason: 'No significant auxiliary space detected' };
}

function extractFunctionNames(code: string, language: string): string[] {
  const functions: string[] = [];
  
  const patterns = {
    javascript: [/function\s+(\w+)/g, /(\w+)\s*=\s*function/g, /(\w+)\s*=\s*\(/g],
    python: [/def\s+(\w+)/g],
    java: [/(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/g],
    cpp: [/\w+\s+(\w+)\s*\([^)]*\)\s*{/g]
  };
  
  const langPatterns = patterns[language.toLowerCase() as keyof typeof patterns] || patterns.javascript;
  
  langPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      functions.push(match[1]);
    }
  });
  
  return functions;
}

function findFunctionDefinition(code: string, funcName: string): string | null {
  const lines = code.split('\n');
  let inFunction = false;
  let functionBody = '';
  let braceCount = 0;
  
  for (const line of lines) {
    if (line.includes(`function ${funcName}`) || 
        line.includes(`def ${funcName}`) ||
        line.match(new RegExp(`\\b${funcName}\\s*\\(`))) {
      inFunction = true;
      functionBody = line;
      braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      continue;
    }
    
    if (inFunction) {
      functionBody += '\n' + line;
      braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      
      if (braceCount === 0) {
        break;
      }
    }
  }
  
  return inFunction ? functionBody : null;
}

function compareComplexity(current: string, candidate: string): string {
  const complexityOrder = [
    'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)'
  ];
  
  const currentIndex = complexityOrder.indexOf(current);
  const candidateIndex = complexityOrder.indexOf(candidate);
  
  return candidateIndex > currentIndex ? candidate : current;
}

function getComplexityScore(complexity: string): number {
  const scores: { [key: string]: number } = {
    'O(1)': 100,
    'O(log n)': 95,
    'O(n)': 85,
    'O(n log n)': 75,
    'O(n²)': 60,
    'O(n³)': 40,
    'O(2ⁿ)': 20
  };
  
  return scores[complexity] || 50;
}

function generateTimeComplexityExplanation(complexity: string, factors: string[]): string {
  let explanation = `Estimated time complexity: ${complexity}. `;
  
  if (factors.length > 0) {
    explanation += `Analysis based on: ${factors.join(', ')}.`;
  } else {
    explanation += 'No significant complexity factors detected.';
  }
  
  return explanation;
}

function generateSpaceComplexityExplanation(complexity: string, factors: string[]): string {
  let explanation = `Estimated space complexity: ${complexity}. `;
  
  if (factors.length > 0) {
    explanation += `Analysis based on: ${factors.join(', ')}.`;
  } else {
    explanation += 'Constant space usage detected.';
  }
  
  return explanation;
}
