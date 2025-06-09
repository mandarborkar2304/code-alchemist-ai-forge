
import { CodeAnalysis } from "@/types";
import { getGradeFromScore } from "./quality";

// Enhanced mock analysis with new features
export const generateMockAnalysis = (code: string, language: string): CodeAnalysis => {
  const codeLength = code.length;
  const lines = code.split('\n').length;
  
  // Basic metrics calculation (mocked)
  const reliabilityScore = Math.max(0, 100 - Math.floor(lines / 5));
  const maintainabilityScore = Math.max(0, 100 - Math.floor(codeLength / 100));
  const complexityScore = Math.max(0, 100 - Math.floor(lines / 3));
  
  const reliabilityGrade = getGradeFromScore(reliabilityScore);
  const maintainabilityGrade = getGradeFromScore(maintainabilityScore);
  const complexityGrade = getGradeFromScore(complexityScore);
  
  const hasErrors = code.includes('error') || code.includes('Exception');
  const hasSecurityVulnerability = code.includes('SQLInjection') || code.includes('XSS');
  
  const errorMessages = hasErrors ? ['Potential runtime error'] : [];
  const securityIssues = hasSecurityVulnerability ? ['Possible SQL injection vulnerability'] : [];
  
  const totalIssues = errorMessages.length + securityIssues.length;
  
  const analysisSummary = `Analysis found ${totalIssues} potential issues.`;
  
  // Enhanced analysis with new complexity and code smells data
  const enhancedAnalysis: CodeAnalysis = {
    summary: analysisSummary,
    metrics: {
      linesOfCode: lines,
      codeLength: codeLength,
      commentDensity: Math.random() * 10,
      indentation: 2,
      readability: Math.random() * 10,
      complexity: complexityScore,
      duplication: Math.random() * 10,
      security: Math.random() * 10
    },
    reliability: {
      score: reliabilityScore,
      grade: reliabilityGrade,
      issues: errorMessages.concat(securityIssues)
    },
    maintainability: {
      score: maintainabilityScore,
      grade: maintainabilityGrade,
      technicalDebt: Math.random() * 100
    },
    cyclomaticComplexity: {
      score: complexityScore,
      grade: complexityGrade,
      explanation: 'Mock cyclomatic complexity calculation'
    },
    complexity: {
      time: {
        timeComplexity: mockTimeComplexity(code),
        confidence: 'high' as const,
        explanation: generateComplexityExplanation(code, 'time'),
        factors: extractComplexityFactors(code, 'time')
      },
      space: {
        spaceComplexity: mockSpaceComplexity(code),
        confidence: 'medium' as const,
        explanation: generateComplexityExplanation(code, 'space'),
        factors: extractComplexityFactors(code, 'space')
      },
      overallScore: calculateComplexityScore(code),
      grade: getComplexityGrade(calculateComplexityScore(code))
    },
    codeSmells: {
      smells: generateMockCodeSmells(code, lines),
      summary: {
        total: Math.min(5, Math.floor(lines / 10)),
        major: Math.min(2, Math.floor(lines / 25)),
        minor: Math.min(3, Math.floor(lines / 15)),
        byCategory: {
          Method: Math.floor(lines / 30),
          Structure: Math.floor(lines / 40),
          Naming: Math.floor(lines / 50),
          Logic: Math.floor(lines / 35),
          Performance: Math.floor(lines / 45)
        }
      },
      score: Math.max(60, 100 - Math.floor(lines / 5)),
      grade: getGradeFromScore(Math.max(60, 100 - Math.floor(lines / 5)))
    },
    recommendations: {
      recommendations: generateMockRecommendations(code, language, lines),
      prioritizedActions: [],
      summary: {
        total: Math.min(6, Math.floor(lines / 8)),
        highPriority: Math.min(2, Math.floor(lines / 20)),
        categories: {
          Performance: Math.floor(lines / 25),
          Maintainability: Math.floor(lines / 20),
          Reliability: Math.floor(lines / 30),
          Style: Math.floor(lines / 40)
        }
      }
    },
    violations: {
      violations: [],
      summary: {
        totalViolations: 0,
        sonarQubeBreakdown: { blocker: 0, critical: 0, major: 0, minor: 0, info: 0 },
        totalDebt: 0
      },
      grade: 'A'
    },
    aiSuggestions: [
      {
        type: 'improvement',
        description: 'Consider adding more comments for better code documentation',
        confidence: 0.8,
        lineNumber: 1
      }
    ],
    testCases: [
      {
        input: 'sample input',
        expectedOutput: 'sample output',
        passed: true,
        executionTime: 100
      }
    ]
  };
  
  return enhancedAnalysis;
};

