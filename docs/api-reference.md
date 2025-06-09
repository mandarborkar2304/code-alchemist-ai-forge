
# API Reference Documentation

## Overview

This document provides a comprehensive reference for all public APIs, functions, and interfaces available in the Code Alchemist AI Forge system. The APIs are organized by module and include detailed parameter descriptions, return types, and usage examples.

## Core Analysis APIs

### Primary Analysis Function

#### `analyzeCode(code: string, language: string): Promise<AnalysisResult>`

**Description**: Main entry point for code quality analysis

**Parameters**:
- `code: string` - Source code to analyze
- `language: string` - Programming language identifier

**Returns**: `Promise<AnalysisResult>`

**Example**:
```typescript
import { analyzeCode } from '@/utils/codeAnalysis';

const result = await analyzeCode(sourceCode, 'javascript');
console.log(`Overall Grade: ${result.overallGrade}`);
```

#### `getEnhancedCodeQualityAnalysis(code: string, language: string): EnhancedQualityResult`

**Description**: Enhanced analysis with technical debt and violations

**Parameters**:
- `code: string` - Source code to analyze
- `language: string` - Programming language identifier

**Returns**: `EnhancedQualityResult`

**Example**:
```typescript
import { getEnhancedCodeQualityAnalysis } from '@/utils/quality';

const analysis = getEnhancedCodeQualityAnalysis(code, 'typescript');
console.log(`Technical Debt: ${analysis.summary.technicalDebt} minutes`);
```

## Quality Rating APIs

### Reliability Analysis

#### `getReliabilityRating(score: number, issues?: ReliabilityIssue[]): ScoreData`

**Description**: Calculate reliability rating based on score and detected issues

**Parameters**:
- `score: number` - Numerical reliability score
- `issues?: ReliabilityIssue[]` - Optional array of detected reliability issues

**Returns**: `ScoreData`

**Example**:
```typescript
import { getReliabilityRating } from '@/utils/quality';

const rating = getReliabilityRating(85, detectedIssues);
console.log(`Reliability: ${rating.score} - ${rating.description}`);
```

#### `calculateReliabilityGrade(issues?: ReliabilityIssue[]): ReliabilityGradeResult`

**Description**: SonarQube-style reliability grading based on issue severity

**Parameters**:
- `issues?: ReliabilityIssue[]` - Array of reliability issues

**Returns**: `ReliabilityGradeResult`

**Example**:
```typescript
import { calculateReliabilityGrade } from '@/utils/quality/sonarQubeReliability';

const result = calculateReliabilityGrade(issues);
console.log(`Grade: ${result.grade}, Reason: ${result.reason}`);
```

### Maintainability Analysis

#### `getMaintainabilityRating(score: number, duplicationPercent?: number, context?: string, code?: string, language?: string): ScoreData`

**Description**: Enhanced maintainability analysis with technical debt calculation

**Parameters**:
- `score: number` - Base maintainability score
- `duplicationPercent?: number` - Code duplication percentage
- `context?: string` - File context or path
- `code?: string` - Actual source code for enhanced analysis
- `language?: string` - Programming language for specialized parsing

**Returns**: `ScoreData`

**Example**:
```typescript
import { getMaintainabilityRating } from '@/utils/quality';

const rating = getMaintainabilityRating(75, 5.2, 'src/utils/helper.ts', code, 'typescript');
```

#### `TechnicalDebtCalculator` Class

**Description**: Comprehensive technical debt analysis and calculation

**Constructor**:
```typescript
constructor(code: string, language: string, codeLines: number)
```

**Methods**:

##### `calculateTechnicalDebt(): TechnicalDebtResult`

**Description**: Calculate comprehensive technical debt metrics

**Returns**: `TechnicalDebtResult`

**Example**:
```typescript
import { TechnicalDebtCalculator } from '@/utils/quality/technicalDebtCalculator';

const calculator = new TechnicalDebtCalculator(code, 'java', 250);
const debt = calculator.calculateTechnicalDebt();
console.log(`Debt Ratio: ${debt.debtRatio}%`);
```

### Complexity Analysis

#### `getCyclomaticComplexityRating(score: number): ScoreData`

**Description**: SonarQube-aligned cyclomatic complexity rating

**Parameters**:
- `score: number` - Cyclomatic complexity score

**Returns**: `ScoreData`

**Example**:
```typescript
import { getCyclomaticComplexityRating } from '@/utils/quality';

const rating = getCyclomaticComplexityRating(18);
console.log(`Complexity: ${rating.score} - ${rating.description}`);
```

#### `calculateCyclomaticComplexity(code: string, language: string): number`

