
# Core Modules Documentation

## 📋 Module Overview

The analysis system consists of several interconnected modules, each with specific responsibilities in the code quality assessment pipeline.

## 🔧 codeMetrics.ts

### Purpose
Core module responsible for extracting raw metrics from source code including lines of code, complexity measurements, and structural analysis.

### Input/Output Structure
```typescript
// Input
function getCodeMetrics(code: string, language: string): MetricsResult

// Output
interface MetricsResult {
  linesOfCode: number;
  codeLines: number;
  commentLines: number;
  commentPercentage: number;
  functionCount: number;
  averageFunctionLength: number;
  maxNestingDepth: number;
  cyclomaticComplexity: number;
}
```

### Core Logic & Algorithms

#### 1. Cyclomatic Complexity Calculation
```typescript
export const calculateCyclomaticComplexity = (code: string, language: string): number => {
  let complexity = 1; // Base complexity
  const lines = code.split("\n");
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Decision points (+1 each)
    if (hasConditionalStatement(trimmed)) complexity++;
    if (hasLoopStatement(trimmed)) complexity++;
    if (hasCatchStatement(trimmed)) complexity++;
    
    // Logical operators (+1 per operator)
    complexity += countLogicalOperators(trimmed);
    
    // Ternary operators (+1 each)
    complexity += countTernaryOperators(trimmed);
  }
  
  return complexity;
}
```

**Key Features:**
- SonarQube-aligned complexity calculation
- Multi-language support with language-specific patterns
- Nested function and lambda complexity tracking
- JSX and callback complexity inclusion

#### 2. Maintainability Index Calculation
```typescript
export const calculateMaintainability = (code: string, language: string): number => {
  let baseScore = 100;
  
  // Size penalties
  const codeLines = countLogicalLines(code);
  if (codeLines > 1000) baseScore -= 15;
  
  // Function size analysis
  const functionInfo = analyzeFunctionSizes(code, language);
  if (functionInfo.maxSize > 100) baseScore -= 15;
  
  // Nesting depth penalties
  const maxNesting = calculateMaxNestingDepth(code);
  if (maxNesting > 5) baseScore -= 15;
  
  // Additional factors...
  return Math.max(0, Math.min(100, baseScore));
}
```

#### 3. Reliability Assessment
```typescript
export const calculateReliability = (code: string, language: string): { score: number, issues: ReliabilityIssue[] } => {
  let baseScore = 100;
  const reliabilityIssues: ReliabilityIssue[] = [];
  
  // Critical pattern detection
  detectNullDereference(code).forEach(issue => {
    reliabilityIssues.push(createCriticalIssue(issue));
    baseScore -= RUNTIME_CRITICAL_PENALTY;
  });
  
  // Additional reliability checks...
  return { score: Math.max(0, baseScore), issues: reliabilityIssues };
}
```

### Configuration Parameters
```typescript
// Penalty constants
const RUNTIME_CRITICAL_PENALTY = 20;
const EXCEPTION_HANDLING_PENALTY = 10;
const DEEP_NESTING_PENALTY = 5;
const READABILITY_PENALTY = 3;

// Size thresholds
const SIZE_THRESHOLDS = {
  LARGE_FILE: 1000,
  MEDIUM_FILE: 500,
  LARGE_FUNCTION: 100,
  DEEP_NESTING: 5
};
```

## 🛡️ reliabilityRating.ts

### Purpose
Implements SonarQube-style reliability analysis focusing on bug detection and crash-prone pattern identification.

### Input/Output Structure
```typescript
// Primary function
function getReliabilityRating(score: number, issues?: ReliabilityIssue[]): ScoreData

// Supporting function
function calculateReliabilityScore(issues?: ReliabilityIssue[]): { score: number; letter: ScoreGrade }
```

### Core Logic & Algorithms

#### SonarQube Reliability Grading
```typescript
export function getReliabilityRating(score: number, issues?: ReliabilityIssue[]): ScoreData {
  // Use SonarQube grading system
  const result: ReliabilityGradeResult = calculateReliabilityGrade(issues);
  const improvements = generateSonarQubeImprovements(result);

  const description = generateGradeDescription(result);
  const issuesList = generateIssuesList(result);

  return {
    score: result.grade,
    description,
    reason: result.reason,
    issues: issuesList,
    improvements,
    warningFlag: result.grade === 'C' || result.grade === 'D'
  };
}
```

