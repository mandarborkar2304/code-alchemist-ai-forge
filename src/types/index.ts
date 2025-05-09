
export interface CodeQualityRating {
  score: 'A' | 'B' | 'C' | 'D';
  description: string;
  reason?: string;
  issues?: string[] | ReliabilityIssue[]; // Updated to allow ReliabilityIssue[] type
  improvements?: string[];
}

export interface CodeViolations {
  major: number;
  minor: number;
  details: string[];
  lineReferences?: { line: number; issue: string; severity: 'major' | 'minor' }[]; // References to specific lines with severity
  categories?: { 
    category: string;
    violations: { issue: string; severity: 'major' | 'minor'; impact: number }[];
  }[];
}

export interface CodeAnalysis {
  cyclomaticComplexity: CodeQualityRating;
  maintainability: CodeQualityRating;
  reliability: CodeQualityRating;
  violations: CodeViolations;
  aiSuggestions: string;
  correctedCode?: string;
  overallGrade?: 'A' | 'B' | 'C' | 'D'; // Overall code quality grade
  metrics?: MetricsResult;
  testCases: TestCase[]; // Added TestCase array to the CodeAnalysis interface
}

export interface ProgrammingLanguage {
  id: string;
  name: string;
  fileExtension: string;
  icon?: React.ReactNode;
}

export interface TestCase {
  name?: string;
  description?: string;
  input: string;
  expectedOutput: string;
  passed?: boolean;
  actualOutput?: string;
  executionDetails?: string;
}

// Add the missing types that are imported in codeMetrics.ts
export type ScoreGrade = 'A' | 'B' | 'C' | 'D';

export interface MetricsResult {
  linesOfCode: number;  
  codeLines: number;
  commentLines: number;
  commentPercentage: number;
  functionCount: number;  
  averageFunctionLength: number;
  maxNestingDepth: number;
  cyclomaticComplexity: number;
}

// New interface for reliability issues
export interface ReliabilityIssue {
  type: 'critical' | 'major' | 'minor';
  description: string;
  impact: number;
  category: 'runtime' | 'exception' | 'structure' | 'readability';
  line?: number;
}
