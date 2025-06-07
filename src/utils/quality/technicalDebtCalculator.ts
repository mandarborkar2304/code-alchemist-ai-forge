
import { ScoreGrade } from '@/types';

export interface DebtIssue {
  type: 'function_size' | 'nesting_depth' | 'duplication' | 'documentation' | 'complexity' | 'naming' | 'structure';
  severity: 'minor' | 'major' | 'critical';
  description: string;
  remedationTimeMinutes: number;
  lineNumber?: number;
  functionName?: string;
}

export interface TechnicalDebtResult {
  totalDebtMinutes: number;
  debtRatio: number;
  grade: ScoreGrade;
  issues: DebtIssue[];
  codeSmells: number;
}

// SonarQube-aligned remediation time constants (in minutes)
const REMEDIATION_TIMES = {
  FUNCTION_SIZE: {
    minor: 10,    // Function slightly over threshold
    major: 20,    // Function significantly over threshold  
    critical: 45  // Very large function requiring major refactoring
  },
  NESTING_DEPTH: {
    minor: 5,     // One level over threshold
    major: 15,    // Multiple levels requiring restructuring
    critical: 30  // Deep nesting requiring architectural changes
  },
  DUPLICATION: {
    minor: 10,    // Small duplicated blocks
    major: 20,    // Significant duplication
    critical: 40  // Extensive duplication across multiple files
  },
  DOCUMENTATION: {
    minor: 2,     // Missing simple documentation
    major: 5,     // Missing complex method documentation
    critical: 10  // Missing class/module documentation
  },
  COMPLEXITY: {
    minor: 15,    // Moderate complexity requiring simplification
    major: 30,    // High complexity requiring refactoring
    critical: 60  // Very high complexity requiring redesign
  },
  NAMING: {
    minor: 3,     // Simple rename
    major: 8,     // Significant naming improvements
    critical: 15  // Major naming convention overhaul
  },
  STRUCTURE: {
    minor: 10,    // Minor structural improvements
    major: 25,    // Significant structural changes
    critical: 45  // Major architectural refactoring
  }
} as const;

// Enhanced debt calculation with SonarQube methodology
export class TechnicalDebtCalculator {
  private issues: DebtIssue[] = [];
  private estimatedLOC: number;
  
  constructor(
    private code: string, 
    private language: string,
    codeLines: number
  ) {
    this.estimatedLOC = Math.max(50, codeLines);
  }

  calculateTechnicalDebt(): TechnicalDebtResult {
    this.issues = [];
    
    // Analyze different aspects of technical debt
    this.analyzeFunctionSizes();
    this.analyzeNestingComplexity();
    this.analyzeCodeDuplication();
    this.analyzeDocumentation();
    this.analyzeCyclomaticComplexity();
    this.analyzeNamingConventions();
    this.analyzeStructuralIssues();
    
    const totalDebtMinutes = this.issues.reduce((sum, issue) => sum + issue.remedationTimeMinutes, 0);
    
    // Calculate debt ratio using SonarQube formula
    // Assumption: 1 LOC = 30 minutes development time (SonarQube default)
    const estimatedDevelopmentMinutes = this.estimatedLOC * 30;
    const debtRatio = estimatedDevelopmentMinutes > 0 
      ? (totalDebtMinutes / estimatedDevelopmentMinutes) * 100 
      : 0;
    
    const grade = this.calculateGradeFromDebtRatio(debtRatio);
    const codeSmells = this.issues.length;
    
    return {
      totalDebtMinutes,
      debtRatio,
      grade,
      issues: this.issues,
      codeSmells
    };
  }

  private analyzeFunctionSizes() {
    const lines = this.code.split('\n');
    const functions = this.extractFunctions(lines);
    
    functions.forEach(func => {
      const size = func.endLine - func.startLine + 1;
      
      if (size > 100) {
        this.addIssue('function_size', 'critical', 
          `Function '${func.name}' is ${size} lines (threshold: 100)`,
          REMEDIATION_TIMES.FUNCTION_SIZE.critical, func.startLine, func.name);
      } else if (size > 60) {
        this.addIssue('function_size', 'major',
          `Function '${func.name}' is ${size} lines (threshold: 60)`,
          REMEDIATION_TIMES.FUNCTION_SIZE.major, func.startLine, func.name);
      } else if (size > 30) {
        this.addIssue('function_size', 'minor',
          `Function '${func.name}' is ${size} lines (threshold: 30)`,
          REMEDIATION_TIMES.FUNCTION_SIZE.minor, func.startLine, func.name);
      }
    });
  }

