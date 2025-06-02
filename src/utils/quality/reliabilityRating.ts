
import { ReliabilityIssue, ScoreGrade } from '@/types';
import { ScoreData } from './types';
import {
  scoreThresholds,
  needsReliabilityWarningFlag,
  ANALYSIS_CONSTANTS
} from './scoreThresholds';
import {
  groupSimilarIssues,
  generateReliabilityImprovements,
  getEffectiveSeverity,
  calculateGroupDeduction
} from './reliabilityHelpers';
import {
  calculateGradeFromScore,
  detectCriticalPattern
} from './scoringUtils';

/** Enhanced reliability scoring function with aggressive critical issue handling */
export function calculateReliabilityScore(
  issues?: ReliabilityIssue[]
): { score: number; letter: ScoreGrade } {
  if (!issues || issues.length === 0) {
    console.log('✅ No issues found, returning perfect score');
    return { score: 100, letter: 'A' };
  }

  console.log('\n🔍 === RELIABILITY SCORE AUDIT STARTED ===');
  console.log(`Input: ${issues.length} issues`);
  issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. [${issue.type}] ${issue.description.substring(0, 60)}...`);
  });

  // Enhanced issue grouping
  const groups = groupSimilarIssues(issues);
  console.log(`\n📊 Grouped into ${groups.length} groups`);

  let totalDeduction = 0;
  let criticalIssueCount = 0;
  let majorIssueCount = 0;
  let crashRiskCount = 0;
  let highestSeverityFound = 'minor';

  // Process each group with detailed tracking
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (!group.issues || group.issues.length === 0) continue;

    const issue = group.issues[0];
    const originalSeverity = issue.type;
    const effectiveSeverity = getEffectiveSeverity(issue);
    
    console.log(`\n🔍 Group ${i + 1}/${groups.length}:`);
    console.log(`  Issue: "${issue.description.substring(0, 80)}..."`);
    console.log(`  Original: ${originalSeverity} -> Effective: ${effectiveSeverity}`);
    console.log(`  Group size: ${group.issues.length}`);

    // Track severity statistics
    if (effectiveSeverity === 'critical') {
      criticalIssueCount++;
      highestSeverityFound = 'critical';
      
      // Enhanced crash risk detection
      const hasCrashPattern = detectCriticalPattern(issue.description, issue.codeContext || '');
      if (hasCrashPattern) {
        crashRiskCount++;
        console.log('💥 CRASH RISK PATTERN CONFIRMED');
      }
    } else if (effectiveSeverity === 'major') {
      majorIssueCount++;
      if (highestSeverityFound !== 'critical') highestSeverityFound = 'major';
    }

    // Calculate deduction for this group
    const deduction = calculateGroupDeduction(group, effectiveSeverity);
    console.log(`  Deduction: ${deduction.toFixed(2)} points`);
    
    totalDeduction += deduction;
  }

  console.log(`\n📈 SCORING SUMMARY:`);
  console.log(`  Total base deduction: ${totalDeduction.toFixed(2)}`);
  console.log(`  Critical issues: ${criticalIssueCount}`);
  console.log(`  Major issues: ${majorIssueCount}`);
  console.log(`  Crash risks: ${crashRiskCount}`);
  console.log(`  Highest severity: ${highestSeverityFound}`);

  // Enhanced score calculation with aggressive critical handling
  let rawScore = 100 - totalDeduction;
  let finalScore = rawScore;
  let forcedGrade: ScoreGrade | null = null;
  let forceReason = '';

  // Aggressive forced degradation for critical issues
  if (crashRiskCount >= 2) {
    forcedGrade = 'D';
    finalScore = Math.min(finalScore, 25); // Very low score for multiple crashes
    forceReason = `Multiple crash risks detected (${crashRiskCount})`;
  } else if (crashRiskCount >= 1) {
    forcedGrade = 'D';
    finalScore = Math.min(finalScore, 35); // Low score for single crash risk
    forceReason = `Crash risk detected (${crashRiskCount})`;
  } else if (criticalIssueCount >= 3) {
    forcedGrade = 'D';
    finalScore = Math.min(finalScore, 30);
    forceReason = `Multiple critical issues (${criticalIssueCount})`;
  } else if (criticalIssueCount >= 2) {
    forcedGrade = 'C';
    finalScore = Math.min(finalScore, 45);
    forceReason = `Multiple critical issues (${criticalIssueCount})`;
  } else if (criticalIssueCount >= 1) {
    forcedGrade = 'C';
    finalScore = Math.min(finalScore, 55);
    forceReason = `Critical issue detected (${criticalIssueCount})`;
  } else if (majorIssueCount >= 5) {
    forcedGrade = 'C';
    finalScore = Math.min(finalScore, 60);
    forceReason = `Many major issues (${majorIssueCount})`;
  }

  // Apply absolute minimum score
  finalScore = Math.max(ANALYSIS_CONSTANTS.RELIABILITY.MINIMUM_SCORE, finalScore);

  // Calculate final grade
  const calculatedGrade = calculateGradeFromScore(finalScore, scoreThresholds.reliability);
  const finalGrade = forcedGrade || calculatedGrade;

  console.log(`\n🎯 FINAL RESULTS:`);
  console.log(`  Raw score: ${rawScore.toFixed(2)}`);
  console.log(`  Final score: ${finalScore.toFixed(2)}`);
  console.log(`  Calculated grade: ${calculatedGrade}`);
  console.log(`  Final grade: ${finalGrade}`);
  if (forcedGrade) {
    console.log(`  🚨 FORCED DEGRADATION: ${forceReason}`);
  }
  console.log('=== RELIABILITY SCORE AUDIT COMPLETED ===\n');

  return { score: finalScore, letter: finalGrade };
}

/** Enhanced reliability rating generator with comprehensive critical handling */
export function getReliabilityRating(score: number, issues?: ReliabilityIssue[]): ScoreData {
  console.log(`\n🎯 Getting reliability rating for score: ${score}`);
  
  // Always use calculated score for accuracy
  const calculated = calculateReliabilityScore(issues);
  const finalScore = calculated.score;
  const rating = calculated.letter;

  console.log(`📊 Using calculated values: ${rating} (${finalScore.toFixed(1)})`);

  // Enhanced messaging for critical cases
  if (rating === 'D') {
    const criticalCount = issues?.filter(i => getEffectiveSeverity(i) === 'critical').length || 0;
    const crashRisks = issues?.filter(i => 
      detectCriticalPattern(i.description, i.codeContext || '')
    ).length || 0;

    return {
      score: 'D',
      description: '🚨 Critical reliability failure',
      reason: crashRisks > 0 
        ? `Code contains ${crashRisks} crash-prone pattern(s) and ${criticalCount} critical issue(s) that pose immediate reliability risks.`
        : `Code contains ${criticalCount} critical issue(s) that significantly compromise system reliability and stability.`,
      issues: issues?.map(i => i.description).filter(Boolean) ?? [],
      improvements: generateReliabilityImprovements(groupSimilarIssues(issues ?? [])),
      warningFlag: true
    };
  }

  if (rating === 'C') {
    const criticalCount = issues?.filter(i => getEffectiveSeverity(i) === 'critical').length || 0;
    return {
      score: 'C',
      description: '⚠️ Serious reliability concerns',
      reason: `Code contains ${criticalCount} critical issue(s) and other reliability problems that require immediate attention to prevent potential failures.`,
      issues: issues?.map(i => i.description).filter(Boolean) ?? [],
      improvements: generateReliabilityImprovements(groupSimilarIssues(issues ?? [])),
      warningFlag: true
    };
  }

  // Handle edge cases
  if (!isFinite(finalScore)) {
    return {
      score: 'C',
      description: 'Unable to determine reliability',
      reason: 'Reliability analysis failed due to invalid data.',
      issues: ['Invalid reliability score calculated'],
      improvements: ['Review code analysis inputs and try again'],
      warningFlag: false
    };
  }

  // Standard grading for A and B scores
  const warningFlag = needsReliabilityWarningFlag(
    rating,
    issues?.map(issue => ({
      type: issue?.type || 'minor',
      impact: issue?.impact || 1
    })) ?? []
  );

  const { description, reason } = generateReliabilityDescription(rating, warningFlag, finalScore);
  
  const issuesList = issues?.length ? 
    groupSimilarIssues(issues)
      .slice(0, 5) // Limit to top 5 issue groups
      .flatMap(group => group.issues.slice(0, 1).map(issue => issue.description))
      .filter(Boolean) :
    getDefaultIssuesList(rating);

  const improvements = issues?.length ?
    generateReliabilityImprovements(groupSimilarIssues(issues)) :
    getDefaultImprovementsList(rating);

  return {
    score: rating,
    description,
    reason,
    issues: issuesList,
    improvements,
    warningFlag
  };
}

// Description generator based on final grade
function generateReliabilityDescription(
  rating: ScoreGrade,
  warningFlag: boolean,
  score: number
): { description: string; reason: string } {
  let description = '';
  let reason = '';

  switch (rating) {
    case 'A':
      description = warningFlag ? 'Reliable with minor concerns' : 'Highly reliable';
      reason = warningFlag
        ? 'The code is reliable with a few minor issues that could be improved.'
        : 'The code properly handles edge cases and potential error conditions.';
      break;
    case 'B':
      description = warningFlag ? 'Good reliability with some risks' : 'Good reliability';
      reason = warningFlag
        ? 'The code is generally reliable but has some potential weak points.'
        : 'The code handles most error scenarios with good practices.';
      break;
    case 'C':
      description = 'Moderate reliability';
      reason = 'The code has areas where reliability could be improved.';
      break;
    default:
      description = 'Reliability concerns';
      reason = 'The code has significant reliability issues that should be addressed.';
  }

  description += ` (${score.toFixed(1)})`;
  if (warningFlag) description += ' ⚠️';

  return { description, reason };
}

function getDefaultIssuesList(rating: ScoreGrade): string[] {
  switch (rating) {
    case 'A':
      return [];
    case 'B':
      return ['Consider adding additional error handling for edge cases.'];
    case 'C':
      return [
        'Some potential failure points may need more robust handling',
        'Consider additional validation for key operations'
      ];
    default:
      return [
        'Several error paths lack proper handling',
        'Critical operations need validation',
        'Consider adding exception handling'
      ];
  }
}

function getDefaultImprovementsList(rating: ScoreGrade): string[] {
  switch (rating) {
    case 'A':
      return ['Maintain robust error handling practices.'];
    case 'B':
      return ['Consider adding validation for edge cases', 'Document error handling approach.'];
    case 'C':
      return [
        'Add try-catch blocks for risky operations',
        'Improve input validation',
        'Add unit tests to cover error scenarios'
      ];
    default:
      return [
        'Refactor critical code paths to ensure exception safety',
        'Add comprehensive logging for failures',
        'Review code for null pointer and division risks'
      ];
  }
}
