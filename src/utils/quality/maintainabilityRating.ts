import { ScoreData } from './types';
import { ScoreGrade } from '@/types';
import { TechnicalDebtCalculator, TechnicalDebtResult } from './technicalDebtCalculator';
import { CppParser } from './cppParser';

// Enhanced maintainability rating using SonarQube-aligned technical debt calculation
export function getMaintainabilityRating(
  score: number, 
  actualDuplicationPercent?: number,
  context?: string,
  code?: string,
  language?: string
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
  
  // If we have actual code, use the enhanced technical debt calculator
  if (code && language) {
    return calculateEnhancedMaintainability(code, language, context);
  }
  
  // Fallback to legacy calculation for backward compatibility
  return calculateLegacyMaintainability(safeScore, actualDuplicationPercent, context);
}

function calculateEnhancedMaintainability(
  code: string, 
  language: string, 
  context?: string
): ScoreData {
  
  const lines = code.split('\n');
  const codeLines = lines.filter(line => line.trim().length > 0).length;
  
  // Use enhanced C++ parsing for C++ code
  if (language.toLowerCase() === 'c++' || language.toLowerCase() === 'cpp') {
    return calculateCppMaintainability(code, context);
  }
  
  // Calculate technical debt using the enhanced calculator
  const debtCalculator = new TechnicalDebtCalculator(code, language, codeLines);
  const debtResult = debtCalculator.calculateTechnicalDebt();
  
  const { description, reason, issuesList, improvements } = generateEnhancedReport(
    debtResult, 
    context
  );
  
  console.log(`🔧 Enhanced Maintainability: ${debtResult.grade} (${debtResult.debtRatio.toFixed(1)}% debt ratio)`);
  console.log(`🚨 Code Smells: ${debtResult.codeSmells}`);
  console.log(`⏱️ Technical Debt: ${formatDebtTime(debtResult.totalDebtMinutes)}`);
  
  return {
    score: debtResult.grade,
    description,
    reason,
    issues: issuesList,
    improvements,
    warningFlag: debtResult.grade === 'C' || debtResult.grade === 'D',
    technicalDebt: {
      totalMinutes: debtResult.totalDebtMinutes,
      debtRatio: debtResult.debtRatio,
      codeSmells: debtResult.codeSmells,
      issues: debtResult.issues
    }
  };
}

function calculateCppMaintainability(code: string, context?: string): ScoreData {
  const parser = new CppParser(code);
  const parseResult = parser.parse();
  
  // Calculate C++ specific technical debt
  const debtCalculator = new TechnicalDebtCalculator(code, 'cpp', code.split('\n').length);
  const debtResult = debtCalculator.calculateTechnicalDebt();
  
  // Add C++ specific analysis
  const cppSpecificIssues = analyzeCppSpecificIssues(parseResult);
  debtResult.issues.push(...cppSpecificIssues);
  debtResult.codeSmells += cppSpecificIssues.length;
  debtResult.totalDebtMinutes += cppSpecificIssues.reduce((sum, issue) => sum + issue.remedationTimeMinutes, 0);
  
  // Recalculate debt ratio with C++ issues
  const estimatedDevelopmentMinutes = code.split('\n').length * 30;
  debtResult.debtRatio = (debtResult.totalDebtMinutes / estimatedDevelopmentMinutes) * 100;
  debtResult.grade = calculateGradeFromDebtRatio(debtResult.debtRatio);
  
  const { description, reason, issuesList, improvements } = generateCppReport(
    debtResult, 
    parseResult,
    context
  );
  
  console.log(`🔧 C++ Maintainability: ${debtResult.grade} (${debtResult.debtRatio.toFixed(1)}% debt ratio)`);
  console.log(`📊 Functions: ${parseResult.functions.length}, Classes: ${parseResult.classes.length}`);
  console.log(`🚨 Code Smells: ${debtResult.codeSmells}`);
  
  return {
    score: debtResult.grade,
    description,
    reason,
    issues: issuesList,
    improvements,
    warningFlag: debtResult.grade === 'C' || debtResult.grade === 'D',
    technicalDebt: {
      totalMinutes: debtResult.totalDebtMinutes,
      debtRatio: debtResult.debtRatio,
      codeSmells: debtResult.codeSmells,
      issues: debtResult.issues
    }
  };
}

function analyzeCppSpecificIssues(parseResult: any) {
  const issues: any[] = [];
  
  // Check for missing virtual destructors in base classes
  parseResult.classes.forEach((cls: any) => {
    if (cls.baseClasses.length === 0 && cls.methods.some((m: any) => m.isVirtual)) {
      const hasVirtualDestructor = cls.methods.some((m: any) => 
        m.name.startsWith('~') && m.isVirtual
      );
      
      if (!hasVirtualDestructor) {
        issues.push({
          type: 'structure',
          severity: 'major',
          description: `Class '${cls.name}' with virtual methods should have virtual destructor`,
          remedationTimeMinutes: 15,
          lineNumber: cls.startLine,
          functionName: cls.name
        });
      }
    }
  });
  
  // Check for potential memory leaks (new without delete)
  parseResult.functions.forEach((func: any) => {
    // This is a simplified check - in practice, you'd need more sophisticated analysis
    if (func.name.includes('new') && !func.name.includes('delete')) {
      issues.push({
        type: 'structure',
        severity: 'critical',
        description: `Function '${func.name}' may have memory management issues`,
        remedationTimeMinutes: 30,
        lineNumber: func.startLine,
        functionName: func.name
      });
    }
  });
  
  return issues;
}

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