**Description**: Calculate cyclomatic complexity using SonarQube methodology

**Parameters**:
- `code: string` - Source code to analyze
- `language: string` - Programming language

**Returns**: `number` - Complexity score

**Example**:
```typescript
import { calculateCyclomaticComplexity } from '@/utils/codeMetrics';

const complexity = calculateCyclomaticComplexity(functionCode, 'python');
console.log(`Cyclomatic Complexity: ${complexity}`);
```

## Violation Analysis APIs

### Violation Detection

#### `analyzeCodeViolations(code: string, language: string): ViolationAnalysisResult`

**Description**: Comprehensive SonarQube-style violation detection

**Parameters**:
- `code: string` - Source code to analyze
- `language: string` - Programming language

**Returns**: `ViolationAnalysisResult`

**Example**:
```typescript
import { analyzeCodeViolations } from '@/utils/quality/violationsFramework';

const violations = analyzeCodeViolations(code, 'javascript');
console.log(`Total Violations: ${violations.violations.length}`);
```

#### `formatViolationsReport(analysis: ViolationAnalysisResult): string`

**Description**: Generate formatted violation report

**Parameters**:
- `analysis: ViolationAnalysisResult` - Violation analysis results

**Returns**: `string` - Formatted markdown report

**Example**:
```typescript
import { formatViolationsReport } from '@/utils/quality/violationsFramework';

const report = formatViolationsReport(violationAnalysis);
console.log(report);
```

## Language-Specific APIs

### C++ Parser

#### `CppParser` Class

**Description**: Advanced C++ source code parsing and analysis

**Constructor**:
```typescript
constructor(code: string)
```

**Methods**:

##### `parse(): CppParseResult`

**Description**: Parse C++ code and extract structural information

**Returns**: `CppParseResult`

**Example**:
```typescript
import { CppParser } from '@/utils/quality/cppParser';

const parser = new CppParser(cppCode);
const result = parser.parse();
console.log(`Functions: ${result.functions.length}, Classes: ${result.classes.length}`);
```

## Utility APIs

### Scoring Utilities

#### `getGradeFromScore(score: number, thresholds: Record<ScoreGrade, number>): ScoreGrade`

**Description**: Convert numerical score to letter grade using thresholds

**Parameters**:
- `score: number` - Numerical score
- `thresholds: Record<ScoreGrade, number>` - Grade thresholds

**Returns**: `ScoreGrade`

**Example**:
```typescript
import { getGradeFromScore, scoreThresholds } from '@/utils/quality';

const grade = getGradeFromScore(82, scoreThresholds.maintainability);
console.log(`Grade: ${grade}`); // "B"
```

#### `needsReliabilityWarningFlag(grade: ScoreGrade): boolean`

**Description**: Determine if a grade requires warning flag

**Parameters**:
- `grade: ScoreGrade` - Letter grade

**Returns**: `boolean`

**Example**:
```typescript
import { needsReliabilityWarningFlag } from '@/utils/quality';

const needsWarning = needsReliabilityWarningFlag('C'); // true
```

### Helper Functions

#### `categorizeReliabilityIssues(issues: ReliabilityIssue[]): CategorizedIssues`

**Description**: Categorize reliability issues by severity and type

**Parameters**:
- `issues: ReliabilityIssue[]` - Array of reliability issues

**Returns**: `CategorizedIssues`

**Example**:
```typescript
import { categorizeReliabilityIssues } from '@/utils/quality';

const categorized = categorizeReliabilityIssues(detectedIssues);
console.log(`Critical Issues: ${categorized.critical.length}`);
```

## Type Definitions

### Core Types

#### `ScoreData`
```typescript
interface ScoreData {
  score: ScoreGrade;              // Letter grade (A, B, C, D)
  description: string;            // Human-readable description
  reason: string;                 // Detailed reasoning
  issues: string[];              // List of identified issues
  improvements?: string[];        // Improvement suggestions
  warningFlag?: boolean;         // Indicates urgent attention needed
  technicalDebt?: TechnicalDebtInfo; // Enhanced debt information
}
```

#### `TechnicalDebtResult`
```typescript
interface TechnicalDebtResult {
  totalDebtMinutes: number;       // Total remediation time
  debtRatio: number;             // Percentage of development time
  grade: ScoreGrade;             // A, B, C, or D grade
  issues: DebtIssue[];           // Detailed issue list
  codeSmells: number;            // Total number of issues
  breakdown: DebtBreakdown;      // Issue breakdown by category
}
```

#### `ViolationAnalysisResult`
```typescript
interface ViolationAnalysisResult {
  violations: Violation[];        // Individual violations
  summary: ViolationSummary;     // Summary statistics
  grade: ScoreGrade;             // Overall grade
  recommendations: string[];      // Improvement recommendations
}
```

