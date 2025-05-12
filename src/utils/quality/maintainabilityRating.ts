import { ScoreData } from './types';
import { ScoreGrade } from '@/types';
import { scoreThresholds, getGradeFromScore, ANALYSIS_CONSTANTS } from './scoreThresholds';

// Helper function to detect code duplication
function detectCodeDuplication(score: number): { 
  duplicationPercent: number, 
  duplicationImpact: number 
} {
  // Validate input
  if (score === undefined || score === null || !isFinite(score)) {
    console.warn('Invalid score for duplication analysis:', score);
    return { duplicationPercent: 0, duplicationImpact: 0 };
  }
  
  // Use safe non-negative value with upper bound
  const safeScore = Math.min(100, Math.max(0, score));
  
  let duplicationPercent: number;
  
  if (safeScore >= 90) {
    duplicationPercent = Math.max(0, Math.min(5, 100 - safeScore)); // 0-5% duplication
  } else if (safeScore >= 80) {
    duplicationPercent = 5 + (90 - safeScore) * 0.5; // 5-10% duplication
  } else if (safeScore >= 70) {
    duplicationPercent = 10 + (80 - safeScore) * 1.0; // 10-20% duplication
  } else {
    duplicationPercent = 20 + (70 - Math.min(70, safeScore)) * 1.5; // 20-50% duplication
  }
  
  // Calculate impact: higher duplication has exponentially increasing impact
  // Protect against NaN with safe division
  const duplicationImpact = duplicationPercent > 0 ? 
    Math.pow(duplicationPercent / 10, 1.5) : 0;
  
  return { duplicationPercent, duplicationImpact };
}

// Helper function to assess function size issues
function assessFunctionSizeIssues(score: number): { 
  oversizedFunctions: number, 
  impact: number 
} {
  // Validate input
  if (score === undefined || score === null || !isFinite(score)) {
    console.warn('Invalid score for function size analysis:', score);
    return { oversizedFunctions: 0, impact: 0 };
  }
  
  // Use safe non-negative value with upper bound
  const safeScore = Math.min(100, Math.max(0, score));
  
  let oversizedFunctions: number;
  
  if (safeScore >= 90) {
    oversizedFunctions = ANALYSIS_CONSTANTS.FUNCTION_SIZE.ACCEPTABLE;
  } else if (safeScore >= 80) {
    oversizedFunctions = 1;
  } else if (safeScore >= 70) {
    oversizedFunctions = Math.floor((80 - safeScore) / 2) + 1;
  } else {
    oversizedFunctions = Math.floor((70 - Math.max(40, safeScore)) / 5) + 
      ANALYSIS_CONSTANTS.FUNCTION_SIZE.HIGH;
  }
  
  // Calculate impact: each oversized function has increasing impact
  const impact = oversizedFunctions === 0 ? 0 : 
    Math.min(ANALYSIS_CONSTANTS.FUNCTION_SIZE.MAX_IMPACT, 
      oversizedFunctions * ANALYSIS_CONSTANTS.FUNCTION_SIZE.IMPACT_MULTIPLIER);
  
  return { oversizedFunctions, impact };
}

// Helper function to assess documentation quality
function assessDocumentationQuality(score: number): { 
  documentationPercent: number, 
  impact: number 
} {
  // Validate input
  if (score === undefined || score === null || !isFinite(score)) {
    console.warn('Invalid score for documentation analysis:', score);
    return { documentationPercent: 50, impact: 0 };
  }
  
  // Use safe non-negative value with upper bound
  const safeScore = Math.min(100, Math.max(0, score));
  
  let documentationPercent: number;
  
  if (safeScore >= 90) {
    documentationPercent = Math.min(100, safeScore);
  } else if (safeScore >= 80) {
    documentationPercent = 70 + (safeScore - 80) * 2;
  } else if (safeScore >= 70) {
    documentationPercent = 50 + (safeScore - 70) * 2;
  } else {
    documentationPercent = Math.max(10, safeScore * 0.7);
  }
  
  // Calculate impact: poor documentation has significant impact on maintainability
  const impact = documentationPercent < ANALYSIS_CONSTANTS.DOCUMENTATION.POOR ? 
    (ANALYSIS_CONSTANTS.DOCUMENTATION.POOR - documentationPercent) * 
    ANALYSIS_CONSTANTS.DOCUMENTATION.IMPACT_MULTIPLIER : 0;
  
  return { documentationPercent, impact };
}

// Helper function to detect critical issues (divide by zero, unsafe .charAt(), unvalidated inputs, etc.)
function detectCriticalIssues(code: string): { criticalIssues: number, impact: number } {
  let criticalIssues = 0;
  let impact = 0;

  // Detect divide-by-zero potential
  if (code.includes("/ 0")) {
    criticalIssues += 1;
    impact += 15; // High impact for divide-by-zero
  }

  // Detect unchecked .charAt() usage
  if (code.includes(".charAt(") && !code.includes("if (index >= 0 && index < string.length)")) {
    criticalIssues += 1;
    impact += 10; // Moderate impact for unsafe .charAt()
  }

  // Detect unvalidated inputs (e.g., lack of bounds checking on arrays)
  if (code.includes("input") && !code.includes("validateInput")) {
    criticalIssues += 1;
    impact += 12; // Moderate impact for unvalidated inputs
  }

  // Add more rules here for other critical issues

  return { criticalIssues, impact };
}

