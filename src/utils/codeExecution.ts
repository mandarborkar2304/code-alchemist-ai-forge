// Helper function to extract actual code execution based on language and input
export const executeCode = (code: string, input: string, language: string): string => {
  // In a real implementation, this would execute the code in a sandbox
  // For our mock, we'll simulate execution based on code patterns
  
  if (code.includes('function sum') || code.includes('const sum')) {
    if (input.includes('sum(5, 3)')) return '8';
    if (input.includes('sum(-5, 5)')) return '0';
    if (input.includes('sum("5", 3)')) return 'Error: Invalid input types';
  }
  
  if (code.includes('function filter') || code.includes('array.filter')) {
    if (input.includes('filter([1,2,3,4,5]')) return '[4,5]';
    if (input.includes('filter([])')) return '[]';
    if (input.includes('filter(null')) return 'Error: Cannot read properties of null';
  }
  
  if (code.includes('try') && code.includes('catch')) {
    if (input.includes('null') || input.includes('undefined')) {
      return 'Error: Invalid input';
    }
  }
  
  // Handle common web scenarios
  if (language === 'web') {
    if (input.includes('querySelector') || input.includes('getElementById')) {
      return 'Element reference';
    }
    if (input.includes('addEventListener')) {
      return 'Event registered successfully';
    }
  }
  
  // Handle common patterns
  if (code.includes('async') || code.includes('await')) {
    if (input.includes('Promise') || input.includes('fetch')) {
      return 'Promise resolved with data';
    }
  }
  
  // Default response based on expected patterns
  if (input.includes('sort')) return 'Sorted array';
  if (input.includes('map')) return 'Transformed array';
  if (input.includes('reduce')) return 'Reduced value';
  
  return 'Could not determine exact output - would require actual execution';
};

const languagePatterns = {
  python: {
    patterns: [
      /def\s+\w+\s*\([^)]*\):/,
      /import\s+[\w.]+/,
      /print\s*\(/,
      /#.*$/m
    ],
    keywords: ['def', 'class', 'import', 'from', 'lambda', 'self']
  },
  javascript: {
    patterns: [
      /function\s+\w+\s*\([^)]*\)\s*{/,
      /const\s+|let\s+|var\s+/,
      /=>/,
      /console\.(log|error|warn)/
    ],
    keywords: ['function', 'const', 'let', 'var', 'await', 'async']
  },
  go: {
    patterns: [
      /func\s+\w+\s*\([^)]*\)\s*{/,
      /package\s+\w+/,
      /import\s+\([^)]*\)/,
      /fmt\.(Print|Scan)/
    ],
    keywords: ['func', 'package', 'import', 'var', 'const', 'struct']
  },
  cpp: {
    patterns: [
      /#include\s*<[^>]+>/,
      /std::/,
      /using\s+namespace\s+std;/,
      /cout\s*<<|cin\s*>>/
    ],
    keywords: ['class', 'public:', 'private:', 'template', 'namespace']
  },
  java: {
    patterns: [
      /public\s+class\s+\w+/,
      /System\.(out|in)\./,
      /import\s+java\./,
      /@Override/
    ],
    keywords: ['public', 'private', 'class', 'void', 'static']
  }
};

export const detectCodeLanguage = (code: string): string | null => {
  if (!code.trim()) return null;
  
  const scores = Object.entries(languagePatterns).map(([lang, patterns]) => {
    let score = 0;
    
    // Check patterns
    patterns.patterns.forEach(pattern => {
      if (pattern.test(code)) score += 2;
    });
    
    // Check keywords
    patterns.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) score += matches.length;
    });
    
    return { language: lang, score };
  });
  
  const bestMatch = scores.reduce((max, current) => 
    current.score > max.score ? current : max
  );
  
  return bestMatch.score > 3 ? bestMatch.language : null;
};
