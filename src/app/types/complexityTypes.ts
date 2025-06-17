
export type ComplexityGrade = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(n³)' | 'O(2^n)' | 'O(n!)';

export interface ComplexityAnalysis {
  timeComplexity: {
    notation: ComplexityGrade;
    confidence: 'high' | 'medium' | 'low';
    description: string;
    factors: string[];
  };
  spaceComplexity: {
    notation: ComplexityGrade;
    confidence: 'high' | 'medium' | 'low';
    description: string;
    factors: string[];
  };
}

export interface CodeSmell {
  type: 'deep-nesting' | 'long-method' | 'duplicate-code' | 'magic-numbers' | 'unused-variables' | 'large-class' | 'dead-code';
  severity: 'major' | 'minor';
  description: string;
  line?: number;
  suggestion: string;
  impact: string;
}

export interface CodeSmellsAnalysis {
  smells: CodeSmell[];
  totalCount: number;
  majorCount: number;
  minorCount: number;
  categories: {
    [key: string]: CodeSmell[];
  };
}
