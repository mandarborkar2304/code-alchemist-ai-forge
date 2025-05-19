import { ReliabilityIssue, ScoreGrade } from '@/types';

export type SeverityLevel = 'critical' | 'major' | 'minor' | 'varies';
export type CategoryName =
  | 'Bugs - Critical'
  | 'Bugs - Exception Handling'
  | 'Code Smells - Structure'
  | 'Code Smells - Maintainability';

export interface ScoreData {
  score: ScoreGrade;
  description: string;
  reason: string;
  issues?: string[] | ReliabilityIssue[]; // Consider splitting this into separate fields for clarity
  improvements?: string[];
  warningFlag?: boolean; // Indicates potential scoring inconsistencies
}

export interface IssueGroup {
  key: string;
  issues: ReliabilityIssue[];
}

export interface CategoryWithIssues {
  name: CategoryName;
  issues: ReliabilityIssue[];
  severity: SeverityLevel;
}
