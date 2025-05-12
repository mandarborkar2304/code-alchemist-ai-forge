import { ScoreData } from './types';
import { ScoreGrade } from '@/types';
import { scoreThresholds, getGradeFromScore, ANALYSIS_CONSTANTS } from './scoreThresholds';

// Helper function to detect code duplication with actual or fallback input
function detectCodeDuplication(actualDuplication?: number, fallbackScore?: number): {
  duplicationPercent: number,
  duplicationImpact: number
} {
  let duplicationPercent: number;

  if (typeof actualDuplication === 'number' && isFinite(actualDuplication)) {
    duplicationPercent = Math.min(100, Math.max(0, actualDuplication));
  } else if (typeof fallbackScore === 'number' && isFinite(fallbackScore)) {
    const safeScore = Math.min(100, Math.max(0, fallbackScore));
    if (safeScore >= 90) {
      duplicationPercent = Math.max(0, Math.min(5, 100 - safeScore));
    } else if (safeScore >= 80) {
      duplicationPercent = 5 + (90 - safeScore) * 0.5;
    } else if (safeScore >= 70) {
      duplicationPercent = 10 + (80 - safeScore) * 1.0;
    } else {
      duplicationPercent = 20 + (70 - Math.min(70, safeScore)) * 1.5;
    }
  } else {
    console.warn('Invalid duplication input');
    duplicationPercent = 0;
  }

  const duplicationImpact = duplicationPercent > 0
    ? Math.pow(duplicationPercent / 10, 1.5)
    : 0;

  return { duplicationPercent, duplicationImpact };
}

// Helper function to assess function size issues
function assessFunctionSizeIssues(score: number): {
  oversizedFunctions: number,
  impact: number
} {
  if (!isFinite(score)) {
    console.warn('Invalid score for function size analysis:', score);
    return { oversizedFunctions: 0, impact: 0 };
  }

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

  const impact = oversizedFunctions === 0 ? 0 :
    Math.min(
      ANALYSIS_CONSTANTS.FUNCTION_SIZE.MAX_IMPACT,
      oversizedFunctions * ANALYSIS_CONSTANTS.FUNCTION_SIZE.IMPACT_MULTIPLIER
    );

  return { oversizedFunctions, impact };
}

// Helper function to assess documentation quality
function assessDocumentationQuality(score: number): {
  documentationPercent: number,
  impact: number
} {
  if (!isFinite(score)) {
    console.warn('Invalid score for documentation analysis:', score);
    return { documentationPercent: 50, impact: 0 };
  }

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

  const impact = documentationPercent < ANALYSIS_CONSTANTS.DOCUMENTATION.POOR
    ? (ANALYSIS_CONSTANTS.DOCUMENTATION.POOR - documentationPercent) *
      ANALYSIS_CONSTANTS.DOCUMENTATION.IMPACT_MULTIPLIER
    : 0;

  return { documentationPercent, impact };
}

