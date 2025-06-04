
import { ReliabilityIssue, ScoreGrade } from '@/types';
import { ScoreData } from './types';
import { 
  calculateReliabilityGrade, 
  generateSonarQubeImprovements,
  ReliabilityGradeResult 
} from './sonarQubeReliability';

/**
 * SonarQube-style reliability scoring - replaces legacy weighted deduction system
 */
export function calculateReliabilityScore(
  issues?: ReliabilityIssue[]
): { score: number; letter: ScoreGrade } {
  const result = calculateReliabilityGrade(issues);
  
  // Convert letter grade to numeric score for compatibility
  const scoreMap: Record<ScoreGrade, number> = {
    'A': 95,
    'B': 80,
    'C': 60,
    'D': 30
  };

  return {
    score: scoreMap[result.grade],
    letter: result.grade
  };
}

/**
 * Enhanced reliability rating using SonarQube methodology
 */
export function getReliabilityRating(score: number, issues?: ReliabilityIssue[]): ScoreData {
  console.log(`\n🎯 Getting SonarQube-style reliability rating`);
  
  // Use SonarQube grading system
  const result: ReliabilityGradeResult = calculateReliabilityGrade(issues);
  const improvements = generateSonarQubeImprovements(result);

  console.log(`📊 SonarQube Result: ${result.grade} - ${result.reason}`);

  // Generate detailed description based on SonarQube results
  const description = generateGradeDescription(result);
  const issuesList = generateIssuesList(result);

  return {
    score: result.grade,
    description,
    reason: result.reason,
    issues: issuesList,
    improvements,
    warningFlag: result.grade === 'C' || result.grade === 'D'
  };
}

function generateGradeDescription(result: ReliabilityGradeResult): string {
  const { grade, severityCounts } = result;
  
  switch (grade) {
    case 'A':
      return severityCounts.minor > 0 
        ? `Excellent reliability (${severityCounts.minor} minor issues)`
        : 'Excellent reliability - no issues detected';
        
    case 'B':
      return `Good reliability with minor concerns (${severityCounts.major} major, ${severityCounts.minor} minor)`;
      
    case 'C':
      return `Moderate reliability - requires attention (${severityCounts.critical} critical, ${severityCounts.major} major)`;
      
    case 'D':
      return `Poor reliability - immediate action required (${severityCounts.blocker} blocker, ${severityCounts.critical} critical)`;
      
    default:
      return 'Unknown reliability status';
  }
}

function generateIssuesList(result: ReliabilityGradeResult): string[] {
  const { issues, severityCounts } = result;
  
  if (issues.length === 0) return [];

  const issuesList: string[] = [];
  
  // Add summary by severity
  if (severityCounts.blocker > 0) {
    issuesList.push(`🔥 ${severityCounts.blocker} blocker issue(s) - immediate crash risk`);
  }
  if (severityCounts.critical > 0) {
    issuesList.push(`🚨 ${severityCounts.critical} critical issue(s) - high reliability risk`);
  }
  if (severityCounts.major > 0) {
    issuesList.push(`⚠️ ${severityCounts.major} major issue(s) - moderate reliability concern`);
  }
  if (severityCounts.minor > 0) {
    issuesList.push(`ℹ️ ${severityCounts.minor} minor issue(s) - low priority improvements`);
  }

  // Add top specific issues (limit to 3 most severe)
  const topIssues = issues
    .sort((a, b) => {
      const severityOrder = { blocker: 0, critical: 1, major: 2, minor: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, 3)
    .map(issue => `${getSeverityIcon(issue.severity)} ${issue.description}`);

  issuesList.push(...topIssues);

  return issuesList;
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'blocker': return '🔥';
    case 'critical': return '🚨';
    case 'major': return '⚠️';
    case 'minor': return 'ℹ️';
    default: return '❓';
  }
}
