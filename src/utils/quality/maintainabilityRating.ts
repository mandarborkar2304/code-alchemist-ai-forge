
import { ScoreData } from './types';
import { ScoreGrade } from '@/types';

// SonarQube-aligned thresholds - more lenient than previous system
const SONARQUBE_THRESHOLDS = {
  FUNCTION_SIZE: {
    ACCEPTABLE: 30,     // SonarQube allows up to 30-40 lines
    MAJOR: 60,          // Major violation at 60+ lines
    CRITICAL: 100       // Critical at 100+ lines
  },
  NESTING_DEPTH: {
    ACCEPTABLE: 3,      // Allow 3 levels without penalty
    MINOR: 4,           // Minor penalty at 4 levels
    MAJOR: 5,           // Major penalty at 5+ levels
    CRITICAL: 7         // Critical at 7+ levels
  },
  DUPLICATION: {
    ACCEPTABLE: 5,      // Up to 5% is fine
    MINOR: 10,          // Minor penalty 5-10%
    MAJOR: 20,          // Major penalty 10-20%
    CRITICAL: 30        // Critical above 20%
  },
  DOCUMENTATION: {
    ACCEPTABLE: 30,     // Only penalize if >70% methods lack docs
    MINOR: 50,          // Minor penalty at 50% coverage
    MAJOR: 70           // Major penalty below 30% coverage
  }
};

// SonarQube debt ratio grades (technical debt as % of development time)
const DEBT_RATIO_GRADES = {
  A: 5,    // 0-5% debt ratio
  B: 10,   // 6-10% debt ratio  
  C: 20,   // 11-20% debt ratio
  D: 100   // 21%+ debt ratio
};

// Context-based exception patterns
const isTestFile = (context?: string): boolean => {
  if (!context) return false;
  return /test|spec|mock|fixture/i.test(context) || 
         context.includes('__tests__') ||
         context.includes('.test.') ||
         context.includes('.spec.');
};

const isUtilityCode = (context?: string): boolean => {
  if (!context) return false;
  return /util|helper|constant|config|type/i.test(context) ||
         context.includes('utils/') ||
         context.includes('helpers/') ||
         context.includes('constants/');
};

const isGeneratedCode = (context?: string): boolean => {
  if (!context) return false;
  return /generated|auto|build|dist/i.test(context) ||
         context.includes('node_modules') ||
         context.includes('.min.') ||
         context.startsWith('// @generated');
};

// Calculate maintainability debt ratio using SonarQube methodology
function calculateMaintainabilityDebt(
  score: number, 
  actualDuplicationPercent?: number,
  context?: string
): { debtRatio: number; violations: any[] } {
  
  const violations: any[] = [];
  let totalDebtMinutes = 0; // Technical debt in minutes
  const estimatedLOC = Math.max(100, score * 10); // Estimate lines of code
  
  // Apply context-based exceptions
  const isExemptFile = isTestFile(context) || isUtilityCode(context) || isGeneratedCode(context);
  const documentationMultiplier = isExemptFile ? 0.3 : 1.0;
  const duplicationMultiplier = isTestFile(context) ? 0.5 : 1.0;
  
  // 1. Function Size Analysis (SonarQube: 20 min to fix per violation)
  const functionSizeIssues = assessFunctionSizeDebt(score);
  if (functionSizeIssues.violations > 0) {
    const debtMinutes = functionSizeIssues.violations * 20;
    totalDebtMinutes += debtMinutes;
    violations.push({
      type: 'Function Size',
      count: functionSizeIssues.violations,
      severity: functionSizeIssues.severity,
      debtMinutes
    });
  }
  
  // 2. Nesting Depth Analysis (SonarQube: 5 min per level over threshold)
  const nestingIssues = assessNestingDebt(score);
  if (nestingIssues.violations > 0) {
    const debtMinutes = nestingIssues.violations * 5;
    totalDebtMinutes += debtMinutes;
    violations.push({
      type: 'Nesting Depth',
      count: nestingIssues.violations,
      severity: nestingIssues.severity,
      debtMinutes
    });
  }
  
  // 3. Code Duplication Analysis (SonarQube: 10 min per duplicated block)
  const duplicationIssues = assessDuplicationDebt(actualDuplicationPercent, score);
  if (duplicationIssues.violations > 0) {
    const adjustedDebtMinutes = duplicationIssues.violations * 10 * duplicationMultiplier;
    totalDebtMinutes += adjustedDebtMinutes;
    violations.push({
      type: 'Code Duplication',
      count: duplicationIssues.violations,
      severity: duplicationIssues.severity,
      debtMinutes: adjustedDebtMinutes
    });
  }
  
  // 4. Documentation Analysis (SonarQube: 2 min per missing comment)
  const docIssues = assessDocumentationDebt(score);
  if (docIssues.violations > 0) {
    const adjustedDebtMinutes = docIssues.violations * 2 * documentationMultiplier;
    totalDebtMinutes += adjustedDebtMinutes;
    violations.push({
      type: 'Documentation',
      count: docIssues.violations,
      severity: docIssues.severity,
      debtMinutes: adjustedDebtMinutes
    });
  }
  
  // Calculate debt ratio as percentage of development time
  // Assumption: 1 LOC = 30 minutes development time on average
  const estimatedDevelopmentMinutes = estimatedLOC * 30;
  const debtRatio = estimatedDevelopmentMinutes > 0 
    ? (totalDebtMinutes / estimatedDevelopmentMinutes) * 100 
    : 0;
  
  return { debtRatio, violations };
}