#### Grade Description Generation
```typescript
function generateGradeDescription(result: ReliabilityGradeResult): string {
  const { grade, severityCounts } = result;
  
  switch (grade) {
    case 'A':
      return severityCounts.minor > 0 
        ? `Excellent reliability (${severityCounts.minor} minor issues)`
        : 'Excellent reliability - no issues detected';
        
    case 'D':
      return `Poor reliability - immediate action required (${severityCounts.blocker} blocker, ${severityCounts.critical} critical)`;
      
    // Additional cases...
  }
}
```

### Scoring Logic
- **Grade A**: ≤5 minor issues only
- **Grade B**: 1-2 major OR 6-10 minor issues
- **Grade C**: 1 critical OR 3+ major issues
- **Grade D**: Any blocker OR 2+ critical OR 10+ major issues

## 🔧 maintainabilityRating.ts

### Purpose
Calculates technical debt ratio and maintainability grade using SonarQube methodology, focusing on code structure and long-term maintenance costs.

### Input/Output Structure
```typescript
function getMaintainabilityRating(
  score: number, 
  actualDuplicationPercent?: number,
  context?: string
): ScoreData
```

### Core Logic & Algorithms

#### Technical Debt Calculation
```typescript
function calculateMaintainabilityDebt(
  score: number, 
  actualDuplicationPercent?: number,
  context?: string
): { debtRatio: number; violations: any[] } {
  
  const violations: any[] = [];
  let totalDebtMinutes = 0;
  
  // Function size debt (20 min per violation)
  const functionSizeIssues = assessFunctionSizeDebt(score);
  if (functionSizeIssues.violations > 0) {
    totalDebtMinutes += functionSizeIssues.violations * 20;
    violations.push({
      type: 'Function Size',
      count: functionSizeIssues.violations,
      severity: functionSizeIssues.severity,
      debtMinutes: functionSizeIssues.violations * 20
    });
  }
  
  // Calculate final debt ratio
  const estimatedLOC = Math.max(100, score * 10);
  const estimatedDevelopmentMinutes = estimatedLOC * 30;
  const debtRatio = (totalDebtMinutes / estimatedDevelopmentMinutes) * 100;
  
  return { debtRatio, violations };
}
```

#### Context-Based Adjustments
```typescript
// File type detection and multiplier application
const isTestFile = (context?: string): boolean => {
  return /test|spec|mock|fixture/i.test(context || '');
};

const documentationMultiplier = isExemptFile ? 0.3 : 1.0;
const duplicationMultiplier = isTestFile(context) ? 0.5 : 1.0;
```

### SonarQube Thresholds
```typescript
const SONARQUBE_THRESHOLDS = {
  FUNCTION_SIZE: {
    ACCEPTABLE: 30,
    MAJOR: 60,
    CRITICAL: 100
  },
  DUPLICATION: {
    ACCEPTABLE: 5,
    MINOR: 10,
    MAJOR: 20,
    CRITICAL: 30
  }
};
```

### Debt Ratio Grades
- **Grade A**: 0-5% debt ratio
- **Grade B**: 6-10% debt ratio
- **Grade C**: 11-20% debt ratio
- **Grade D**: 21%+ debt ratio

## 🔄 cyclomaticComplexityRating.ts

### Purpose
Analyzes code complexity using McCabe's Cyclomatic Complexity with additional heuristics for nesting depth and structural complexity.

### Input/Output Structure
```typescript
function getCyclomaticComplexityRating(score: number): ScoreData
```

### Core Logic & Algorithms