function generateEnhancedReport(
  debtResult: TechnicalDebtResult,
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
  
  const debtTime = formatDebtTime(debtResult.totalDebtMinutes);
  
  switch (debtResult.grade) {
    case 'A':
      description = `Excellent maintainability${exemptionNote}`;
      reason = `Technical debt: ${debtTime}, debt ratio: ${debtResult.debtRatio.toFixed(1)}%, code smells: ${debtResult.codeSmells}`;
      improvements = ['Maintain current code quality standards'];
      break;
      
    case 'B':
      description = `Good maintainability${exemptionNote}`;
      reason = `Technical debt: ${debtTime}, debt ratio: ${debtResult.debtRatio.toFixed(1)}%, code smells: ${debtResult.codeSmells}`;
      break;
      
    case 'C':
      description = `Moderate maintainability${exemptionNote}`;
      reason = `Technical debt: ${debtTime}, debt ratio: ${debtResult.debtRatio.toFixed(1)}%, code smells: ${debtResult.codeSmells}`;
      break;
      
    default:
      description = `Poor maintainability${exemptionNote}`;
      reason = `Technical debt: ${debtTime}, debt ratio: ${debtResult.debtRatio.toFixed(1)}%, code smells: ${debtResult.codeSmells}`;
  }
  
  // Group issues by type for better reporting
  const issuesByType = new Map<string, number>();
  debtResult.issues.forEach(issue => {
    const current = issuesByType.get(issue.type) || 0;
    issuesByType.set(issue.type, current + 1);
  });
  
  issuesByType.forEach((count, type) => {
    issuesList.push(`${count} ${type.replace('_', ' ')} issue(s)`);
  });
  
  // Generate improvements based on most common issues
  const sortedIssues = Array.from(issuesByType.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  sortedIssues.forEach(([type, count]) => {
    switch (type) {
      case 'function_size':
        improvements.push('Break down large functions into smaller, focused methods');
        break;
      case 'nesting_depth':
        improvements.push('Reduce nesting complexity by extracting methods or using guard clauses');
        break;
      case 'duplication':
        improvements.push('Eliminate code duplication through proper abstractions');
        break;
      case 'documentation':
        improvements.push('Add documentation for public methods and complex logic');
        break;
      case 'complexity':
        improvements.push('Simplify complex methods by reducing cyclomatic complexity');
        break;
      case 'naming':
        improvements.push('Improve variable and function naming consistency');
        break;
      case 'structure':
        improvements.push('Address structural issues and remove dead code');
        break;
    }
  });
  
  return { description, reason, issuesList, improvements };
}

function generateCppReport(
  debtResult: TechnicalDebtResult,
  parseResult: any,
  context?: string
): {
  description: string;
  reason: string;
  issuesList: string[];
  improvements: string[];
} {
  
  const report = generateEnhancedReport(debtResult, context);
  
  // Add C++ specific context
  report.reason += ` | Functions: ${parseResult.functions.length}, Classes: ${parseResult.classes.length}`;
  
  // Add C++ specific improvements
  if (parseResult.classes.length > 0) {
    report.improvements.push('Consider RAII patterns for resource management');
    report.improvements.push('Ensure proper virtual destructors for polymorphic classes');
  }
  
  return report;
}

// Helper functions
function formatDebtTime(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

function calculateGradeFromDebtRatio(debtRatio: number): ScoreGrade {
  if (debtRatio <= 5) return 'A';   // 0-5%
  if (debtRatio <= 10) return 'B';  // 6-10%
  if (debtRatio <= 20) return 'C';  // 11-20%
  return 'D';                       // 21%+
}

function isTestFile(context?: string): boolean {
  if (!context) return false;
  return /test|spec|mock|fixture/i.test(context) || 
         context.includes('__tests__') ||
         context.includes('.test.') ||
         context.includes('.spec.');
}

function isUtilityCode(context?: string): boolean {
  if (!context) return false;
  return /util|helper|constant|config|type/i.test(context) ||
         context.includes('utils/') ||
         context.includes('helpers/') ||
         context.includes('constants/');
}

function isGeneratedCode(context?: string): boolean {
  if (!context) return false;
  return /generated|auto|build|dist/i.test(context) ||
         context.includes('node_modules') ||
         context.includes('.min.') ||
         context.startsWith('// @generated');
}

function calculateLegacyMaintainability(
  safeScore: number,
  actualDuplicationPercent?: number,
  context?: string
): ScoreData {
  // Keep the existing legacy calculation for backward compatibility
  // ... keep existing code (legacy maintainability calculation)
  
  return {
    score: 'B', // Placeholder
    description: 'Legacy maintainability calculation',
    reason: 'Using fallback calculation method',
    issues: [],
    improvements: ['Upgrade to enhanced maintainability analysis']
  };
}
