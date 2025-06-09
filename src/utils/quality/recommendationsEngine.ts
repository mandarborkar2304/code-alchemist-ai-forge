
import { CodeAnalysis } from '@/types';
import { CodeSmellsResult } from './codeSmellsDetector';
import { ComplexityAnalysis } from './complexityAnalysis';

export interface Recommendation {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Performance' | 'Maintainability' | 'Reliability' | 'Style';
  actionable: boolean;
  codeExample?: string;
  impact: string;
}

export interface RecommendationsResult {
  recommendations: Recommendation[];
  prioritizedActions: Recommendation[];
  summary: {
    total: number;
    highPriority: number;
    categories: { [key: string]: number };
  };
}

export function generateRecommendations(
  analysis: CodeAnalysis,
  codeSmells: CodeSmellsResult,
  complexity: ComplexityAnalysis
): RecommendationsResult {
  const recommendations: Recommendation[] = [];
  
  // Performance recommendations based on complexity
  recommendations.push(...generatePerformanceRecommendations(complexity));
  
  // Maintainability recommendations based on code smells
  recommendations.push(...generateMaintainabilityRecommendations(codeSmells));
  
  // Reliability recommendations based on analysis
  recommendations.push(...generateReliabilityRecommendations(analysis));
  
  // Style recommendations
  recommendations.push(...generateStyleRecommendations(codeSmells));
  
  // Remove duplicates and prioritize
  const uniqueRecommendations = removeDuplicateRecommendations(recommendations);
  const prioritizedActions = uniqueRecommendations
    .filter(r => r.priority === 'High')
    .slice(0, 5); // Limit to top 5 high-priority items
  
  const summary = {
    total: uniqueRecommendations.length,
    highPriority: prioritizedActions.length,
    categories: categorizeRecommendations(uniqueRecommendations)
  };
  
  return {
    recommendations: uniqueRecommendations,
    prioritizedActions,
    summary
  };
}

function generatePerformanceRecommendations(complexity: ComplexityAnalysis): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Time complexity recommendations
  if (complexity.time.timeComplexity === 'O(n²)' || complexity.time.timeComplexity === 'O(n³)') {
    recommendations.push({
      title: 'Optimize Nested Loops',
      description: `Current time complexity is ${complexity.time.timeComplexity}. Consider using more efficient algorithms or data structures.`,
      priority: 'High',
      category: 'Performance',
      actionable: true,
      codeExample: `// Instead of nested loops:
for (int i = 0; i < n; i++) {
  for (int j = 0; j < n; j++) {
    // O(n²) operation
  }
}

// Consider using HashMap for O(1) lookups:
Map<String, Integer> lookup = new HashMap<>();`,
      impact: 'Significant performance improvement for large datasets'
    });
  }
  
  if (complexity.time.timeComplexity === 'O(2ⁿ)') {
    recommendations.push({
      title: 'Optimize Exponential Algorithm',
      description: 'Exponential time complexity detected. Consider using dynamic programming or memoization.',
      priority: 'High',
      category: 'Performance',
      actionable: true,
      codeExample: `// Add memoization to recursive functions:
const memo = new Map();
function fibonacci(n) {
  if (memo.has(n)) return memo.get(n);
  if (n <= 1) return n;
  const result = fibonacci(n-1) + fibonacci(n-2);
  memo.set(n, result);
  return result;
}`,
      impact: 'Reduces time complexity from O(2ⁿ) to O(n)'
    });
  }
  
  // Space complexity recommendations
  if (complexity.space.spaceComplexity === 'O(n²)' || complexity.space.spaceComplexity === 'O(2ⁿ)') {
    recommendations.push({
      title: 'Reduce Memory Usage',
      description: `Space complexity of ${complexity.space.spaceComplexity} may cause memory issues. Consider in-place operations or iterative approaches.`,
      priority: 'Medium',
      category: 'Performance',
      actionable: true,
      impact: 'Reduces memory footprint and prevents out-of-memory errors'
    });
  }
  
  return recommendations;
}

