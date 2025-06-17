import { ScoreData } from './types';
import { ScoreGrade } from '@/types';
import { TechnicalDebtCalculator, TechnicalDebtResult } from './technicalDebtCalculator';
import { CppParser } from './cppParser';

// SonarQube-aligned thresholds for different metrics
const SONARQUBE_THRESHOLDS = {
  DUPLICATION: {
    ACCEPTABLE: 3,
    MINOR: 5,
    MAJOR: 10
  },
  DOCUMENTATION: {
    MAJOR: 30,
    MINOR: 50
  },
  COMPLEXITY: {
    MINOR: 10,
    MAJOR: 15,
    CRITICAL: 25
  },
  FUNCTION_SIZE: {
    MINOR: 30,
    MAJOR: 50,
    CRITICAL: 100
  }
};

// Debt ratio grade thresholds
const DEBT_RATIO_GRADES = {
  A: 5,   // 0-5%
  B: 10,  // 6-10%
  C: 20   // 11-20%
};

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
      issues: ['Invalid maintainability score provided']
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
  const debtCalculator = new TechnicalDebtCalculator(code, language, codeLines, context);
  const debtResult = debtCalculator.calculateTechnicalDebt();
  
  const { description, reason, issuesList } = generateEnhancedReport(
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
  const debtCalculator = new TechnicalDebtCalculator(code, 'cpp', code.split('\n').length, context);
  const debtResult = debtCalculator.calculateTechnicalDebt();
  
  // Add C++ specific analysis
  const cppSpecificIssues = analyzeCppSpecificIssues(parseResult);
  debtResult.issues.push(...cppSpecificIssues);
  debtResult.codeSmells += cppSpecificIssues.length;
  debtResult.totalDebtMinutes += cppSpecificIssues.reduce((sum, issue) => sum + issue.remedationTimeMinutes, 0);
  
  // Recalculate debt ratio with C++ issues
  debtResult.debtRatio = (debtResult.totalDebtMinutes / debtResult.estimatedDevelopmentMinutes) * 100;
  debtResult.grade = calculateGradeFromDebtRatio(debtResult.debtRatio);
  
  const { description, reason, issuesList } = generateCppReport(
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
          remedationTimeMinutes: 20,
          lineNumber: cls.startLine,
          functionName: cls.name
        });
      }
    }
  });
  
  // Check for potential memory leaks (simplified analysis)
  parseResult.functions.forEach((func: any) => {
    // Look for new/malloc without corresponding delete/free
    if (func.name.includes('new') && !func.name.includes('delete')) {
      issues.push({
        type: 'structure',
        severity: 'critical',
        description: `Function '${func.name}' may have memory management issues`,
        remedationTimeMinutes: 45,
        lineNumber: func.startLine,
        functionName: func.name
      });
    }
  });
  
  // Check for raw pointer usage without smart pointers
  parseResult.functions.forEach((func: any) => {
    if (func.returnType && func.returnType.includes('*')) {
      issues.push({
        type: 'structure',
        severity: 'minor',
        description: `Function '${func.name}' returns raw pointer. Consider using smart pointers.`,
        remedationTimeMinutes: 15,
        lineNumber: func.startLine,
        functionName: func.name
      });
    }
  });
  
  return issues;
}

function generateEnhancedReport(
  debtResult: TechnicalDebtResult,
  context?: string
): {
  description: string;
  reason: string;
  issuesList: string[];
} {
  
  const isExemptFile = isTestFile(context) || isUtilityCode(context) || isGeneratedCode(context);
  const exemptionNote = isExemptFile ? ' (reduced penalties for utility/test code)' : '';
  
  let description: string;
  let reason: string;
  let issuesList: string[] = [];
  
  const debtTime = formatDebtTime(debtResult.totalDebtMinutes);
  
  switch (debtResult.grade) {
    case 'A':
      description = `Excellent maintainability${exemptionNote}`;
      reason = `Technical debt: ${debtTime}, debt ratio: ${debtResult.debtRatio.toFixed(1)}%, code smells: ${debtResult.codeSmells}`;
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
  const issuesByType = new Map<string, {count: number, severity: string}>();
  debtResult.issues.forEach(issue => {
    const key = issue.type;
    const current = issuesByType.get(key) || {count: 0, severity: 'minor'};
    issuesByType.set(key, {
      count: current.count + 1,
      severity: issue.severity === 'critical' ? 'critical' : 
               issue.severity === 'major' ? 'major' : current.severity
    });
  });
  
  issuesByType.forEach(({count, severity}, type) => {
    const typeLabel = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    issuesList.push(`${count} ${typeLabel} issue(s) (${severity} severity)`);
  });
  
  return { description, reason, issuesList };
}

function generateCppReport(
  debtResult: TechnicalDebtResult,
  parseResult: any,
  context?: string
): {
  description: string;
  reason: string;
  issuesList: string[];
} {
  
  const report = generateEnhancedReport(debtResult, context);
  
  // Add C++ specific context
  report.reason += ` | Functions: ${parseResult.functions.length}, Classes: ${parseResult.classes.length}`;
  
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
  // Legacy fallback for when no code is provided
  const grade = safeScore >= 90 ? 'A' : safeScore >= 80 ? 'B' : safeScore >= 70 ? 'C' : 'D';
  
  return {
    score: grade,
    description: `Maintainability rating based on score: ${safeScore}`,
    reason: `Calculated from provided metrics (score: ${safeScore})`,
    issues: safeScore < 80 ? ['Limited analysis without source code'] : []
  };
}