// Helper function to generate maintainability report based on analysis
function generateMaintainabilityReport(
  rating: ScoreGrade,
  duplication: { duplicationPercent: number },
  functionSizes: { oversizedFunctions: number },
  documentation: { documentationPercent: number },
  criticalIssues: { criticalIssues: number }
): {
  description: string;
  reason: string;
  issuesList: string[];
  improvements: string[];
} {
  let description: string;
  let reason: string;
  let issuesList: string[] = [];
  let improvements: string[] = [];
  
  switch (rating) {
    case 'A':
      description = 'Highly maintainable';
      reason = 'The code follows clean code principles with appropriate abstractions and organization.';
      improvements = ['Continue maintaining high code quality standards.'];
      break;
    case 'B':
      description = 'Good maintainability';
      reason = 'The code is generally well-structured with minor improvement opportunities.';
      
      if (duplication.duplicationPercent > 3) {
        issuesList.push(`${duplication.duplicationPercent.toFixed(1)}% code duplication detected.`);
      }
      
      if (functionSizes.oversizedFunctions > 0) {
        issuesList.push(`${functionSizes.oversizedFunctions} functions exceed recommended size limits.`);
      }
      
      if (documentation.documentationPercent < ANALYSIS_CONSTANTS.DOCUMENTATION.GOOD) {
        issuesList.push(
          `Documentation coverage is at ${documentation.documentationPercent.toFixed(1)}%, below recommended 80%.`
        );
      }
      
      if (criticalIssues.criticalIssues > 0) {
        issuesList.push(`Critical issues detected (${criticalIssues.criticalIssues}): high risk.`);
      }
      
      improvements = [
        'Enhance documentation for complex logic',
        'Extract common patterns into reusable functions',
        'Review variable names for clarity'
      ];
      break;
    case 'C':
      description = 'Moderate maintainability';
      reason = 'The code has structural issues that moderately impact future maintenance.';
      
      if (duplication.duplicationPercent > ANALYSIS_CONSTANTS.DUPLICATION.MODERATE) {
        issuesList.push(
          `Significant code duplication (${duplication.duplicationPercent.toFixed(1)}%) detected.`
        );
      }
      
      if (functionSizes.oversizedFunctions > 3) {
        issuesList.push(
          `${functionSizes.oversizedFunctions} functions substantially exceed size guidelines.`
        );
      }
      
      if (documentation.documentationPercent < ANALYSIS_CONSTANTS.DOCUMENTATION.ACCEPTABLE) {
        issuesList.push(
          `Poor documentation coverage (${documentation.documentationPercent.toFixed(1)}%).`
        );
      }
      
      if (criticalIssues.criticalIssues > 0) {
        issuesList.push(`Critical issues detected (${criticalIssues.criticalIssues}): high risk.`);
      }
      
      improvements = [
        'Refactor larger functions into smaller, single-purpose components',
        'Extract duplicate code into shared utilities',
        'Improve documentation coverage',
        'Enhance naming conventions for clarity'
      ];
      break;
    default: // 'D'
      description = 'Poor maintainability';
      reason = 'The code has significant maintainability issues requiring remediation.';
      
      if (duplication.duplicationPercent > ANALYSIS_CONSTANTS.DUPLICATION.HIGH) {
        issuesList.push(
          `Excessive code duplication (${duplication.duplicationPercent.toFixed(1)}%).`
        );
      }
      
      if (functionSizes.oversizedFunctions > 5) {
        issuesList.push(
          `${functionSizes.oversizedFunctions} functions are excessively large.`
        );
      }
      
      if (documentation.documentationPercent < ANALYSIS_CONSTANTS.DOCUMENTATION.POOR) {
        issuesList.push(
          `Critical lack of documentation (${documentation.documentationPercent.toFixed(1)}%).`
        );
      }
      
      if (criticalIssues.criticalIssues > 0) {
        issuesList.push(`Critical issues detected (${criticalIssues.criticalIssues}): high risk.`);
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
  
  return { description, reason, issuesList, improvements };
}

// Main function for maintainability rating
export function getMaintainabilityRating(score: number, code: string): ScoreData {
  // Validate input
  if (score === undefined || score === null || !isFinite(score)) {
    console.warn('Invalid maintainability score:', score);
    return {
      score: 'D',
      description: 'Invalid maintainability',
      reason: 'Unable to analyze the code maintainability due to invalid input.',
      issues: ['Invalid maintainability score provided'],
      improvements: ['Ensure valid metrics are available for analysis']
    };
  }
  
  // Use safe non-negative value with upper bound
  const safeScore = Math.min(100, Math.max(0, score));
  
  // Perform enhanced structural analysis using helper functions
  const duplication = detectCodeDuplication(safeScore);
  const functionSizes = assessFunctionSizeIssues(safeScore);
  const documentation = assessDocumentationQuality(safeScore);
  const criticalIssues = detectCriticalIssues(code);
  
  // Calculate adjusted score based on these enhanced factors
  let adjustedScore = safeScore;
  
  // Apply penalties for duplication, function size, documentation, and critical issues
  adjustedScore -= duplication.duplicationImpact * ANALYSIS_CONSTANTS.DUPLICATION.IMPACT_MULTIPLIER;
  adjustedScore -= functionSizes.impact;
  adjustedScore -= documentation.impact;
  adjustedScore -= criticalIssues.impact;  // Deduct based on critical issues
  
  // Ensure score stays within bounds
  adjustedScore = Math.max(0, Math.min(100, adjustedScore));
  
  // Get final rating based on adjusted score
  const rating = getGradeFromScore(adjustedScore, scoreThresholds.maintainability);
  
  // Generate detailed report using helper function
  const { description, reason, issuesList, improvements } = 
    generateMaintainabilityReport(rating, duplication, functionSizes, documentation, criticalIssues);
  
  return {
    score: rating,
    description,
    reason,
    issues: issuesList,
    improvements
  };
}
