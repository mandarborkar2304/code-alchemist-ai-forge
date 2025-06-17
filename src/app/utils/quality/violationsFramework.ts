import { ScoreGrade } from '@/types';

// SonarQube-style severity levels (internal use)
export type SonarQubeSeverity = 'blocker' | 'critical' | 'major' | 'minor' | 'info';

// Simplified severity levels for display (our binary classification)
export type SimplifiedSeverity = 'major' | 'minor';

// Violation categories matching SonarQube
export type ViolationCategory = 'bug' | 'vulnerability' | 'code_smell' | 'security_hotspot';

// Violation types
export interface CodeViolation {
  id: string;
  sonarQubeSeverity: SonarQubeSeverity; // Internal SonarQube severity
  displaySeverity: SimplifiedSeverity;  // Simplified display severity
  category: ViolationCategory;
  rule: string;
  message: string;
  line?: number;
  column?: number;
  effort: number; // Minutes to fix
  debt: string; // Technical debt (e.g., "5min", "1h")
  tags: string[];
}

// Violation detection results
export interface ViolationAnalysisResult {
  violations: CodeViolation[];
  summary: {
    major: number;     // Blocker + Critical mapped to Major
    minor: number;     // Minor + Info mapped to Minor
    totalDebt: number; // Total minutes
    sonarQubeBreakdown: {
      blocker: number;
      critical: number;
      major: number;
      minor: number;
      info: number;
    };
  };
  grade: ScoreGrade;
  reliabilityRating: ScoreGrade;
  securityRating: ScoreGrade;
  maintainabilityRating: ScoreGrade;
}

// SonarQube severity to simplified severity mapping
function mapToSimplifiedSeverity(sonarQubeSeverity: SonarQubeSeverity): SimplifiedSeverity {
  switch (sonarQubeSeverity) {
    case 'blocker':
    case 'critical':
    case 'major':
      return 'major';
    case 'minor':
    case 'info':
      return 'minor';
  }
}

// SonarQube-style rule definitions
const VIOLATION_RULES = {
  // BLOCKER - Critical bugs that will cause crashes
  'null-pointer-dereference': {
    severity: 'blocker' as SonarQubeSeverity,
    category: 'bug' as ViolationCategory,
    effort: 30,
    message: 'Possible null pointer dereference',
    tags: ['bug', 'crash', 'runtime']
  },
  'divide-by-zero': {
    severity: 'blocker' as SonarQubeSeverity,
    category: 'bug' as ViolationCategory,
    effort: 15,
    message: 'Possible division by zero',
    tags: ['bug', 'arithmetic', 'runtime']
  },
  'infinite-loop': {
    severity: 'blocker' as SonarQubeSeverity,
    category: 'bug' as ViolationCategory,
    effort: 45,
    message: 'Potential infinite loop detected',
    tags: ['bug', 'performance', 'runtime']
  },

  // CRITICAL - High impact bugs
  'unchecked-array-access': {
    severity: 'critical' as SonarQubeSeverity,
    category: 'bug' as ViolationCategory,
    effort: 20,
    message: 'Array access without bounds checking',
    tags: ['bug', 'bounds', 'runtime']
  },
  'resource-leak': {
    severity: 'critical' as SonarQubeSeverity,
    category: 'bug' as ViolationCategory,
    effort: 25,
    message: 'Resource not properly closed',
    tags: ['bug', 'resource', 'memory']
  },
  'unhandled-exception': {
    severity: 'critical' as SonarQubeSeverity,
    category: 'bug' as ViolationCategory,
    effort: 20,
    message: 'Exception not properly handled',
    tags: ['bug', 'exception', 'error-handling']
  },

  // MAJOR - Significant code quality issues
  'cognitive-complexity': {
    severity: 'major' as SonarQubeSeverity,
    category: 'code_smell' as ViolationCategory,
    effort: 60,
    message: 'Method has high cognitive complexity',
    tags: ['maintainability', 'complexity']
  },
  'function-too-long': {
    severity: 'major' as SonarQubeSeverity,
    category: 'code_smell' as ViolationCategory,
    effort: 45,
    message: 'Function exceeds maximum length',
    tags: ['maintainability', 'function-size']
  },
  'too-many-parameters': {
    severity: 'major' as SonarQubeSeverity,
    category: 'code_smell' as ViolationCategory,
    effort: 30,
    message: 'Function has too many parameters',
    tags: ['maintainability', 'parameters']
  },
  'duplicated-code': {
    severity: 'major' as SonarQubeSeverity,
    category: 'code_smell' as ViolationCategory,
    effort: 40,
    message: 'Duplicated code block detected',
    tags: ['maintainability', 'duplication']
  },

  // MINOR - Code style and minor improvements
  'missing-documentation': {
    severity: 'minor' as SonarQubeSeverity,
    category: 'code_smell' as ViolationCategory,
    effort: 5,
    message: 'Public method should be documented',
    tags: ['documentation', 'maintainability']
  },
  'inconsistent-naming': {
    severity: 'minor' as SonarQubeSeverity,
    category: 'code_smell' as ViolationCategory,
    effort: 10,
    message: 'Inconsistent naming convention',
    tags: ['naming', 'convention']
  },
  'dead-code': {
    severity: 'minor' as SonarQubeSeverity,
    category: 'code_smell' as ViolationCategory,
    effort: 5,
    message: 'Dead code should be removed',
    tags: ['dead-code', 'cleanup']
  },
  'magic-number': {
    severity: 'minor' as SonarQubeSeverity,
    category: 'code_smell' as ViolationCategory,
    effort: 10,
    message: 'Magic number should be defined as constant',
    tags: ['magic-number', 'maintainability']
  }
} as const;

