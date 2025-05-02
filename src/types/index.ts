
export interface CodeQualityRating {
  score: 'A' | 'B' | 'C' | 'D';
  description: string;
  reason?: string;
  issues?: string[]; // Specific issues found
  improvements?: string[]; // Suggested improvements
}

export interface CodeViolations {
  major: number;
  minor: number;
  details: string[];
  lineReferences?: { line: number; issue: string }[]; // References to specific lines
}

export interface CodeAnalysis {
  cyclomaticComplexity: CodeQualityRating;
  maintainability: CodeQualityRating;
  reliability: CodeQualityRating;
  violations: CodeViolations;
  aiSuggestions: string;
  correctedCode?: string;
  overallGrade?: 'A' | 'B' | 'C' | 'D'; // Overall code quality grade
  metrics?: {
    linesOfCode: number;
    commentPercentage: number;
    functionCount: number;
    averageFunctionLength: number;
  };
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
