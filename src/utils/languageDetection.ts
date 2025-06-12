interface LanguagePattern {
  patterns: RegExp[];
  keywords: string[];
}

const languagePatterns: Record<string, LanguagePattern> = {
  "Bash": {
    patterns: [/#!/, /echo /, /\$[a-zA-Z_][a-zA-Z0-9_]*/],
    keywords: ['if', 'fi', 'then', 'else', 'echo']
  },
  "C": {
    patterns: [/#include\s+<[^>]+>/, /int\s+main\s*\(/, /printf\s*\(/],
    keywords: ['#include', 'printf', 'scanf', 'malloc', 'free']
  },
  "C++": {
    patterns: [/#include\s+<[^>]+>/, /int\s+main\s*\(/, /cout\s*<</],
    keywords: ['#include', 'cout', 'cin', 'std::', 'template']
  },
  "C#": {
    patterns: [/using\s+System/, /namespace\s+/, /Console\.WriteLine/],
    keywords: ['class', 'namespace', 'using', 'public', 'static']
  },
  "Dart": {
    patterns: [/void\s+main\s*\(/, /import\s+['"]/, /print\(/],
    keywords: ['import', 'class', 'void', 'Future', 'async']
  },
  "Go": {
    patterns: [/package\s+main/, /import\s+\(/, /func\s+main\s*\(/],
    keywords: ['package', 'func', 'import', 'defer', 'go']
  },
  "HTML/CSS/JS": {
    patterns: [/<html>/i, /<script>/i, /function\s+\w+\s*\(/],
    keywords: ['document', 'window', 'getElementById', 'addEventListener']
  },
  "Java": {
    patterns: [/public\s+class\s+/, /System\.out\.println/],
    keywords: ['public', 'class', 'static', 'void', 'extends']
  },
  "Java 19": {
    patterns: [/public\s+class\s+/, /System\.out\.println/],
    keywords: ['public', 'class', 'static', 'void', 'record', 'sealed']
  },
  "Kotlin": {
    patterns: [/fun\s+main\(\)/, /import\s+/, /class\s+/],
    keywords: ['fun', 'val', 'var', 'class', 'object', 'companion']
  },
  "Lua": {
    patterns: [/function\s+/, /end/, /local\s+/],
    keywords: ['local', 'function', 'end', 'table', 'require']
  },
  "Node.js": {
    patterns: [/require\s*\(/, /console\.log/, /async\s+function/],
    keywords: ['require', 'module', 'exports', 'async', 'await']
  },
  "Objective-C": {
    patterns: [/@interface\s+/, /@implementation/, /NSLog\(/],
    keywords: ['@interface', '@implementation', 'NSLog', 'self', 'instancetype']
  },
  "Perl": {
    patterns: [/\buse\s+strict;/, /\buse\s+warnings;/, /\bmy\s+\$/],
    keywords: ['my', 'sub', 'use', 'strict', 'print']
  },
  "PHP": {
    patterns: [/^\<\?php/, /echo\s+/, /\$[a-zA-Z_]/],
    keywords: ['<?php', 'echo', 'function', 'class', 'public']
  },
  "Python": {
    patterns: [/def\s+\w+\(/, /import\s+/, /print\(/],
    keywords: ['def', 'class', 'import', 'self', 'lambda']
  },
  "Python 3": {
    patterns: [/def\s+\w+\(/, /import\s+/, /print\(/],
    keywords: ['def', 'class', 'import', 'self', 'lambda', 'async']
  },
  "Python with ML": {
    patterns: [/pandas/, /sklearn/, /numpy/],
    keywords: ['pandas', 'sklearn', 'DataFrame', 'fit', 'predict']
  },
  "R": {
    patterns: [/library\(/, /<-/, /function\s*\(/],
    keywords: ['library', '<-', 'data.frame', 'function', 'ggplot']
  }
};

export const detectCodeLanguage = (code: string): string | null => {
  if (!code.trim()) return null;

  const scores = Object.entries(languagePatterns).map(([lang, patterns]) => {
    let score = 0;
    patterns.patterns.forEach(pattern => {
      if (pattern.test(code)) score += 2;
    });

    patterns.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) score += matches.length;
    });

    return { language: lang, score };
  });

  const bestMatch = scores.reduce((max, current) => current.score > max.score ? current : max);
  return bestMatch.score > 3 ? bestMatch.language : null;
};
