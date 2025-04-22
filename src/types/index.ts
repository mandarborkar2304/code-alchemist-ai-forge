
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
  lineReferences?: {line: number, issue: string}[]; // References to specific lines
}

export interface CodeAnalysis {
  cyclomaticComplexity: CodeQualityRating;
  maintainability: CodeQualityRating;
  reliability: CodeQualityRating;
  violations: CodeViolations;
  correctedCode?: string;
  overallGrade?: 'A' | 'B' | 'C' | 'D'; // Overall code quality grade
  metrics?: {
    linesOfCode: number;
    commentPercentage: number;
    functionCount: number;
    averageFunctionLength: number;
  };
}

export interface ProgrammingLanguage {
  id: string;
  name: string;
  fileExtension: string;
  icon?: React.ReactNode;
}