function generateMaintainabilityRecommendations(codeSmells: CodeSmellsResult): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Long method recommendations
  const longMethods = codeSmells.smells.filter(s => s.type === 'Long Method');
  if (longMethods.length > 0) {
    recommendations.push({
      title: 'Break Down Large Functions',
      description: `${longMethods.length} function(s) exceed recommended length. Break them into smaller, focused functions.`,
      priority: longMethods.some(m => m.severity === 'Major') ? 'High' : 'Medium',
      category: 'Maintainability',
      actionable: true,
      codeExample: `// Instead of one large function:
function processOrder(order) {
  // 50+ lines of code
}

// Break into smaller functions:
function validateOrder(order) { /* validation logic */ }
function calculateTotal(order) { /* calculation logic */ }
function saveOrder(order) { /* persistence logic */ }`,
      impact: 'Improves code readability and makes testing easier'
    });
  }
  
  // Duplicate code recommendations
  const duplicates = codeSmells.smells.filter(s => s.type === 'Duplicate Code');
  if (duplicates.length > 0) {
    recommendations.push({
      title: 'Extract Common Code',
      description: `${duplicates.length} instance(s) of duplicate code detected. Extract into reusable functions.`,
      priority: 'High',
      category: 'Maintainability',
      actionable: true,
      codeExample: `// Extract duplicate logic:
function validateInput(input) {
  if (!input || input.trim() === '') {
    throw new Error('Input cannot be empty');
  }
  return input.trim();
}`,
      impact: 'Reduces maintenance burden and eliminates inconsistencies'
    });
  }
  
  // Deep nesting recommendations
  const deepNesting = codeSmells.smells.filter(s => s.type === 'Deep Nesting');
  if (deepNesting.length > 0) {
    recommendations.push({
      title: 'Reduce Nesting Complexity',
      description: 'Deep nesting detected. Use early returns or extract methods to improve readability.',
      priority: 'Medium',
      category: 'Maintainability',
      actionable: true,
      codeExample: `// Instead of deep nesting:
if (user) {
  if (user.isActive) {
    if (user.hasPermission) {
      // nested logic
    }
  }
}

// Use early returns:
if (!user) return;
if (!user.isActive) return;
if (!user.hasPermission) return;
// main logic`,
      impact: 'Improves code readability and reduces cognitive complexity'
    });
  }
  
  return recommendations;
}

function generateReliabilityRecommendations(analysis: CodeAnalysis): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  if (analysis.reliability?.score && analysis.reliability.score < 80) {
    const issues = analysis.reliability.issues || [];
    
    if (Array.isArray(issues) && issues.length > 0) {
      recommendations.push({
        title: 'Address Reliability Issues',
        description: `${issues.length} reliability issue(s) detected that could cause runtime errors.`,
        priority: 'High',
        category: 'Reliability',
        actionable: true,
        codeExample: `// Add null checks:
if (object != null && object.property != null) {
  // Safe to use object.property
}

// Add error handling:
try {
  riskyOperation();
} catch (Exception e) {
  // Handle the error appropriately
}`,
        impact: 'Prevents potential crashes and improves application stability'
      });
    }
  }
  
  return recommendations;
}

function generateStyleRecommendations(codeSmells: CodeSmellsResult): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Magic numbers
  const magicNumbers = codeSmells.smells.filter(s => s.type === 'Magic Number');
  if (magicNumbers.length > 0) {
    recommendations.push({
      title: 'Replace Magic Numbers',
      description: `${magicNumbers.length} magic number(s) found. Replace with named constants.`,
      priority: 'Low',
      category: 'Style',
      actionable: true,
      codeExample: `// Instead of magic numbers:
if (age > 18) { /* ... */ }

// Use named constants:
const MINIMUM_AGE = 18;
if (age > MINIMUM_AGE) { /* ... */ }`,
      impact: 'Makes code more self-documenting and easier to maintain'
    });
  }
  
  // Naming inconsistencies
  const namingIssues = codeSmells.smells.filter(s => s.type === 'Inconsistent Naming');
  if (namingIssues.length > 0) {
    recommendations.push({
      title: 'Standardize Naming Convention',
      description: 'Inconsistent naming conventions detected. Choose and stick to one convention.',
      priority: 'Low',
      category: 'Style',
      actionable: true,
      codeExample: `// Choose one convention:
// camelCase (JavaScript/Java)
const userName = 'john';
const isLoggedIn = true;

// snake_case (Python)
const user_name = 'john';
const is_logged_in = True;`,
      impact: 'Improves code consistency and team collaboration'
    });
  }
  
  return recommendations;
}

function removeDuplicateRecommendations(recommendations: Recommendation[]): Recommendation[] {
  const seen = new Set<string>();
  return recommendations.filter(rec => {
    const key = `${rec.title}-${rec.category}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function categorizeRecommendations(recommendations: Recommendation[]): { [key: string]: number } {
  const categories: { [key: string]: number } = {};
  
  recommendations.forEach(rec => {
    categories[rec.category] = (categories[rec.category] || 0) + 1;
  });
  
  return categories;
}
