
export interface TestCase {
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
}

export interface CodeQualityRating {
  score: 'A' | 'B' | 'C' | 'D';
  description: string;
  reason?: string;
}

export interface CodeViolations {
  major: number;
  minor: number;
  details: string[];
}

export interface CodeAnalysis {
  cyclomaticComplexity: CodeQualityRating;
  maintainability: CodeQualityRating;
  reliability: CodeQualityRating;
  violations: CodeViolations;
  testCases: TestCase[];
  aiSuggestions: string;
  correctedCode?: string;
}

export interface ProgrammingLanguage {
  id: string;
  name: string;
  fileExtension: string;
  icon?: React.ReactNode;
}
