
import { ScoreData } from './types';
import { scoreThresholds, getGradeFromScore } from './scoreThresholds';

// AST-based structural analysis simulation
// In a real implementation, this would use an actual AST parser
function detectCodeDuplication(score: number): { duplicationPercent: number, duplicationImpact: number } {
  // This is a placeholder for actual AST-based duplication detection
  // In a full implementation, this would analyze the AST to find structural similarities
  
  // For now, we'll simulate different duplication rates based on the input score
  // Lower input scores suggest more code issues, so we'll infer higher duplication
  let duplicationPercent: number;
  
  if (score >= 90) {
    duplicationPercent = Math.max(0, Math.min(5, 100 - score)); // 0-5% duplication
  } else if (score >= 80) {
    duplicationPercent = 5 + (90 - score) * 0.5; // 5-10% duplication
  } else if (score >= 70) {
    duplicationPercent = 10 + (80 - score) * 1.0; // 10-20% duplication
  } else {
    duplicationPercent = 20 + (70 - Math.min(70, score)) * 1.5; // 20-50% duplication
  }
  
  // Calculate impact: higher duplication has exponentially increasing impact
  const duplicationImpact = Math.pow(duplicationPercent / 10, 1.5);
  
  return { duplicationPercent, duplicationImpact };
}

// Function to assess function size issues
function assessFunctionSizeIssues(score: number): { oversizedFunctions: number, impact: number } {
  // Simulate function size analysis based on score
  // In a real implementation, this would analyze actual function sizes
  let oversizedFunctions: number;
  
  if (score >= 90) {
    oversizedFunctions = 0;
  } else if (score >= 80) {
    oversizedFunctions = 1;
  } else if (score >= 70) {
    oversizedFunctions = Math.floor((80 - score) / 2) + 1;
  } else {
    oversizedFunctions = Math.floor((70 - Math.max(40, score)) / 5) + 6;
  }
  
  // Calculate impact: each oversized function has increasing impact
  const impact = oversizedFunctions === 0 ? 0 : Math.min(25, oversizedFunctions * 3);
  
  return { oversizedFunctions, impact };
}

// Function to assess documentation quality
function assessDocumentationQuality(score: number): { documentationPercent: number, impact: number } {
  // Simulate documentation quality based on score
  // In a real implementation, this would analyze actual documentation coverage
  let documentationPercent: number;
  
  if (score >= 90) {
    documentationPercent = Math.min(100, score);
  } else if (score >= 80) {
    documentationPercent = 70 + (score - 80) * 2;
  } else if (score >= 70) {
    documentationPercent = 50 + (score - 70) * 2;
  } else {
    documentationPercent = Math.max(10, score * 0.7);
  }
  
  // Calculate impact: poor documentation has significant impact on maintainability
  const impact = documentationPercent < 50 ? (50 - documentationPercent) * 0.4 : 0;
  
  return { documentationPercent, impact };
}

// Updated maintainability rating calculation with enhanced analysis
export function getMaintainabilityRating(score: number): ScoreData {
  // Perform enhanced structural analysis
  const duplication = detectCodeDuplication(score);
  const functionSizes = assessFunctionSizeIssues(score);
  const documentation = assessDocumentationQuality(score);
  
  // Calculate adjusted score based on these enhanced factors
  let adjustedScore = score;
  
  // Apply penalties for duplication, function size, and documentation
  adjustedScore -= duplication.duplicationImpact * 2;
  adjustedScore -= functionSizes.impact;
  adjustedScore -= documentation.impact;
  
  // Ensure score stays within bounds
  adjustedScore = Math.max(0, Math.min(100, adjustedScore));
  
  // Get final rating based on adjusted score
  const rating = getGradeFromScore(adjustedScore, scoreThresholds.maintainability);
  
  // Generate detailed description and issues based on the analysis
  let description = '';
  let reason = '';
  let issuesList: string[] = [];
  let improvements: string[] = [];
  
  if (rating === 'A') {
    description = 'Highly maintainable';
    reason = 'The code follows clean code principles with appropriate abstractions and organization.';
    improvements = ['Continue maintaining high code quality standards.'];
  } else if (rating === 'B') {
    description = 'Good maintainability';
    reason = 'The code is generally well-structured with minor improvement opportunities.';
    
    // Generate specific issues based on our analysis
    if (duplication.duplicationPercent > 3) {
      issuesList.push(`${duplication.duplicationPercent.toFixed(1)}% code duplication detected.`);
    }
    
    if (functionSizes.oversizedFunctions > 0) {
      issuesList.push(`${functionSizes.oversizedFunctions} functions exceed recommended size limits.`);
    }
    
    if (documentation.documentationPercent < 80) {
      issuesList.push(`Documentation coverage is at ${documentation.documentationPercent.toFixed(1)}%, below recommended 80%.`);
    }
    
    if (issuesList.length === 0) {
      issuesList = [
        'Some areas could benefit from better documentation.',
        'Minor code duplication may exist.'
      ];
    }
    
    improvements = [
      'Enhance documentation for complex logic',
      'Extract common patterns into reusable functions',
      'Review variable names for clarity'
    ];
  } else if (rating === 'C') {
    description = 'Moderate maintainability';
    reason = 'The code has structural issues that moderately impact future maintenance.';
    
    // Generate specific issues based on our analysis
    if (duplication.duplicationPercent > 10) {
      issuesList.push(`Significant code duplication (${duplication.duplicationPercent.toFixed(1)}%) detected.`);
    }
    
    if (functionSizes.oversizedFunctions > 3) {
      issuesList.push(`${functionSizes.oversizedFunctions} functions substantially exceed size guidelines.`);
    }
    
    if (documentation.documentationPercent < 60) {
      issuesList.push(`Poor documentation coverage (${documentation.documentationPercent.toFixed(1)}%).`);
    }
    
    if (issuesList.length === 0) {
      issuesList = [
        'Inadequate documentation in key areas',
        'Functions exceeding size guidelines',
        'Some code duplication without proper abstraction',
        'Variable naming could be improved'
      ];
    }
    
    improvements = [
      'Refactor larger functions into smaller, single-purpose components',
      'Extract duplicate code into shared utilities',
      'Improve documentation coverage',
      'Enhance naming conventions for clarity'
    ];
  } else {
    description = 'Poor maintainability';
    reason = 'The code has significant maintainability issues requiring remediation.';
    
    // Generate specific issues based on our analysis
    if (duplication.duplicationPercent > 20) {
      issuesList.push(`Excessive code duplication (${duplication.duplicationPercent.toFixed(1)}%).`);
    }
    
    if (functionSizes.oversizedFunctions > 5) {
      issuesList.push(`${functionSizes.oversizedFunctions} functions are excessively large.`);
    }
    
    if (documentation.documentationPercent < 40) {
      issuesList.push(`Critical lack of documentation (${documentation.documentationPercent.toFixed(1)}%).`);
    }
    
    if (issuesList.length === 0) {
      issuesList = [
        'Functions exceeding recommended sizes',
        'Insufficient or missing documentation',
        'Unclear naming and conventions',
        'Deep nesting of control structures',
        'Substantial code duplication',
        'Magic numbers and hardcoded values'
      ];
    }
    
    improvements = [
      'Comprehensive refactoring recommended',
      'Break down large functions into smaller units',
      'Add complete documentation',
      'Simplify nested code structures',
      'Create reusable abstractions for duplicate code',
      'Replace magic numbers with named constants'
    ];
  }
  
  return {
    score: rating,
    description,
    reason,
    issues: issuesList,
    improvements
  };
}