// Pattern-based violation detection
export class ViolationDetector {
  private violations: CodeViolation[] = [];
  private violationId = 1;

  constructor(private code: string, private language: string) {}

  // Main analysis method
  analyzeViolations(): ViolationAnalysisResult {
    this.violations = [];
    this.violationId = 1;

    // Run all detection methods
    this.detectNullPointerDereference();
    this.detectDivideByZero();
    this.detectUncheckedArrayAccess();
    this.detectResourceLeaks();
    this.detectUnhandledException();
    this.detectHighComplexity();
    this.detectLongFunctions();
    this.detectTooManyParameters();
    this.detectDuplicatedCode();
    this.detectMissingDocumentation();
    this.detectInconsistentNaming();
    this.detectDeadCode();
    this.detectMagicNumbers();

    return this.generateResults();
  }

  private addViolation(
    ruleKey: keyof typeof VIOLATION_RULES,
    line?: number,
    column?: number,
    customMessage?: string
  ) {
    const rule = VIOLATION_RULES[ruleKey];
    const sonarQubeSeverity = rule.severity;
    const displaySeverity = mapToSimplifiedSeverity(sonarQubeSeverity);
    
    const violation: CodeViolation = {
      id: `V${this.violationId++}`,
      sonarQubeSeverity,
      displaySeverity,
      category: rule.category,
      rule: ruleKey,
      message: customMessage || rule.message,
      line,
      column,
      effort: rule.effort,
      debt: this.formatDebt(rule.effort),
      tags: [...rule.tags]
    };
    this.violations.push(violation);
  }

  private formatDebt(minutes: number): string {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }

  // BLOCKER detections
  private detectNullPointerDereference() {
    const lines = this.code.split('\n');
    lines.forEach((line, index) => {
      // Simple null dereference patterns
      if (line.match(/\w+\.\w+/) && !line.includes('null') && !line.includes('undefined')) {
        const objectMatch = line.match(/(\w+)\.\w+/);
        if (objectMatch) {
          const objectName = objectMatch[1];
          // Check if null check exists nearby
          const hasNullCheck = lines.slice(Math.max(0, index - 3), index + 1)
            .some(prevLine => 
              prevLine.includes(`${objectName} !== null`) ||
              prevLine.includes(`${objectName} != null`) ||
              prevLine.includes(`if (${objectName})`)
            );
          
          if (!hasNullCheck && !['console', 'Math', 'Object', 'Array', 'this'].includes(objectName)) {
            this.addViolation('null-pointer-dereference', index + 1);
          }
        }
      }
    });
  }

