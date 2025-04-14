
export interface TestCase {
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
}

export interface CodeAnalysis {
  feasibility: {
    score: number;
    issues: string[];
  };
  testCases: TestCase[];
  codeQuality: {
    readability: number;
    structure: number;
    naming: number;
    efficiency: number;
    overall: number;
  };
  robustness: number;
  aiSuggestions: string;
  correctedCode?: string;
}

export interface ProgrammingLanguage {
  id: string;
  name: string;
  fileExtension: string;
  icon?: React.ReactNode;
}