  private analyzeNestingComplexity() {
    const lines = this.code.split('\n');
    let currentDepth = 0;
    let maxDepthInFunction = 0;
    let currentFunction = '';
    let functionStartLine = 0;
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Track function boundaries
      if (this.isFunctionStart(trimmed)) {
        currentFunction = this.extractFunctionName(trimmed) || `function_${index}`;
        functionStartLine = index + 1;
        currentDepth = 0;
        maxDepthInFunction = 0;
      }
      
      // Count nesting depth for control structures only
      if (this.isControlStructure(trimmed)) {
        currentDepth++;
        maxDepthInFunction = Math.max(maxDepthInFunction, currentDepth);
      } else if (trimmed.includes('}') && currentDepth > 0) {
        currentDepth--;
      }
      
      // Check depth at function end
      if (this.isFunctionEnd(trimmed, currentDepth) && currentFunction) {
        if (maxDepthInFunction > 5) {
          this.addIssue('nesting_depth', 'critical',
            `Function '${currentFunction}' has nesting depth ${maxDepthInFunction} (threshold: 5)`,
            REMEDIATION_TIMES.NESTING_DEPTH.critical, functionStartLine, currentFunction);
        } else if (maxDepthInFunction > 4) {
          this.addIssue('nesting_depth', 'major',
            `Function '${currentFunction}' has nesting depth ${maxDepthInFunction} (threshold: 4)`,
            REMEDIATION_TIMES.NESTING_DEPTH.major, functionStartLine, currentFunction);
        } else if (maxDepthInFunction > 3) {
          this.addIssue('nesting_depth', 'minor',
            `Function '${currentFunction}' has nesting depth ${maxDepthInFunction} (threshold: 3)`,
            REMEDIATION_TIMES.NESTING_DEPTH.minor, functionStartLine, currentFunction);
        }
        currentFunction = '';
      }
    });
  }

  private analyzeCodeDuplication() {
    const lines = this.code.split('\n');
    const blockSize = 6; // SonarQube minimum block size
    const duplicatedBlocks = new Map<string, number[]>();
    
    // Find duplicated blocks
    for (let i = 0; i <= lines.length - blockSize; i++) {
      const block = lines.slice(i, i + blockSize)
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('//'))
        .join('\n');
      
      if (block.length > 100) { // Minimum block content threshold
        if (!duplicatedBlocks.has(block)) {
          duplicatedBlocks.set(block, []);
        }
        duplicatedBlocks.get(block)!.push(i + 1);
      }
    }
    
    // Calculate duplication metrics
    let duplicatedLines = 0;
    duplicatedBlocks.forEach((occurrences, block) => {
      if (occurrences.length > 1) {
        const linesInBlock = block.split('\n').length;
        duplicatedLines += linesInBlock * (occurrences.length - 1);
        
        const duplicationPercentage = (duplicatedLines / lines.length) * 100;
        let severity: 'minor' | 'major' | 'critical' = 'minor';
        
        if (duplicationPercentage > 20) severity = 'critical';
        else if (duplicationPercentage > 10) severity = 'major';
        
        occurrences.forEach((lineNum, index) => {
          if (index > 0) { // Don't report the first occurrence
            this.addIssue('duplication', severity,
              `Duplicated code block (${linesInBlock} lines)`,
              REMEDIATION_TIMES.DUPLICATION[severity], lineNum);
          }
        });
      }
    });
  }

  private analyzeDocumentation() {
    const lines = this.code.split('\n');
    const functions = this.extractFunctions(lines);
    const classes = this.extractClasses(lines);
    
    // Check function documentation
    functions.forEach(func => {
      const hasDocumentation = this.hasDocumentationNear(lines, func.startLine - 1);
      const isPublic = this.isPublicFunction(func.declaration);
      const isComplex = func.endLine - func.startLine > 20;
      
      if (!hasDocumentation) {
        if (isPublic && isComplex) {
          this.addIssue('documentation', 'major',
            `Public function '${func.name}' lacks documentation`,
            REMEDIATION_TIMES.DOCUMENTATION.major, func.startLine, func.name);
        } else if (isPublic || isComplex) {
          this.addIssue('documentation', 'minor',
            `Function '${func.name}' should be documented`,
            REMEDIATION_TIMES.DOCUMENTATION.minor, func.startLine, func.name);
        }
      }
    });
    
    // Check class documentation
    classes.forEach(cls => {
      const hasDocumentation = this.hasDocumentationNear(lines, cls.startLine - 1);
      if (!hasDocumentation) {
        this.addIssue('documentation', 'critical',
          `Class '${cls.name}' lacks documentation`,
          REMEDIATION_TIMES.DOCUMENTATION.critical, cls.startLine, cls.name);
      }
    });
  }

  private analyzeCyclomaticComplexity() {
    const functions = this.extractFunctions(this.code.split('\n'));
    
    functions.forEach(func => {
      const functionCode = this.code.split('\n')
        .slice(func.startLine - 1, func.endLine)
        .join('\n');
      
      const complexity = this.calculateFunctionComplexity(functionCode);
      
      if (complexity > 30) {
        this.addIssue('complexity', 'critical',
          `Function '${func.name}' has cyclomatic complexity ${complexity} (threshold: 30)`,
          REMEDIATION_TIMES.COMPLEXITY.critical, func.startLine, func.name);
      } else if (complexity > 20) {
        this.addIssue('complexity', 'major',
          `Function '${func.name}' has cyclomatic complexity ${complexity} (threshold: 20)`,
          REMEDIATION_TIMES.COMPLEXITY.major, func.startLine, func.name);
      } else if (complexity > 15) {
        this.addIssue('complexity', 'minor',
          `Function '${func.name}' has cyclomatic complexity ${complexity} (threshold: 15)`,
          REMEDIATION_TIMES.COMPLEXITY.minor, func.startLine, func.name);
      }
    });
  }

  private analyzeNamingConventions() {
    const lines = this.code.split('\n');
    
    lines.forEach((line, index) => {
      // Check for single-letter variables (excluding common loop counters)
      const singleLetterVars = line.match(/\b(?:let|const|var|int|float|double)\s+([a-hj-km-np-z])\b/g);
      if (singleLetterVars) {
        singleLetterVars.forEach(match => {
          this.addIssue('naming', 'minor',
            'Single letter variable names should be avoided',
            REMEDIATION_TIMES.NAMING.minor, index + 1);
        });
      }
      
      // Check for inconsistent naming patterns
      if (this.hasInconsistentNaming(line)) {
        this.addIssue('naming', 'major',
          'Inconsistent naming convention detected',
          REMEDIATION_TIMES.NAMING.major, index + 1);
      }
    });
  }

  private analyzeStructuralIssues() {
    const lines = this.code.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Empty catch blocks
      if (trimmed.includes('catch') && 
          (trimmed.includes('{}') || 
           (index < lines.length - 1 && lines[index + 1].trim() === '{}'))) {
        this.addIssue('structure', 'major',
          'Empty catch block suppresses exceptions',
          REMEDIATION_TIMES.STRUCTURE.major, index + 1);
      }
      
      // Dead code after return
      if (trimmed.match(/^\s*return\s*.*;?\s*$/) && 
          index < lines.length - 1) {
        const nextLine = lines[index + 1].trim();
        if (nextLine && !nextLine.startsWith('}') && !nextLine.startsWith('//')) {
          this.addIssue('structure', 'minor',
            'Unreachable code after return statement',
            REMEDIATION_TIMES.STRUCTURE.minor, index + 2);
        }
      }
    });
  }

  // Helper methods
  private addIssue(
    type: DebtIssue['type'], 
    severity: DebtIssue['severity'], 
    description: string, 
    remedationTimeMinutes: number, 
    lineNumber?: number, 
    functionName?: string
  ) {
    this.issues.push({
      type,
      severity,
      description,
      remedationTimeMinutes,
      lineNumber,
      functionName
    });
  }

  private extractFunctions(lines: string[]): Array<{name: string, startLine: number, endLine: number, declaration: string}> {
    const functions: Array<{name: string, startLine: number, endLine: number, declaration: string}> = [];
    let currentFunction: {name: string, startLine: number, declaration: string} | null = null;
    let braceDepth = 0;
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (this.isFunctionStart(trimmed)) {
        const name = this.extractFunctionName(trimmed) || `function_${index}`;
        currentFunction = {
          name,
          startLine: index + 1,
          declaration: trimmed
        };
        braceDepth = 0;
      }
      
      if (currentFunction) {
        braceDepth += (line.match(/{/g) || []).length;
        braceDepth -= (line.match(/}/g) || []).length;
        
        if (braceDepth === 0 && line.includes('}')) {
          functions.push({
            ...currentFunction,
            endLine: index + 1
          });
          currentFunction = null;
        }
      }
    });
    
    return functions;
  }

  private extractClasses(lines: string[]): Array<{name: string, startLine: number}> {
    const classes: Array<{name: string, startLine: number}> = [];
    
    lines.forEach((line, index) => {
      const classMatch = line.match(/class\s+(\w+)/);
      if (classMatch) {
        classes.push({
          name: classMatch[1],
          startLine: index + 1
        });
      }
    });
    
    return classes;
  }

  private isFunctionStart(line: string): boolean {
    return !!(
      line.match(/function\s+\w+\s*\(/) ||
      line.match(/\w+\s*=\s*function\s*\(/) ||
      line.match(/\w+\s*:\s*function\s*\(/) ||
      line.match(/\w+\s*\([^)]*\)\s*{/) ||
      line.match(/\w+\s*=\s*\([^)]*\)\s*=>/) ||
      line.match(/^\s*\w+\s+\w+\s*\([^)]*\)\s*{/) || // C++ style
      line.match(/^\s*(?:public|private|protected)?\s*\w+\s+\w+\s*\([^)]*\)/) // Java/C++ methods
    );
  }

  private isFunctionEnd(line: string, depth: number): boolean {
    return line.includes('}') && depth === 0;
  }

  private isControlStructure(line: string): boolean {
    return !!(
      line.match(/\b(if|for|while|do|switch|try|catch)\s*\(/) ||
      line.match(/\belse\s*{/) ||
      line.match(/\bcase\s+.*:/) ||
      line.match(/\bdefault\s*:/)
    );
  }

  private extractFunctionName(line: string): string | null {
    const patterns = [
      /function\s+(\w+)\s*\(/,
      /(\w+)\s*=\s*function\s*\(/,
      /(\w+)\s*:\s*function\s*\(/,
      /(\w+)\s*\([^)]*\)\s*{/,
      /(\w+)\s*=\s*\([^)]*\)\s*=>/,
      /^\s*\w+\s+(\w+)\s*\([^)]*\)/, // C++ style
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  private hasDocumentationNear(lines: string[], lineIndex: number): boolean {
    // Check 3 lines above for documentation
    for (let i = Math.max(0, lineIndex - 3); i < lineIndex; i++) {
      const line = lines[i]?.trim() || '';
      if (line.startsWith('/**') || 
          line.startsWith('///') ||
          line.startsWith('//') ||
          line.startsWith('/*')) {
        return true;
      }
    }
    return false;
  }

  private isPublicFunction(declaration: string): boolean {
    return declaration.includes('public') || 
           declaration.includes('export') ||
           !declaration.includes('private');
  }

  private hasInconsistentNaming(line: string): boolean {
    const camelCaseVars = line.match(/\b[a-z][a-zA-Z0-9]*\b/g) || [];
    const snake_caseVars = line.match(/\b[a-z][a-z0-9_]*\b/g)?.filter(v => v.includes('_')) || [];
    
    return camelCaseVars.length > 0 && snake_caseVars.length > 0;
  }

  private calculateFunctionComplexity(functionCode: string): number {
    const controlStructures = [
      /\bif\s*\(/g, /\bfor\s*\(/g, /\bwhile\s*\(/g, /\bswitch\s*\(/g,
      /\bcase\s+/g, /&&|\|\|/g, /\?\s*.*:/g, /\bcatch\s*\(/g
    ];
    
    let complexity = 1; // Base complexity
    controlStructures.forEach(pattern => {
      const matches = functionCode.match(pattern);
      if (matches) complexity += matches.length;
    });
    
    return complexity;
  }

  private calculateGradeFromDebtRatio(debtRatio: number): ScoreGrade {
    // SonarQube debt ratio thresholds
    if (debtRatio <= 5) return 'A';   // 0-5%
    if (debtRatio <= 10) return 'B';  // 6-10%
    if (debtRatio <= 20) return 'C';  // 11-20%
    return 'D';                       // 21%+
  }
}