  private detectDivideByZero() {
    const lines = this.code.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('/') && !line.includes('//')) {
        // Direct division by zero
        if (line.match(/\/\s*0\b/)) {
          this.addViolation('divide-by-zero', index + 1);
        }
        // Division by variable without zero check
        const divisionMatch = line.match(/\/\s*(\w+)/);
        if (divisionMatch && !line.includes('!= 0') && !line.includes('!== 0')) {
          this.addViolation('divide-by-zero', index + 1);
        }
      }
    });
  }

  // CRITICAL detections
  private detectUncheckedArrayAccess() {
    const lines = this.code.split('\n');
    lines.forEach((line, index) => {
      const arrayAccessMatch = line.match(/\w+\[\s*(\w+)\s*\]/);
      if (arrayAccessMatch && !/^\d+$/.test(arrayAccessMatch[1])) {
        const indexVar = arrayAccessMatch[1];
        // Check for bounds checking
        const hasBoundsCheck = lines.slice(Math.max(0, index - 2), index + 1)
          .some(prevLine => 
            prevLine.includes(`${indexVar} < `) ||
            prevLine.includes(`${indexVar} <= `) ||
            prevLine.includes('length')
          );
        
        if (!hasBoundsCheck) {
          this.addViolation('unchecked-array-access', index + 1);
        }
      }
    });
  }

  private detectResourceLeaks() {
    const lines = this.code.split('\n');
    const resourcePatterns = [
      /new FileReader|new FileWriter|createReadStream/,
      /new Socket|createServer|connect\(/,
      /new XMLHttpRequest|fetch\(/,
      /new WebSocket/
    ];

    lines.forEach((line, index) => {
      resourcePatterns.forEach(pattern => {
        if (pattern.test(line)) {
          // Check if resource is properly closed
          const hasCleanup = lines.slice(index, lines.length)
            .some(laterLine => 
              laterLine.includes('.close()') ||
              laterLine.includes('.destroy()') ||
              laterLine.includes('finally')
            );
          
          if (!hasCleanup) {
            this.addViolation('resource-leak', index + 1);
          }
        }
      });
    });
  }

  private detectUnhandledException() {
    const lines = this.code.split('\n');
    const riskyPatterns = [/\.parse\(/, /JSON\.parse/, /parseInt/, /parseFloat/];
    
    lines.forEach((line, index) => {
      riskyPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          // Check for try-catch nearby
          const hasTryCatch = lines.slice(Math.max(0, index - 5), index + 5)
            .some(nearLine => nearLine.includes('try') || nearLine.includes('catch'));
          
          if (!hasTryCatch) {
            this.addViolation('unhandled-exception', index + 1);
          }
        }
      });
    });
  }

  // MAJOR detections
  private detectHighComplexity() {
    // This would integrate with the cyclomatic complexity calculator
    const complexity = this.estimateComplexity();
    if (complexity > 15) {
      this.addViolation('cognitive-complexity', 1, 1, 
        `Method complexity is ${complexity} (threshold: 15)`);
    }
  }

  private detectLongFunctions() {
    const lines = this.code.split('\n');
    let inFunction = false;
    let functionStart = 0;
    let braceDepth = 0;

    lines.forEach((line, index) => {
      if (line.includes('function') || line.match(/\w+\s*\(/)) {
        inFunction = true;
        functionStart = index;
        braceDepth = 0;
      }

      if (inFunction) {
        braceDepth += (line.match(/{/g) || []).length;
        braceDepth -= (line.match(/}/g) || []).length;

        if (braceDepth === 0 && line.includes('}')) {
          const functionLength = index - functionStart + 1;
          if (functionLength > 50) {
            this.addViolation('function-too-long', functionStart + 1, 1,
              `Function is ${functionLength} lines (threshold: 50)`);
          }
          inFunction = false;
        }
      }
    });
  }

  private detectTooManyParameters() {
    const lines = this.code.split('\n');
    lines.forEach((line, index) => {
      const functionMatch = line.match(/function\s+\w+\s*\(([^)]*)\)|(\w+)\s*\(([^)]*)\)\s*[{=]/);
      if (functionMatch) {
        const params = functionMatch[1] || functionMatch[3] || '';
        const paramCount = params.split(',').filter(p => p.trim().length > 0).length;
        if (paramCount > 7) {
          this.addViolation('too-many-parameters', index + 1, 1,
            `Function has ${paramCount} parameters (threshold: 7)`);
        }
      }
    });
  }

  private detectDuplicatedCode() {
    const lines = this.code.split('\n');
    const blockSize = 5;
    const blocks = new Map<string, number[]>();

    for (let i = 0; i <= lines.length - blockSize; i++) {
      const block = lines.slice(i, i + blockSize).join('\n').trim();
      if (block.length > 50) {
        if (!blocks.has(block)) {
          blocks.set(block, []);
        }
        blocks.get(block)!.push(i + 1);
      }
    }

    blocks.forEach((occurrences, block) => {
      if (occurrences.length > 1) {
        occurrences.forEach(line => {
          this.addViolation('duplicated-code', line, 1,
            `Duplicated block found (${blockSize} lines)`);
        });
      }
    });
  }

  // MINOR detections
  private detectMissingDocumentation() {
    const lines = this.code.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('function') || line.match(/public\s+\w+/)) {
        // Check for documentation comment above
        const hasDoc = index > 0 && (
          lines[index - 1].includes('/**') ||
          lines[index - 1].includes('//') ||
          lines[index - 2]?.includes('/**')
        );
        
        if (!hasDoc) {
          this.addViolation('missing-documentation', index + 1);
        }
      }
    });
  }

  private detectInconsistentNaming() {
    const identifiers = this.code.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    const camelCase = identifiers.filter(id => /^[a-z][a-zA-Z0-9]*$/.test(id));
    const snake_case = identifiers.filter(id => /^[a-z][a-z0-9_]*$/.test(id) && id.includes('_'));
    
    if (camelCase.length > 0 && snake_case.length > 0) {
      this.addViolation('inconsistent-naming', 1, 1,
        'Mixed camelCase and snake_case naming detected');
    }
  }

  private detectDeadCode() {
    const lines = this.code.split('\n');
    lines.forEach((line, index) => {
      if (line.trim() === 'return;' || line.includes('return ')) {
        // Check if there's code after return in same block
        if (index < lines.length - 1) {
          const nextLine = lines[index + 1].trim();
          if (nextLine && !nextLine.startsWith('}') && !nextLine.startsWith('//')) {
            this.addViolation('dead-code', index + 2);
          }
        }
      }
    });
  }

  private detectMagicNumbers() {
    const lines = this.code.split('\n');
    lines.forEach((line, index) => {
      // Look for numeric literals (excluding 0, 1, -1)
      const numbers = line.match(/\b\d{2,}\b/g);
      if (numbers) {
        numbers.forEach(num => {
          const value = parseInt(num);
          if (value > 1 && !line.includes('const') && !line.includes('final')) {
            this.addViolation('magic-number', index + 1, 1,
              `Magic number ${num} should be defined as constant`);
          }
        });
      }
    });
  }

  private estimateComplexity(): number {
    const controlStructures = [
      /\bif\s*\(/g, /\bfor\s*\(/g, /\bwhile\s*\(/g, /\bswitch\s*\(/g,
      /\bcase\s+/g, /&&|\|\|/g, /\?\s*.*:/g
    ];
    
    let complexity = 1; // Base complexity
    controlStructures.forEach(pattern => {
      const matches = this.code.match(pattern);
      if (matches) complexity += matches.length;
    });
    
    return complexity;
  }

  private generateResults(): ViolationAnalysisResult {
    // Count violations by SonarQube severity (internal tracking)
    const sonarQubeBreakdown = {
      blocker: this.violations.filter(v => v.sonarQubeSeverity === 'blocker').length,
      critical: this.violations.filter(v => v.sonarQubeSeverity === 'critical').length,
      major: this.violations.filter(v => v.sonarQubeSeverity === 'major').length,
      minor: this.violations.filter(v => v.sonarQubeSeverity === 'minor').length,
      info: this.violations.filter(v => v.sonarQubeSeverity === 'info').length
    };

    // Count violations by simplified severity (for display)
    const summary = {
      major: this.violations.filter(v => v.displaySeverity === 'major').length,
      minor: this.violations.filter(v => v.displaySeverity === 'minor').length,
      totalDebt: this.violations.reduce((sum, v) => sum + v.effort, 0),
      sonarQubeBreakdown
    };

    // Calculate grades based on violation counts (SonarQube style)
    const grade = this.calculateOverallGrade(sonarQubeBreakdown);
    const reliabilityRating = this.calculateReliabilityGrade(sonarQubeBreakdown);
    const securityRating = this.calculateSecurityGrade(sonarQubeBreakdown);
    const maintainabilityRating = this.calculateMaintainabilityGrade(summary);

    return {
      violations: this.violations,
      summary,
      grade,
      reliabilityRating,
      securityRating,
      maintainabilityRating
    };
  }

  private calculateOverallGrade(sonarQubeBreakdown: any): ScoreGrade {
    if (sonarQubeBreakdown.blocker > 0) return 'D';
    if (sonarQubeBreakdown.critical > 1 || sonarQubeBreakdown.major > 5) return 'C';
    if (sonarQubeBreakdown.critical > 0 || sonarQubeBreakdown.major > 2) return 'B';
    return 'A';
  }

  private calculateReliabilityGrade(sonarQubeBreakdown: any): ScoreGrade {
    const bugCount = this.violations.filter(v => v.category === 'bug').length;
    if (bugCount > 3) return 'D';
    if (bugCount > 1) return 'C';
    if (bugCount > 0) return 'B';
    return 'A';
  }

  private calculateSecurityGrade(sonarQubeBreakdown: any): ScoreGrade {
    const securityIssues = this.violations.filter(v => 
      v.category === 'vulnerability' || v.category === 'security_hotspot').length;
    if (securityIssues > 2) return 'D';
    if (securityIssues > 0) return 'C';
    return 'A';
  }

  private calculateMaintainabilityGrade(summary: any): ScoreGrade {
    const debtRatio = summary.totalDebt / 100; // Simplified debt ratio
    if (debtRatio > 20) return 'D';
    if (debtRatio > 10) return 'C';
    if (debtRatio > 5) return 'B';
    return 'A';
  }
}

// Main function to analyze violations
export function analyzeCodeViolations(code: string, language: string): ViolationAnalysisResult {
  const detector = new ViolationDetector(code, language);
  return detector.analyzeViolations();
}

// Helper function to format violations report with new severity mapping
export function formatViolationsReport(result: ViolationAnalysisResult): string {
  const { violations, summary } = result;
  
  let report = `## Code Quality Violations Report\n\n`;
  report += `### Summary\n`;
  report += `- **Overall Grade**: ${result.grade}\n`;
  report += `- **Reliability**: ${result.reliabilityRating}\n`;
  report += `- **Security**: ${result.securityRating}\n`;
  report += `- **Maintainability**: ${result.maintainabilityRating}\n`;
  report += `- **Total Technical Debt**: ${Math.floor(summary.totalDebt / 60)}h ${summary.totalDebt % 60}min\n\n`;
  
  report += `### Violation Counts (Simplified)\n`;
  report += `| Severity | Count |\n`;
  report += `|----------|-------|\n`;
  report += `| Major    | ${summary.major} |\n`;
  report += `| Minor    | ${summary.minor} |\n\n`;
  
  report += `### SonarQube Severity Breakdown (Internal)\n`;
  report += `| SonarQube Severity | Count |\n`;
  report += `|-------------------|-------|\n`;
  report += `| Blocker           | ${summary.sonarQubeBreakdown.blocker} |\n`;
  report += `| Critical          | ${summary.sonarQubeBreakdown.critical} |\n`;
  report += `| Major             | ${summary.sonarQubeBreakdown.major} |\n`;
  report += `| Minor             | ${summary.sonarQubeBreakdown.minor} |\n`;
  report += `| Info              | ${summary.sonarQubeBreakdown.info} |\n\n`;
  
  if (violations.length > 0) {
    report += `### Detailed Violations\n\n`;
    violations.forEach((violation, index) => {
      report += `#### ${index + 1}. ${violation.displaySeverity.toUpperCase()}: ${violation.message}\n`;
      report += `- **Rule**: ${violation.rule}\n`;
      report += `- **Category**: ${violation.category}\n`;
      report += `- **SonarQube Severity**: ${violation.sonarQubeSeverity}\n`;
      if (violation.line) report += `- **Location**: Line ${violation.line}\n`;
      report += `- **Effort**: ${violation.debt}\n`;
      report += `- **Tags**: ${violation.tags.join(', ')}\n\n`;
    });
  }
  
  return report;
}
