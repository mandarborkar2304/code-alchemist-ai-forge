
import { ScoreData } from './types';
import { ScoreGrade } from '@/types';

// SonarQube-aligned Cyclomatic Complexity thresholds
const SONARQUBE_COMPLEXITY_THRESHOLDS = {
  A: { min: 1, max: 10 },   // 1-10: Simple methods, easy to understand
  B: { min: 11, max: 15 },  // 11-15: Moderate complexity, acceptable
  C: { min: 16, max: 20 },  // 16-20: High complexity, should be refactored
  D: { min: 21, max: Infinity } // 21+: Very high complexity, critical refactoring needed
} as const;

// SonarQube complexity analysis constants
const SONARQUBE_ANALYSIS_CONSTANTS = {
  NESTING_DEPTH: {
    LOW: 3,
    MODERATE: 5,
    HIGH: 7
  },
  DECISION_POINTS: {
    SIMPLE: 5,
    MODERATE: 10,
    COMPLEX: 15
  }
} as const;

// Get SonarQube-aligned grade from complexity score
function getSonarQubeComplexityGrade(score: number): ScoreGrade {
  if (score <= SONARQUBE_COMPLEXITY_THRESHOLDS.A.max) return 'A';
  if (score <= SONARQUBE_COMPLEXITY_THRESHOLDS.B.max) return 'B';
  if (score <= SONARQUBE_COMPLEXITY_THRESHOLDS.C.max) return 'C';
  return 'D';
}

// Estimate decision points based on complexity score (SonarQube methodology)
function estimateDecisionPoints(score: number): number {
  // SonarQube complexity includes base complexity of 1, so subtract 1 for decision points
  return Math.max(0, score - 1);
}

// Estimate nesting depth impact (SonarQube considers cognitive complexity)
function estimateNestingImpact(score: number): number {
  if (score <= 10) return 1; // Minimal nesting
  if (score <= 15) return 2; // Moderate nesting
  if (score <= 20) return 3; // High nesting
  return 4; // Very high nesting
}

// Generate SonarQube-style analysis description
function generateSonarQubeDescription(
  score: number, 
  grade: ScoreGrade
): {
  description: string;
  reason: string;
  issues: string[];
  improvements: string[];
} {
  const decisionPoints = estimateDecisionPoints(score);
  const nestingImpact = estimateNestingImpact(score);
  
  let description: string;
  let reason: string;
  let issues: string[] = [];
  let improvements: string[] = [];

  switch (grade) {
    case 'A':
      description = `Low complexity (CC: ${score})`;
      reason = `This method has ${decisionPoints} decision point${decisionPoints !== 1 ? 's' : ''}, which is within the acceptable range for maintainable code.`;
      
      if (score === 1) {
        issues = ['Linear code with no branching - excellent maintainability'];
      } else {
        issues = [`${decisionPoints} decision point${decisionPoints !== 1 ? 's' : ''} detected - well within acceptable limits`];
      }
      
      improvements = [
        'Maintain current code structure',
        'Consider adding comments for complex business logic'
      ];
      break;

    case 'B':
      description = `Moderate complexity (CC: ${score})`;
      reason = `This method has ${decisionPoints} decision points. While acceptable, it's approaching the threshold where maintainability concerns arise.`;
      
      issues = [
        `${decisionPoints} decision points detected`,
        `Complexity score of ${score} is in the moderate range`
      ];
      
      if (nestingImpact > 2) {
        issues.push('Moderate nesting depth detected');
      }
      
      improvements = [
        'Consider breaking down into smaller methods',
        'Extract complex conditions into well-named variables',
        'Add comprehensive unit tests to cover all branches'
      ];
      break;

    case 'C':
      description = `High complexity (CC: ${score})`;
      reason = `This method has ${decisionPoints} decision points, indicating high complexity that impacts maintainability and testability.`;
      
      issues = [
        `${decisionPoints} decision points detected - above recommended threshold`,
        `High complexity score of ${score} indicates difficult maintenance`,
        'Increased risk of bugs due to complex control flow'
      ];
      
      if (nestingImpact > 2) {
        issues.push(`Estimated ${nestingImpact} levels of nesting depth`);
      }
      
      improvements = [
        'Refactor into multiple smaller methods',
        'Use early returns to reduce nesting',
        'Apply the Single Responsibility Principle',
        'Consider using strategy pattern for complex conditionals',
        'Increase test coverage to ensure all paths are verified'
      ];
      break;

    default: // Grade D
      description = `Very high complexity (CC: ${score})`;
      reason = `This method has ${decisionPoints} decision points, representing very high complexity that severely impacts code maintainability, readability, and reliability.`;
      
      issues = [
        `Excessive ${decisionPoints} decision points - critical refactoring needed`,
        `Critical complexity score of ${score} indicates maintenance nightmare`,
        'High probability of bugs and regressions',
        'Difficult to test comprehensively',
        'Poor readability and understanding'
      ];
      
      if (nestingImpact > 3) {
        issues.push(`Excessive nesting depth estimated at ${nestingImpact} levels`);
      }
      
      improvements = [
        'CRITICAL: Immediate refactoring required',
        'Break down into multiple small, focused methods',
        'Apply Extract Method refactoring pattern',
        'Consider redesigning the algorithm or approach',
        'Implement comprehensive unit tests before refactoring',
        'Use guard clauses to reduce nesting',
        'Consider state machine pattern for complex state logic'
      ];
  }

  return { description, reason, issues, improvements };
}

// Main function implementing SonarQube-aligned cyclomatic complexity analysis
export function getCyclomaticComplexityRating(score: number): ScoreData {
  // Validate input score
  if (score === undefined || score === null || !isFinite(score) || score < 1) {
    console.warn('Invalid complexity score provided:', score);
    return {
      score: 'D',
      description: 'Invalid complexity measurement',
      reason: 'Unable to calculate complexity due to invalid input. SonarQube requires a minimum complexity of 1.',
      issues: ['Invalid complexity score - unable to analyze'],
      improvements: ['Ensure valid code input for complexity analysis']
    };
  }

  // Ensure minimum complexity of 1 (SonarQube baseline)
  const validatedScore = Math.max(1, Math.round(score));
  
  // Get SonarQube-aligned grade
  const grade = getSonarQubeComplexityGrade(validatedScore);
  
  // Generate detailed analysis
  const analysis = generateSonarQubeDescription(validatedScore, grade);
  
  // Add SonarQube compliance note
  const complianceNote = `SonarQube Complexity Analysis: Score ${validatedScore} maps to Grade ${grade}`;
  analysis.issues.unshift(complianceNote);
  
  return {
    score: grade,
    description: analysis.description,
    reason: analysis.reason,
    issues: analysis.issues,
    improvements: analysis.improvements
  };
}

// Export SonarQube thresholds for external validation
export const SONARQUBE_THRESHOLDS = SONARQUBE_COMPLEXITY_THRESHOLDS;
