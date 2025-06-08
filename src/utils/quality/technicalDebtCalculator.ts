
import { ScoreGrade } from '@/types';

export interface DebtIssue {
  type: 'function_size' | 'nesting_depth' | 'duplication' | 'documentation' | 'complexity' | 'naming' | 'structure' | 'unused_code' | 'magic_numbers';
  severity: 'minor' | 'major' | 'critical';
  description: string;
  remedationTimeMinutes: number;
  lineNumber?: number;
  functionName?: string;
  file?: string;
}

export interface TechnicalDebtResult {
  totalDebtMinutes: number;
  debtRatio: number;
  grade: ScoreGrade;
  issues: DebtIssue[];
  codeSmells: number;
  estimatedDevelopmentMinutes: number;
}

// SonarQube-aligned remediation time constants (in minutes)
const REMEDIATION_TIMES = {
  FUNCTION_SIZE: {
    minor: 15,    // Function moderately over threshold (31-50 lines)
    major: 30,    // Function significantly over threshold (51-100 lines)
    critical: 60  // Very large function requiring major refactoring (100+ lines)
  },
  NESTING_DEPTH: {
    minor: 10,    // One level over threshold (depth 4)
    major: 20,    // Multiple levels requiring restructuring (depth 5-6)
    critical: 45  // Deep nesting requiring architectural changes (depth 7+)
  },
  DUPLICATION: {
    minor: 20,    // Small duplicated blocks (6-10 lines)
    major: 40,    // Significant duplication (11-20 lines)
    critical: 80  // Extensive duplication across multiple files (21+ lines)
  },
  DOCUMENTATION: {
    minor: 5,     // Missing simple method documentation
    major: 10,    // Missing complex method documentation
    critical: 20  // Missing class/module documentation
  },
  COMPLEXITY: {
    minor: 20,    // Moderate complexity requiring simplification (11-15)
    major: 40,    // High complexity requiring refactoring (16-25)
    critical: 90  // Very high complexity requiring redesign (26+)
  },
  NAMING: {
    minor: 5,     // Simple rename or convention fix
    major: 15,    // Significant naming improvements
    critical: 30  // Major naming convention overhaul
  },
  STRUCTURE: {
    minor: 15,    // Minor structural improvements
    major: 35,    // Significant structural changes
    critical: 60  // Major architectural refactoring
  },
  UNUSED_CODE: {
    minor: 5,     // Unused variable or import
    major: 15,    // Unused method or class
    critical: 30  // Large unused code segments
  },
  MAGIC_NUMBERS: {
    minor: 3,     // Single magic number
    major: 8,     // Multiple magic numbers
    critical: 15  // Widespread use of magic numbers
  }
} as const;

export class TechnicalDebtCalculator {
  private issues: DebtIssue[] = [];
  private estimatedLOC: number;
  private functions: Array<{name: string, startLine: number, endLine: number, complexity: number}> = [];
  
  constructor(
    private code: string, 
    private language: string,
    codeLines: number,
    private fileName?: string
  ) {
    this.estimatedLOC = Math.max(10, codeLines);
  }

  calculateTechnicalDebt(): TechnicalDebtResult {
    this.issues = [];
    this.functions = [];
    
    // Pre-analyze the code structure
    this.analyzeFunctions();
    
    // Comprehensive debt analysis
    this.analyzeFunctionSizes();
    this.analyzeNestingComplexity();
    this.analyzeCodeDuplication();
    this.analyzeDocumentation();
    this.analyzeCyclomaticComplexity();
    this.analyzeNamingConventions();
    this.analyzeStructuralIssues();
    this.analyzeUnusedCode();
    this.analyzeMagicNumbers();
    
    const totalDebtMinutes = this.issues.reduce((sum, issue) => sum + issue.remedationTimeMinutes, 0);
    
    // SonarQube formula: 1 LOC = 30 minutes development time (industry standard)
    const estimatedDevelopmentMinutes = this.estimatedLOC * 30;
    const debtRatio = estimatedDevelopmentMinutes > 0 
      ? (totalDebtMinutes / estimatedDevelopmentMinutes) * 100 
      : 0;
    
    const grade = this.calculateGradeFromDebtRatio(debtRatio);
    const codeSmells = this.issues.length;
    
    console.log(`🔧 Technical Debt Analysis:`);
    console.log(`📊 LOC: ${this.estimatedLOC}, Functions: ${this.functions.length}`);
    console.log(`⏱️ Total Debt: ${this.formatTime(totalDebtMinutes)}`);
    console.log(`📈 Debt Ratio: ${debtRatio.toFixed(1)}%`);
    console.log(`🚨 Code Smells: ${codeSmells}`);
    console.log(`🎯 Grade: ${grade}`);
    
    return {
      totalDebtMinutes,
      debtRatio,
      grade,
      issues: this.issues,
      codeSmells,
      estimatedDevelopmentMinutes
    };
  }