// Function size debt assessment
function assessFunctionSizeDebt(score: number): { violations: number; severity: string } {
  const normalizedScore = Math.min(100, Math.max(0, score));
  
  if (normalizedScore >= 85) {
    return { violations: 0, severity: 'none' };
  } else if (normalizedScore >= 75) {
    return { violations: 1, severity: 'minor' }; // One function slightly over
  } else if (normalizedScore >= 60) {
    return { violations: 2, severity: 'major' }; // Multiple functions over threshold
  } else {
    return { violations: Math.floor((85 - normalizedScore) / 10), severity: 'major' };
  }
}

// Nesting depth debt assessment  
function assessNestingDebt(score: number): { violations: number; severity: string } {
  const normalizedScore = Math.min(100, Math.max(0, score));
  
  if (normalizedScore >= 80) {
    return { violations: 0, severity: 'none' };
  } else if (normalizedScore >= 70) {
    return { violations: 1, severity: 'minor' }; // One method with 4 levels
  } else if (normalizedScore >= 50) {
    return { violations: 2, severity: 'major' }; // Multiple methods with deep nesting
  } else {
    return { violations: Math.floor((80 - normalizedScore) / 15), severity: 'major' };
  }
}

// Code duplication debt assessment
function assessDuplicationDebt(actualDuplication?: number, fallbackScore?: number): { violations: number; severity: string } {
  let duplicationPercent: number;
  
  if (typeof actualDuplication === 'number' && isFinite(actualDuplication)) {
    duplicationPercent = Math.min(50, Math.max(0, actualDuplication));
  } else if (typeof fallbackScore === 'number' && isFinite(fallbackScore)) {
    // Estimate duplication from score
    const normalizedScore = Math.min(100, Math.max(0, fallbackScore));
    if (normalizedScore >= 90) {
      duplicationPercent = 2;
    } else if (normalizedScore >= 80) {
      duplicationPercent = 5;
    } else if (normalizedScore >= 70) {
      duplicationPercent = 10;
    } else {
      duplicationPercent = 15 + (80 - normalizedScore) * 0.5;
    }
  } else {
    duplicationPercent = 0;
  }
  
  // SonarQube-aligned thresholds
  if (duplicationPercent <= SONARQUBE_THRESHOLDS.DUPLICATION.ACCEPTABLE) {
    return { violations: 0, severity: 'none' };
  } else if (duplicationPercent <= SONARQUBE_THRESHOLDS.DUPLICATION.MINOR) {
    return { violations: 1, severity: 'minor' };
  } else if (duplicationPercent <= SONARQUBE_THRESHOLDS.DUPLICATION.MAJOR) {
    return { violations: Math.ceil(duplicationPercent / 5), severity: 'major' };
  } else {
    return { violations: Math.ceil(duplicationPercent / 3), severity: 'critical' };
  }
}

// Documentation debt assessment
function assessDocumentationDebt(score: number): { violations: number; severity: string } {
  const normalizedScore = Math.min(100, Math.max(0, score));
  
  // Estimate documentation coverage from score
  let docCoverage: number;
  if (normalizedScore >= 90) {
    docCoverage = 80;
  } else if (normalizedScore >= 80) {
    docCoverage = 60;
  } else if (normalizedScore >= 70) {
    docCoverage = 40;
  } else {
    docCoverage = Math.max(10, normalizedScore * 0.5);
  }
  
  // Only penalize if coverage is below 30% (SonarQube threshold)
  if (docCoverage >= SONARQUBE_THRESHOLDS.DOCUMENTATION.MAJOR) {
    return { violations: 0, severity: 'none' };
  } else if (docCoverage >= SONARQUBE_THRESHOLDS.DOCUMENTATION.MINOR) {
    return { violations: 1, severity: 'minor' };
  } else {
    return { violations: Math.floor((SONARQUBE_THRESHOLDS.DOCUMENTATION.MAJOR - docCoverage) / 10), severity: 'major' };
  }
}

