// Main Code Quality Rating
export interface CodeQualityRating {
  score: 'A' | 'B' | 'C' | 'D';
  description: string;
  reason?: string;
  issues?: string[] | ReliabilityIssue[];
}

// Violations structure
export interface CodeViolations {
  major: number;
  minor: number;
  details: string[];
  lineReferences?: {
    line: number;
    issue: string;
    severity: 'major' | 'minor';
  }[];
  categories?: {
    category: string;
    violations: {
      issue: string;
      severity: 'major' | 'minor';
      impact: number;
    }[];
  }[];
}

// Complete Code Analysis type
import { ComplexityAnalysis, CodeSmellsAnalysis } from './complexityTypes';

export interface CodeAnalysis {
  originalCode: string;
  cyclomaticComplexity: CodeQualityRating;
  maintainability: CodeQualityRating;
  reliability: CodeQualityRating;
  violations: CodeViolations;
  aiSuggestions: string;
  correctedCode?: string;
  overallGrade?: 'A' | 'B' | 'C' | 'D';
  metrics?: MetricsResult;
  testCases: TestCase[];
  complexityAnalysis?: ComplexityAnalysis;
  codeSmells?: CodeSmellsAnalysis;
  improvements: Improvement[];
}

// Supported languages
export interface ProgrammingLanguage {
  id: string;
  name: string;
  fileExtension: string;
  icon?: React.ReactNode;
}

// Test case result type
export interface TestCase {
  name?: string;
  description?: string;
  input: string;
  expectedOutput: string;
  passed?: boolean;
  actualOutput?: string;
  executionDetails?: string;
}

// Grades
export type ScoreGrade = 'A' | 'B' | 'C' | 'D';

// Metrics structure
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

// Reliability issue structure
export interface ReliabilityIssue {
  type: 'critical' | 'major' | 'minor';
  description: string;
  impact: number;
  category: 'runtime' | 'exception' | 'structure' | 'readability';
  line?: number;
  codeContext?: string;
  pattern?: string;
}

// For sending code to AI correction API
export interface AIImprovementRequest {
  code: string;
  language: string;
}

// Improvements for AI recommendations
export interface Improvement {
  type: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
}

export * from './complexityTypes';