  private analyzeFunctions() {
    const lines = this.code.split('\n');
    let currentFunction: {name: string, startLine: number, braceDepth: number} | null = null;
    let braceDepth = 0;
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Function detection
      if (this.isFunctionStart(trimmed)) {
        const name = this.extractFunctionName(trimmed) || `function_${index}`;
        currentFunction = {
          name,
          startLine: index + 1,
          braceDepth: 0
        };
        braceDepth = 0;
      }
      
      if (currentFunction) {
        braceDepth += (line.match(/{/g) || []).length;
        braceDepth -= (line.match(/}/g) || []).length;
        
        if (braceDepth === 0 && line.includes('}')) {
          const complexity = this.calculateFunctionComplexity(
            lines.slice(currentFunction.startLine - 1, index + 1).join('\n')
          );
          
          this.functions.push({
            name: currentFunction.name,
            startLine: currentFunction.startLine,
            endLine: index + 1,
            complexity
          });
          currentFunction = null;
        }
      }
    });
  }

  private analyzeFunctionSizes() {
    this.functions.forEach(func => {
      const size = func.endLine - func.startLine + 1;
      
      if (size > 100) {
        this.addIssue('function_size', 'critical', 
          `Function '${func.name}' is ${size} lines (threshold: 100). Consider breaking into smaller methods.`,
          REMEDIATION_TIMES.FUNCTION_SIZE.critical, func.startLine, func.name);
      } else if (size > 50) {
        this.addIssue('function_size', 'major',
          `Function '${func.name}' is ${size} lines (threshold: 50). Should be refactored for better readability.`,
          REMEDIATION_TIMES.FUNCTION_SIZE.major, func.startLine, func.name);
      } else if (size > 30) {
        this.addIssue('function_size', 'minor',
          `Function '${func.name}' is ${size} lines (threshold: 30). Consider simplifying.`,
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
      
      if (this.isFunctionStart(trimmed)) {
        currentFunction = this.extractFunctionName(trimmed) || `function_${index}`;
        functionStartLine = index + 1;
        currentDepth = 0;
        maxDepthInFunction = 0;
      }
      
      // Count control structures that add nesting
      if (this.isControlStructure(trimmed)) {
        currentDepth++;
        maxDepthInFunction = Math.max(maxDepthInFunction, currentDepth);
      } else if (trimmed.includes('}') && currentDepth > 0) {
        currentDepth--;
      }
      
      if (this.isFunctionEnd(trimmed, currentDepth) && currentFunction) {
        if (maxDepthInFunction > 6) {
          this.addIssue('nesting_depth', 'critical',
            `Function '${currentFunction}' has excessive nesting depth ${maxDepthInFunction} (threshold: 6). Requires architectural changes.`,
            REMEDIATION_TIMES.NESTING_DEPTH.critical, functionStartLine, currentFunction);
        } else if (maxDepthInFunction > 4) {
          this.addIssue('nesting_depth', 'major',
            `Function '${currentFunction}' has high nesting depth ${maxDepthInFunction} (threshold: 4). Needs restructuring.`,
            REMEDIATION_TIMES.NESTING_DEPTH.major, functionStartLine, currentFunction);
        } else if (maxDepthInFunction > 3) {
          this.addIssue('nesting_depth', 'minor',
            `Function '${currentFunction}' has moderate nesting depth ${maxDepthInFunction} (threshold: 3). Consider simplification.`,
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
        .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('*'))
        .join('\n');
      
      if (block.length > 50) { // Minimum meaningful block content
        if (!duplicatedBlocks.has(block)) {
          duplicatedBlocks.set(block, []);
        }
        duplicatedBlocks.get(block)!.push(i + 1);
      }
    }
    
    // Calculate duplication debt
    let totalDuplicatedLines = 0;
    duplicatedBlocks.forEach((occurrences, block) => {
      if (occurrences.length > 1) {
        const linesInBlock = block.split('\n').length;
        totalDuplicatedLines += linesInBlock * (occurrences.length - 1);
        
        let severity: 'minor' | 'major' | 'critical' = 'minor';
        if (linesInBlock > 20) severity = 'critical';
        else if (linesInBlock > 10) severity = 'major';
        
        occurrences.forEach((lineNum, index) => {
          if (index > 0) { // Don't report the first occurrence
            this.addIssue('duplication', severity,
              `Duplicated code block of ${linesInBlock} lines. Extract into a reusable method.`,
              REMEDIATION_TIMES.DUPLICATION[severity], lineNum);
          }
        });
      }
    });
    
    // Additional duplication penalty for high overall duplication
    const duplicationPercentage = (totalDuplicatedLines / lines.length) * 100;
    if (duplicationPercentage > 15) {
      this.addIssue('duplication', 'critical',
        `High code duplication: ${duplicationPercentage.toFixed(1)}% of codebase is duplicated`,
        REMEDIATION_TIMES.DUPLICATION.critical);
    }
  }

  private analyzeDocumentation() {
    this.functions.forEach(func => {
      const hasDocumentation = this.hasDocumentationNear(func.startLine - 1);
      const isPublic = this.isPublicFunction(func.name);
      const isComplex = func.complexity > 10 || (func.endLine - func.startLine) > 25;
      
      if (!hasDocumentation) {
        if (isPublic && isComplex) {
          this.addIssue('documentation', 'critical',
            `Complex public function '${func.name}' lacks documentation (complexity: ${func.complexity})`,
            REMEDIATION_TIMES.DOCUMENTATION.critical, func.startLine, func.name);
        } else if (isPublic || isComplex) {
          this.addIssue('documentation', 'major',
            `Function '${func.name}' should be documented (${isPublic ? 'public' : 'complex'})`,
            REMEDIATION_TIMES.DOCUMENTATION.major, func.startLine, func.name);
        } else if (func.endLine - func.startLine > 15) {
          this.addIssue('documentation', 'minor',
            `Function '${func.name}' would benefit from documentation`,
            REMEDIATION_TIMES.DOCUMENTATION.minor, func.startLine, func.name);
        }
      }
    });
    
    // Check for class-level documentation
    this.analyzeClassDocumentation();
  }

  private analyzeClassDocumentation() {
    const lines = this.code.split('\n');
    
    lines.forEach((line, index) => {
      const classMatch = line.match(/class\s+(\w+)/);
      if (classMatch) {
        const className = classMatch[1];
        const hasDocumentation = this.hasDocumentationNear(index);
        
        if (!hasDocumentation) {
          this.addIssue('documentation', 'critical',
            `Class '${className}' lacks documentation`,
            REMEDIATION_TIMES.DOCUMENTATION.critical, index + 1, className);
        }
      }
    });
  }

  private analyzeCyclomaticComplexity() {
    this.functions.forEach(func => {
      const complexity = func.complexity;
      
      if (complexity > 25) {
        this.addIssue('complexity', 'critical',
          `Function '${func.name}' has very high cyclomatic complexity ${complexity} (threshold: 25). Requires redesign.`,
          REMEDIATION_TIMES.COMPLEXITY.critical, func.startLine, func.name);
      } else if (complexity > 15) {
        this.addIssue('complexity', 'major',
          `Function '${func.name}' has high cyclomatic complexity ${complexity} (threshold: 15). Needs refactoring.`,
          REMEDIATION_TIMES.COMPLEXITY.major, func.startLine, func.name);
      } else if (complexity > 10) {
        this.addIssue('complexity', 'minor',
          `Function '${func.name}' has moderate cyclomatic complexity ${complexity} (threshold: 10). Consider simplification.`,
          REMEDIATION_TIMES.COMPLEXITY.minor, func.startLine, func.name);
      }
    });
  }

  private analyzeNamingConventions() {
    const lines = this.code.split('\n');
    const singleLetterVars = new Set<string>();
    
    lines.forEach((line, index) => {
      // Single-letter variables (excluding common loop counters)
      const singleLetterMatches = line.match(/\b(?:let|const|var|int|float|double)\s+([a-hj-km-np-z])\b/g);
      if (singleLetterMatches) {
        singleLetterMatches.forEach(match => {
          const varName = match.split(/\s+/).pop();
          if (varName && !singleLetterVars.has(varName)) {
            singleLetterVars.add(varName);
            this.addIssue('naming', 'minor',
              `Single letter variable '${varName}' should have a descriptive name`,
              REMEDIATION_TIMES.NAMING.minor, index + 1);
          }
        });
      }
      
      // Inconsistent naming patterns
      if (this.hasInconsistentNaming(line)) {
        this.addIssue('naming', 'major',
          'Inconsistent naming convention detected (mixing camelCase and snake_case)',
          REMEDIATION_TIMES.NAMING.major, index + 1);
      }
      
      // All caps variables (possible constants that should be better organized)
      const allCapsVars = line.match(/\b[A-Z][A-Z_0-9]{3,}\b/g);
      if (allCapsVars && !line.includes('const') && !line.includes('#define')) {
        this.addIssue('naming', 'minor',
          'Consider using proper constant declaration for all-caps identifiers',
          REMEDIATION_TIMES.NAMING.minor, index + 1);
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
          'Empty catch block suppresses exceptions. Add proper error handling.',
          REMEDIATION_TIMES.STRUCTURE.major, index + 1);
      }
      
      // Dead code after return
      if (trimmed.match(/^\s*return\s*.*;?\s*$/) && 
          index < lines.length - 1) {
        const nextLine = lines[index + 1].trim();
        if (nextLine && !nextLine.startsWith('}') && !nextLine.startsWith('//') && nextLine !== '') {
          this.addIssue('structure', 'minor',
            'Unreachable code after return statement',
            REMEDIATION_TIMES.STRUCTURE.minor, index + 2);
        }
      }
      
      // TODO/FIXME comments indicating technical debt
      if (trimmed.includes('TODO') || trimmed.includes('FIXME') || trimmed.includes('HACK')) {
        this.addIssue('structure', 'minor',
          'TODO/FIXME comment indicates incomplete implementation',
          REMEDIATION_TIMES.STRUCTURE.minor, index + 1);
      }
    });
  }

  private analyzeUnusedCode() {
    const lines = this.code.split('\n');
    const declaredVars = new Set<string>();
    const usedVars = new Set<string>();
    
    // Simple unused variable detection
    lines.forEach((line, index) => {
      // Variable declarations
      const varDeclarations = line.match(/\b(?:let|const|var)\s+(\w+)/g);
      if (varDeclarations) {
        varDeclarations.forEach(decl => {
          const varName = decl.split(/\s+/).pop();
          if (varName) {
            declaredVars.add(varName);
          }
        });
      }
      
      // Variable usage
      const identifiers = line.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g);
      if (identifiers) {
        identifiers.forEach(id => usedVars.add(id));
      }
    });
    
    // Check for potentially unused variables
    declaredVars.forEach(varName => {
      if (!usedVars.has(varName) && varName.length > 1) {
        this.addIssue('unused_code', 'minor',
          `Variable '${varName}' appears to be unused`,
          REMEDIATION_TIMES.UNUSED_CODE.minor);
      }
    });
  }

  private analyzeMagicNumbers() {
    const lines = this.code.split('\n');
    
    lines.forEach((line, index) => {
      // Find numeric literals (excluding common acceptable values)
      const magicNumbers = line.match(/\b(?<![\w.])\d{2,}\b(?![\w.])/g);
      if (magicNumbers) {
        magicNumbers.forEach(num => {
          const value = parseInt(num);
          // Exclude common acceptable numbers
          if (value !== 100 && value !== 1000 && value !== 0 && value !== 1) {
            this.addIssue('magic_numbers', 'minor',
              `Magic number ${num} should be replaced with a named constant`,
              REMEDIATION_TIMES.MAGIC_NUMBERS.minor, index + 1);
          }
        });
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
      functionName,
      file: this.fileName
    });
  }

  private isFunctionStart(line: string): boolean {
    return !!(
      line.match(/function\s+\w+\s*\(/) ||
      line.match(/\w+\s*=\s*function\s*\(/) ||
      line.match(/\w+\s*:\s*function\s*\(/) ||
      line.match(/\w+\s*\([^)]*\)\s*{/) ||
      line.match(/\w+\s*=\s*\([^)]*\)\s*=>/) ||
      line.match(/^\s*(?:public|private|protected)?\s*\w+\s+\w+\s*\([^)]*\)/) // C++ methods
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
      /^\s*(?:public|private|protected)?\s*\w+\s+(\w+)\s*\([^)]*\)/, // C++ style
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  private hasDocumentationNear(lineIndex: number): boolean {
    const lines = this.code.split('\n');
    
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

  private isPublicFunction(functionName: string): boolean {
    // Simple heuristic: functions starting with underscore are usually private
    return !functionName.startsWith('_');
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

  private formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }
}