// Helper function to generate maintainability report
function generateMaintainabilityReport(
  rating: ScoreGrade,
  duplication: { duplicationPercent: number },
  functionSizes: { oversizedFunctions: number },
  documentation: { documentationPercent: number }
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
      if (duplication.duplicationPercent > 3)
        issuesList.push(`${duplication.duplicationPercent.toFixed(1)}% code duplication detected.`);
      if (functionSizes.oversizedFunctions > 0)
        issuesList.push(`${functionSizes.oversizedFunctions} functions exceed recommended size limits.`);
      if (documentation.documentationPercent < ANALYSIS_CONSTANTS.DOCUMENTATION.GOOD)
        issuesList.push(`Documentation coverage is at ${documentation.documentationPercent.toFixed(1)}%, below recommended 80%.`);
      if (issuesList.length === 0)
        issuesList = ['Some areas could benefit from better documentation.', 'Minor code duplication may exist.'];
      improvements = ['Enhance documentation for complex logic', 'Extract common patterns into reusable functions', 'Review variable names for clarity'];
      break;
    case 'C':
      description = 'Moderate maintainability';
      reason = 'The code has structural issues that moderately impact future maintenance.';
      if (duplication.duplicationPercent > ANALYSIS_CONSTANTS.DUPLICATION.MODERATE)
        issuesList.push(`Significant code duplication (${duplication.duplicationPercent.toFixed(1)}%) detected.`);
      if (functionSizes.oversizedFunctions > 3)
        issuesList.push(`${functionSizes.oversizedFunctions} functions substantially exceed size guidelines.`);
      if (documentation.documentationPercent < ANALYSIS_CONSTANTS.DOCUMENTATION.ACCEPTABLE)
        issuesList.push(`Poor documentation coverage (${documentation.documentationPercent.toFixed(1)}%).`);
      if (issuesList.length === 0)
        issuesList = ['Inadequate documentation in key areas', 'Functions exceeding size guidelines', 'Some code duplication without proper abstraction', 'Variable naming could be improved'];
      improvements = ['Refactor larger functions into smaller, single-purpose components', 'Extract duplicate code into shared utilities', 'Improve documentation coverage', 'Enhance naming conventions for clarity'];
      break;
    default:
      description = 'Poor maintainability';
      reason = 'The code has significant maintainability issues requiring remediation.';
      if (duplication.duplicationPercent > ANALYSIS_CONSTANTS.DUPLICATION.HIGH)
        issuesList.push(`Excessive code duplication (${duplication.duplicationPercent.toFixed(1)}%).`);
      if (functionSizes.oversizedFunctions > 5)
        issuesList.push(`${functionSizes.oversizedFunctions} functions are excessively large.`);
      if (documentation.documentationPercent < ANALYSIS_CONSTANTS.DOCUMENTATION.POOR)
        issuesList.push(`Critical lack of documentation (${documentation.documentationPercent.toFixed(1)}%).`);
      if (issuesList.length === 0)
        issuesList = ['Functions exceeding recommended sizes', 'Insufficient or missing documentation', 'Unclear naming and conventions', 'Deep nesting of control structures', 'Substantial code duplication', 'Magic numbers and hardcoded values'];
      improvements = ['Comprehensive refactoring recommended', 'Break down large functions into smaller units', 'Add complete documentation', 'Simplify nested code structures', 'Create reusable abstractions for duplicate code', 'Replace magic numbers with named constants'];
  }

  return { description, reason, issuesList, improvements };
}

// Main function to compute maintainability rating
export function getMaintainabilityRating(score: number, actualDuplicationPercent?: number): ScoreData {
  if (!isFinite(score)) {
    console.warn('Invalid maintainability score:', score);
    return {
      score: 'D',
      description: 'Invalid maintainability',
      reason: 'Unable to analyze the code maintainability due to invalid input.',
      issues: ['Invalid maintainability score provided'],
      improvements: ['Ensure valid metrics are available for analysis']
    };
  }

  const safeScore = Math.min(100, Math.max(0, score));

  const duplication = detectCodeDuplication(actualDuplicationPercent, safeScore);
  const functionSizes = assessFunctionSizeIssues(safeScore);
  const documentation = assessDocumentationQuality(safeScore);

  let adjustedScore = safeScore;
  adjustedScore -= duplication.duplicationImpact * ANALYSIS_CONSTANTS.DUPLICATION.IMPACT_MULTIPLIER;
  adjustedScore -= functionSizes.impact;
  adjustedScore -= documentation.impact;

  adjustedScore = Math.max(0, Math.min(100, adjustedScore));

  const rating = getGradeFromScore(adjustedScore, scoreThresholds.maintainability);
  const { description, reason, issuesList, improvements } = generateMaintainabilityReport(rating, duplication, functionSizes, documentation);

  return {
    score: rating,
    description,
    reason,
    issues: issuesList,
    improvements
  };
}
