
import { ReliabilityIssue, ScoreGrade } from '@/types';

export interface ScoreData {
  score: ScoreGrade;
  description: string;
  reason: string;
  issues?: string[] | ReliabilityIssue[];
  improvements?: string[];
}

export interface IssueGroup {
  key: string;
  issues: ReliabilityIssue[];
}

export interface CategoryWithIssues {
  name: string;
  issues: ReliabilityIssue[];
  severity: string | ((issue: ReliabilityIssue) => string);
}
