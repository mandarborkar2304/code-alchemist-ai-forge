
import { CodeQualityRating } from "@/types";

// Standardized rating system for code quality metrics
export const getRatingFromScore = (score: number, metricType: 'cyclomaticComplexity' | 'maintainability' | 'reliability'): CodeQualityRating => {
  // Adjust scoring criteria based on metric type
  if (metricType === 'cyclomaticComplexity') {
    // For cyclomatic complexity, lower is better
    if (score <= 10) {
      return { 
        score: 'A', 
        description: 'Low complexity', 
        reason: 'The code has a straightforward control flow with minimal decision points.',
        issues: [],
        improvements: ['Code maintains an excellent level of simplicity']
      };
    } else if (score <= 20) {
      return { 
        score: 'B', 
        description: 'Moderate complexity', 
        reason: 'The code has a reasonable number of decision points.',
        issues: ['Some conditional branches increase complexity'],
        improvements: ['Consider extracting complex conditions into named functions']
      };
    } else if (score <= 30) {
      return { 
        score: 'C', 
        description: 'High complexity', 
        reason: 'Code contains numerous decision points making it difficult to follow.',
        issues: ['Multiple nested conditions', 'Complex logical expressions'],
        improvements: ['Break down complex methods into smaller functions', 'Simplify logical conditions']
      };
    } else {
      return { 
        score: 'D', 
        description: 'Extreme complexity', 
        reason: 'Code has excessive decision points making it highly prone to errors.',
        issues: ['Excessive nesting', 'Too many decision paths', 'Complex conditional logic'],
        improvements: ['Refactor using strategy pattern', 'Break down into multiple files/modules', 'Simplify logic flow']
      };
    }
  } else if (metricType === 'maintainability') {
    // For maintainability, higher is better
    if (score >= 70) { // Lowered threshold to ensure simple code gets A
      return { 
        score: 'A', 
        description: 'Highly maintainable', 
        reason: 'Code is well-structured, modular, and easy to modify.',
        issues: [],
        improvements: ['Code is already highly maintainable']
      };
    } else if (score >= 50) {
      return { 
        score: 'B', 
        description: 'Maintainable', 
        reason: 'Code is reasonably structured but has some areas for improvement.',
        issues: ['Some functions could be more modular'],
        improvements: ['Add more descriptive comments', 'Consider extracting some functionality into helper methods']
      };
    } else if (score >= 30) {
      return { 
        score: 'C', 
        description: 'Difficult to maintain', 
        reason: 'Code has structural issues that make modifications challenging.',
        issues: ['Functions are too long', 'Poor separation of concerns', 'Limited comments'],
        improvements: ['Break down large functions', 'Add comprehensive documentation', 'Improve function naming']
      };
    } else {
      return { 
        score: 'D', 
        description: 'Very difficult to maintain', 
        reason: 'Code structure is problematic and modifications would likely introduce bugs.',
        issues: ['Extremely long functions', 'Unclear variable names', 'No clear organization', 'Duplicated code'],
        improvements: ['Major refactoring needed', 'Restructure into a more modular design', 'Follow single responsibility principle']
      };
    }
  } else { // reliability
    // For reliability, higher is better
    if (score >= 70) { // Lowered threshold to ensure simple code gets A
      return { 
        score: 'A', 
        description: 'Highly reliable', 
        reason: 'Code handles errors properly and validates inputs thoroughly.',
        issues: [],
        improvements: ['Code is already designed with good reliability practices']
      };
    } else if (score >= 50) {
      return { 
        score: 'B', 
        description: 'Reliable with minor issues', 
        reason: 'Code has decent error handling but some edge cases may be missed.',
        issues: ['Some edge cases may not be handled'],
        improvements: ['Add more comprehensive input validation', 'Consider additional error cases']
      };
    } else if (score >= 30) {
      return { 
        score: 'C', 
        description: 'Reliability concerns', 
        reason: 'Code lacks proper error handling in several areas.',
        issues: ['Inadequate error handling', 'Limited input validation', 'Potential runtime exceptions'],
        improvements: ['Implement try-catch blocks', 'Add input validation', 'Handle null/undefined values']
      };
    } else {
      return { 
        score: 'D', 
        description: 'Highly unreliable', 
        reason: 'Code is likely to fail in many scenarios without proper error handling.',
        issues: ['No error handling', 'Missing input validation', 'Potential for frequent crashes'],
        improvements: ['Add comprehensive error handling', 'Implement thorough input validation', 'Add defensive programming techniques']
      };
    }
  }
};