// Helper functions for new mock data
function mockTimeComplexity(code: string): string {
  const nestedLoops = (code.match(/for\s*\(.*for\s*\(/g) || []).length;
  const recursion = (code.match(/function\s+\w+.*{\s*.*\w+\s*\(/g) || []).length;
  
  if (nestedLoops >= 2) return 'O(n³)';
  if (nestedLoops >= 1) return 'O(n²)';
  if (recursion > 0 && code.includes('fibonacci')) return 'O(2ⁿ)';
  if (recursion > 0) return 'O(n)';
  if (code.includes('sort') || code.includes('Sort')) return 'O(n log n)';
  if (code.includes('for') || code.includes('while')) return 'O(n)';
  return 'O(1)';
}

function mockSpaceComplexity(code: string): string {
  const arrays = (code.match(/new\s+\w*Array|new\s+\w*\[|\[\]/g) || []).length;
  const recursion = (code.match(/function\s+\w+.*{\s*.*\w+\s*\(/g) || []).length;
  
  if (recursion > 0 && code.includes('fibonacci')) return 'O(2ⁿ)';
  if (arrays > 2 || recursion > 0) return 'O(n)';
  return 'O(1)';
}

function generateComplexityExplanation(code: string, type: 'time' | 'space'): string {
  if (type === 'time') {
    if (code.includes('for') && code.includes('while')) {
      return 'Multiple loop structures detected affecting time complexity';
    }
    if (code.includes('for')) {
      return 'Loop-based operations drive the time complexity';
    }
    return 'Linear operations with constant time complexity';
  } else {
    if (code.includes('Array') || code.includes('[]')) {
      return 'Dynamic data structures contribute to space usage';
    }
    return 'Minimal auxiliary space requirements';
  }
}

function extractComplexityFactors(code: string, type: 'time' | 'space'): string[] {
  const factors: string[] = [];
  
  if (type === 'time') {
    if (code.includes('for')) factors.push('Loop iterations');
    if (code.includes('recursion') || code.includes('function')) factors.push('Recursive calls');
    if (code.includes('sort')) factors.push('Sorting operations');
  } else {
    if (code.includes('Array') || code.includes('[]')) factors.push('Array allocation');
    if (code.includes('Map') || code.includes('{}')) factors.push('Hash map usage');
    if (code.includes('recursion')) factors.push('Call stack usage');
  }
  
  return factors.length > 0 ? factors : ['No significant factors'];
}

function calculateComplexityScore(code: string): number {
  const timeComplexity = mockTimeComplexity(code);
  const spaceComplexity = mockSpaceComplexity(code);
  
  const timeScore = getComplexityScoreByType(timeComplexity);
  const spaceScore = getComplexityScoreByType(spaceComplexity);
  
  return Math.round(timeScore * 0.6 + spaceScore * 0.4);
}

function getComplexityScoreByType(complexity: string): number {
  const scores: { [key: string]: number } = {
    'O(1)': 100,
    'O(log n)': 95,
    'O(n)': 85,
    'O(n log n)': 75,
    'O(n²)': 60,
    'O(n³)': 40,
    'O(2ⁿ)': 20
  };
  return scores[complexity] || 70;
}

function getComplexityGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

function generateMockCodeSmells(code: string, lines: number): any[] {
  const smells: any[] = [];
  
  // Long method smell
  if (lines > 30) {
    smells.push({
      type: 'Long Method',
      severity: lines > 50 ? 'Major' : 'Minor',
      description: `Function appears to be ${lines} lines long`,
      line: Math.floor(lines / 2),
      suggestion: 'Break this method into smaller, focused functions',
      category: 'Method'
    });
  }
  
  // Magic numbers
  const numbers = code.match(/\b\d{2,}\b/g);
  if (numbers && numbers.length > 0) {
    smells.push({
      type: 'Magic Number',
      severity: 'Minor',
      description: `Magic number '${numbers[0]}' found`,
      line: Math.floor(Math.random() * lines) + 1,
      suggestion: 'Replace with a named constant',
      category: 'Naming'
    });
  }
  
  // Deep nesting (estimated)
  const braces = (code.match(/{/g) || []).length;
  if (braces > lines * 0.3) {
    smells.push({
      type: 'Deep Nesting',
      severity: 'Major',
      description: 'Deep nesting detected',
      line: Math.floor(lines * 0.7),
      suggestion: 'Reduce nesting by extracting methods',
      category: 'Structure'
    });
  }
  
  // Duplicate code (simulated)
  if (lines > 20 && code.length > 500) {
    smells.push({
      type: 'Duplicate Code',
      severity: 'Major',
      description: 'Potential code duplication detected',
      suggestion: 'Extract common code into reusable functions',
      category: 'Structure'
    });
  }
  
  return smells;
}

function generateMockRecommendations(code: string, language: string, lines: number): any[] {
  const recommendations: any[] = [];
  
  // Performance recommendations
  if (code.includes('for') && code.includes('for')) {
    recommendations.push({
      title: 'Optimize Nested Loops',
      description: 'Consider using more efficient algorithms to reduce time complexity',
      priority: 'High',
      category: 'Performance',
      actionable: true,
      impact: 'Significant performance improvement for large datasets'
    });
  }
  
  // Maintainability recommendations
  if (lines > 25) {
    recommendations.push({
      title: 'Break Down Large Functions',
      description: 'Extract smaller, focused functions for better maintainability',
      priority: 'Medium',
      category: 'Maintainability',
      actionable: true,
      impact: 'Improves code readability and makes testing easier'
    });
  }
  
  // Reliability recommendations
  if (code.includes('null') || code.includes('undefined')) {
    recommendations.push({
      title: 'Add Null Safety Checks',
      description: 'Add proper null/undefined checks to prevent runtime errors',
      priority: 'High',
      category: 'Reliability',
      actionable: true,
      impact: 'Prevents potential application crashes'
    });
  }
  
  // Style recommendations
  const numbers = code.match(/\b\d{2,}\b/g);
  if (numbers && numbers.length > 2) {
    recommendations.push({
      title: 'Replace Magic Numbers',
      description: 'Replace magic numbers with named constants',
      priority: 'Low',
      category: 'Style',
      actionable: true,
      impact: 'Makes code more self-documenting'
    });
  }
  
  return recommendations;
}