#### `ReliabilityIssue`
```typescript
interface ReliabilityIssue {
  type: string;                  // Issue type identifier
  severity: 'blocker' | 'critical' | 'major' | 'minor';
  line: number;                  // Line number
  description: string;           // Issue description
  suggestion?: string;           // Fix suggestion
}
```

### Analysis Results

#### `AnalysisResult`
```typescript
interface AnalysisResult {
  reliability: ScoreData;         // Reliability analysis
  maintainability: ScoreData;     // Maintainability analysis
  cyclomaticComplexity: ScoreData; // Complexity analysis
  metrics: MetricsResult;         // Raw metrics
  summary: AnalysisSummary;       // Executive summary
  overallGrade: ScoreGrade;       // Final grade
}
```

#### `EnhancedQualityResult`
```typescript
interface EnhancedQualityResult {
  metrics: {
    cyclomaticComplexity: ScoreData;
    maintainability: ScoreData;
    reliability: ScoreData;
  };
  violations: ViolationAnalysisResult;
  violationsReport: string;       // Formatted report
  overallGrade: ScoreGrade;
  summary: EnhancedSummary;
}
```

## Configuration APIs

### Threshold Configuration

#### `SONARQUBE_GRADE_THRESHOLDS`
```typescript
const SONARQUBE_GRADE_THRESHOLDS = {
  A: { blocker: 0, critical: 0, major: 0, minor: 5 },
  B: { blocker: 0, critical: 0, major: 2, minor: 10 },
  C: { blocker: 0, critical: 1, major: 5, minor: 20 },
  D: { blocker: 1, critical: 2, major: 10, minor: 50 }
} as const;
```

#### `scoreThresholds`
```typescript
const scoreThresholds = {
  maintainability: { A: 85, B: 70, C: 55, D: 0 },
  cyclomaticComplexity: { A: 10, B: 15, C: 20, D: 21 },
  reliability: { A: 90, B: 75, C: 50, D: 0 }
};
```

## Error Handling

### Error Types
```typescript
enum AnalysisError {
  INVALID_INPUT = 'INVALID_INPUT',
  UNSUPPORTED_LANGUAGE = 'UNSUPPORTED_LANGUAGE',
  PARSING_FAILED = 'PARSING_FAILED',
  ANALYSIS_TIMEOUT = 'ANALYSIS_TIMEOUT'
}
```

### Error Response Format
```typescript
interface ErrorResponse {
  error: AnalysisError;
  message: string;
  details?: any;
  suggestions?: string[];
}
```

## Usage Examples

### Complete Analysis Workflow
```typescript
import { 
  analyzeCode, 
  getEnhancedCodeQualityAnalysis,
  formatViolationsReport 
} from '@/utils/quality';

async function performCompleteAnalysis(code: string, language: string) {
  try {
    // Basic analysis
    const basicResult = await analyzeCode(code, language);
    
    // Enhanced analysis
    const enhancedResult = getEnhancedCodeQualityAnalysis(code, language);
    
    // Generate reports
    const violationsReport = formatViolationsReport(enhancedResult.violations);
    
    return {
      basic: basicResult,
      enhanced: enhancedResult,
      reports: {
        violations: violationsReport
      }
    };
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}
```

### Custom Analysis Configuration
```typescript
import { TechnicalDebtCalculator } from '@/utils/quality/technicalDebtCalculator';
import { scoreThresholds } from '@/utils/quality';

function analyzeWithCustomThresholds(code: string, language: string) {
  // Custom thresholds for stricter analysis
  const customThresholds = {
    ...scoreThresholds,
    maintainability: { A: 90, B: 80, C: 70, D: 0 }
  };
  
  const calculator = new TechnicalDebtCalculator(code, language, code.split('\n').length);
  const debt = calculator.calculateTechnicalDebt();
  
  return {
    debt,
    customGrade: getGradeFromScore(debt.debtRatio, customThresholds.maintainability)
  };
}
```

## Performance Considerations

### Recommended Usage Patterns
- **Batch Processing**: Use Promise.all for multiple analyses
- **Caching**: Cache results for identical code inputs
- **Streaming**: Use generator functions for large codebases
- **Memory Management**: Clear large analysis results when done

### Performance Metrics
- **Small files** (<1000 LOC): <500ms
- **Medium files** (1000-5000 LOC): <2000ms
- **Large files** (>5000 LOC): <5000ms

---

**Last Updated**: 2025-06-09  
**Version**: 2.0.0 (Enhanced API Reference)