#### Complexity Analysis with Nesting Penalties
```typescript
export function getCyclomaticComplexityRating(score: number): ScoreData {
  const safeScore = Math.max(0, score);
  const baseRating = getGradeFromScore(safeScore, scoreThresholds.cyclomaticComplexity);

  // Estimate structural complexity
  const estimatedNestingDepth = estimateNestingDepth(safeScore);
  const estimatedNestedLoops = estimateNestedLoops(safeScore);
  const nestingPenaltyFactor = calculateNestingPenaltyFactor(safeScore);

  let adjustedScore = safeScore;
  
  // Apply penalties for high structural complexity
  if (estimatedNestedLoops > 1 || estimatedNestingDepth > 6) {
    adjustedScore = Math.min(100, safeScore * nestingPenaltyFactor);
  }

  const finalRating = getGradeFromScore(adjustedScore, scoreThresholds.cyclomaticComplexity);
  
  return generateComplexityReport(safeScore, finalRating, estimatedNestingDepth, estimatedNestedLoops);
}
```

#### Nesting Depth Estimation
```typescript
function estimateNestingDepth(score: number): number {
  if (score <= 5) return Math.floor(Math.max(1, score / 2));
  if (score <= 10) return 2 + Math.floor((score - 5) / 2);
  if (score <= 20) return 5 + Math.floor((score - 10) / 2);
  return 10 + Math.floor((score - 20) / 3);
}
```

### Complexity Thresholds
```typescript
const scoreThresholds = {
  cyclomaticComplexity: { A: 0, B: 11, C: 16, D: 21 }
};
```

## 🎯 sonarQubeReliability.ts

### Purpose
Implements SonarQube's reliability methodology with issue severity mapping and grade calculation based on issue counts rather than score deduction.

### Input/Output Structure
```typescript
interface ReliabilityGradeResult {
  grade: ScoreGrade;
  severityCounts: SeverityCount;
  issues: SonarQubeIssue[];
  reason: string;
  riskSummary: string;
}

function calculateReliabilityGrade(issues?: ReliabilityIssue[]): ReliabilityGradeResult
```

### Core Logic & Algorithms

#### Issue Severity Mapping
```typescript
export function mapToSonarQubeSeverity(issue: ReliabilityIssue): SonarQubeSeverity {
  const description = (issue.description || '').toLowerCase();
  const context = (issue.codeContext || '').toLowerCase();
  const combined = `${description} ${context}`;

  // Blocker patterns (immediate crash risks)
  const blockerPatterns = [
    'null pointer', 'nullpointerexception', 'segmentation fault', 
    'stack overflow', 'divide by zero', 'buffer overflow'
  ];

  for (const pattern of blockerPatterns) {
    if (combined.includes(pattern)) {
      return 'blocker';
    }
  }

  // Critical patterns (high crash potential)
  const criticalPatterns = [
    'unhandled exception', 'array index out of bounds', 
    'null reference', 'memory leak'
  ];

  // Continue with pattern matching...
  return determineSeverity(combined, issue.type);
}
```

#### Grade Determination Logic
```typescript
export function calculateReliabilityGrade(issues?: ReliabilityIssue[]): ReliabilityGradeResult {
  const sonarQubeIssues = convertToSonarQubeIssues(issues);
  const severityCounts = countBySeverity(sonarQubeIssues);

  let grade: ScoreGrade = 'A';
  
  // SonarQube logic: most severe issue determines grade
  if (severityCounts.blocker > 0) {
    grade = 'D';
  } else if (severityCounts.critical >= 2) {
    grade = 'D';
  } else if (severityCounts.critical >= 1) {
    grade = 'C';
  } else if (severityCounts.major >= 3) {
    grade = 'C';
  } else if (severityCounts.major >= 1 || severityCounts.minor > 5) {
    grade = 'B';
  }

  return {
    grade,
    severityCounts,
    issues: sonarQubeIssues,
    reason: generateReason(grade, severityCounts),
    riskSummary: generateRiskSummary(grade, severityCounts)
  };
}
```

### Pattern Libraries
```typescript
export const CRASH_PRONE_PATTERNS = [
  'null pointer', 'divide by zero', 'buffer overflow',
  'unhandled exception', 'infinite recursion', 'deadlock',
  // ... comprehensive list
] as const;
```

## 🔗 reliabilityHelpers.ts

### Purpose
Utility functions for reliability analysis including issue grouping, severity assessment, and improvement suggestions.