// Convert debt ratio to SonarQube grade
function getGradeFromDebtRatio(debtRatio: number): ScoreGrade {
  if (debtRatio <= DEBT_RATIO_GRADES.A) return 'A';
  if (debtRatio <= DEBT_RATIO_GRADES.B) return 'B';
  if (debtRatio <= DEBT_RATIO_GRADES.C) return 'C';
  return 'D';
}

// Generate maintainability report based on SonarQube methodology
function generateSonarQubeReport(
  grade: ScoreGrade,
  debtRatio: number,
  violations: any[],
  context?: string
): {
  description: string;
  reason: string;
  issuesList: string[];
  improvements: string[];
} {
  
  const isExemptFile = isTestFile(context) || isUtilityCode(context) || isGeneratedCode(context);
  const exemptionNote = isExemptFile ? ' (reduced penalties for utility/test code)' : '';
  
  let description: string;
  let reason: string;
  let issuesList: string[] = [];
  let improvements: string[] = [];
  
  switch (grade) {
    case 'A':
      description = `Excellent maintainability${exemptionNote}`;
      reason = `Technical debt ratio is ${debtRatio.toFixed(1)}% - well within acceptable limits.`;
      if (violations.length === 0) {
        improvements = ['Maintain current code quality standards'];
      } else {
        improvements = ['Continue following best practices', 'Minor optimizations available'];
      }
      break;
      
    case 'B':
      description = `Good maintainability${exemptionNote}`;
      reason = `Technical debt ratio is ${debtRatio.toFixed(1)}% - manageable with minor improvements.`;
      violations.forEach(v => {
        if (v.count > 0) {
          issuesList.push(`${v.count} ${v.type.toLowerCase()} issue(s) detected`);
        }
      });
      improvements = [
        'Address larger functions by breaking them into smaller units',
        'Reduce code duplication through abstraction',
        'Consider adding documentation for complex logic'
      ];
      break;
      
    case 'C':
      description = `Moderate maintainability${exemptionNote}`;
      reason = `Technical debt ratio is ${debtRatio.toFixed(1)}% - requires attention to prevent degradation.`;
      violations.forEach(v => {
        if (v.count > 0) {
          issuesList.push(`${v.count} ${v.type.toLowerCase()} violation(s) (${v.severity} severity)`);
        }
      });
      improvements = [
        'Refactor large functions into smaller, focused methods',
        'Extract duplicate code into reusable components',
        'Simplify complex nested structures',
        'Improve documentation coverage for public methods'
      ];
      break;
      
    default:
      description = `Poor maintainability${exemptionNote}`;
      reason = `Technical debt ratio is ${debtRatio.toFixed(1)}% - immediate refactoring recommended.`;
      violations.forEach(v => {
        if (v.count > 0) {
          issuesList.push(`${v.count} ${v.type.toLowerCase()} violation(s) (${v.severity} severity)`);
        }
      });
      improvements = [
        'Comprehensive refactoring required',
        'Break down large functions and classes',
        'Eliminate code duplication through proper abstractions',
        'Reduce nesting complexity',
        'Add comprehensive documentation',
        'Consider architectural improvements'
      ];
  }
  
  return { description, reason, issuesList, improvements };
}

// Main maintainability rating function using SonarQube methodology
export function getMaintainabilityRating(
  score: number, 
  actualDuplicationPercent?: number,
  context?: string
): ScoreData {
  
  if (!isFinite(score)) {
    console.warn('Invalid maintainability score:', score);
    return {
      score: 'D',
      description: 'Invalid maintainability',
      reason: 'Unable to analyze maintainability due to invalid input.',
      issues: ['Invalid maintainability score provided'],
      improvements: ['Ensure valid metrics are available for analysis']
    };
  }
  
  const safeScore = Math.min(100, Math.max(0, score));
  
  // Calculate technical debt using SonarQube methodology
  const { debtRatio, violations } = calculateMaintainabilityDebt(
    safeScore, 
    actualDuplicationPercent,
    context
  );
  
  const grade = getGradeFromDebtRatio(debtRatio);
  const { description, reason, issuesList, improvements } = generateSonarQubeReport(
    grade, 
    debtRatio, 
    violations,
    context
  );
  
  console.log(`🔧 Maintainability: ${grade} (${debtRatio.toFixed(1)}% debt ratio)`);
  console.log(`📊 Violations: ${violations.length > 0 ? violations.map(v => `${v.type}:${v.count}`).join(', ') : 'none'}`);
  
  return {
    score: grade,
    description,
    reason,
    issues: issuesList,
    improvements,
    warningFlag: grade === 'C' || grade === 'D'
  };
}
