
import { ReliabilityIssue, ScoreGrade } from '@/types';

export type SeverityLevel = 'critical' | 'major' | 'minor' | 'varies';
export type CategoryName =
  | 'Bugs - Critical'
  | 'Bugs - Exception Handling'
  | 'Code Smells - Structure'
  | 'Code Smells - Maintainability';

export interface TechnicalDebtInfo {
  totalMinutes: number;
  debtRatio: number;
  codeSmells: number;
  issues: any[];
}

export interface ScoreData {
  score: ScoreGrade;
  description: string;
  reason: string;
  issues?: string[] | ReliabilityIssue[];
  improvements?: string[];
  warningFlag?: boolean;
  technicalDebt?: TechnicalDebtInfo;
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