### Key Functions

#### Issue Grouping
```typescript
export function groupSimilarIssues(issues: ReliabilityIssue[]): IssueGroup[] {
  const groups: Record<string, IssueGroup> = {};

  for (const issue of issues) {
    const category = issue.category || 'unknown';
    const severity = issue.type || 'minor';
    const key = `${category}_${severity}`;
    
    if (!groups[key]) {
      groups[key] = { key, issues: [] };
    }
    groups[key].issues.push(issue);
  }

  return Object.values(groups);
}
```

#### Issue Categorization
```typescript
export function categorizeReliabilityIssues(issues: ReliabilityIssue[]): CategoryWithIssues[] {
  const result = calculateReliabilityGrade(issues);
  const sonarQubeIssues = result.issues;

  const categories: CategoryWithIssues[] = [];

  // Group by SonarQube severity levels
  const blockerIssues = sonarQubeIssues.filter(i => i.severity === 'blocker');
  const criticalIssues = sonarQubeIssues.filter(i => i.severity === 'critical');
  
  if (blockerIssues.length > 0) {
    categories.push({
      name: 'Bugs - Critical',
      issues: convertSonarQubeToReliability(blockerIssues),
      severity: 'critical'
    });
  }

  return categories;
}
```

## ⚙️ scoreThresholds.ts

### Purpose
Central configuration for all grading thresholds, constants, and analysis parameters.

### Key Configurations

#### SonarQube Grade Thresholds
```typescript
export const SONARQUBE_GRADE_THRESHOLDS = {
  A: { blocker: 0, critical: 0, major: 0, minor: 5 },
  B: { blocker: 0, critical: 0, major: 2, minor: 10 },
  C: { blocker: 0, critical: 1, major: 5, minor: 20 },
  D: { blocker: 1, critical: 2, major: 10, minor: 50 }
} as const;
```

#### Analysis Constants
```typescript
export const ANALYSIS_CONSTANTS = {
  SEVERITY: {
    CRITICAL: 25,
    MAJOR: 10,
    MINOR: 3
  },
  NESTING_DEPTH: {
    LOW: 2,
    MODERATE: 4,
    HIGH: 6
  },
  FUNCTION_SIZE: {
    ACCEPTABLE: 0,
    HIGH: 5,
    MAX_IMPACT: 15
  }
};
```

## 🧮 scoringUtils.ts

### Purpose
Common utilities for score calculation, pattern detection, and grade conversion across all analysis modules.

### Key Utilities

#### Critical Pattern Detection
```typescript
export function detectCriticalPattern(description: string, context: string): boolean {
  const desc = description.toLowerCase().trim();
  const ctx = context.toLowerCase().trim();

  // Check for known critical patterns
  const hasKeywordPattern = CRITICAL_PATTERNS.some(pattern => {
    return desc.includes(pattern) || ctx.includes(pattern);
  });

  // Enhanced code analysis for crash-prone patterns
  const codeAnalysis = analyzeCodeForCrashRisks(ctx);
  const descriptionAnalysis = analyzeDescriptionForRisks(desc);

  return hasKeywordPattern || codeAnalysis.hasRisk || descriptionAnalysis.hasRisk;
}
```

#### Context Factor Calculation
```typescript
export function calculateContextFactor(issues: ReliabilityIssue[]): number {
  if (!Array.isArray(issues) || issues.length === 0) return 1.0;

  const context = issues[0].codeContext?.toLowerCase() || '';
  const severity = issues[0].type;
  let factor = 1.0;

  // For critical issues, apply minimal context reduction
  if (severity === 'critical') {
    if (context.includes('test')) factor *= 0.9;
    if (context.includes('helper') || context.includes('util')) factor *= 0.9;
    return Math.max(0.8, factor); // Never reduce critical issues below 80%
  }

  // Normal context factors for non-critical issues
  if (context.includes('test')) factor *= 0.5;
  if (context.includes('try') || context.includes('catch')) factor *= 0.7;
  
  return factor;
}
```

This comprehensive module documentation covers all core analysis components, their algorithms, configurations, and interactions within the code quality assessment system.
