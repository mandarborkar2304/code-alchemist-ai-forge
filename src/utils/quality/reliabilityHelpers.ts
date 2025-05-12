import { ReliabilityIssue } from '@/types';
import { IssueGroup, CategoryWithIssues } from './types';
import { issueSeverityWeights, ANALYSIS_CONSTANTS } from './scoreThresholds';

function normalizeString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\b(line|at|on)\s+\d+\b/g, '');
}

export function groupSimilarIssues(issues: ReliabilityIssue[]): IssueGroup[] {
  if (!Array.isArray(issues)) {
    console.warn('Invalid issues array provided to groupSimilarIssues');
    return [];
  }
  const groups: IssueGroup[] = [];
  issues.forEach(issue => {
    if (!issue) return;
    const normalizedDescription = normalizeString(issue.description);
    const category = issue.category || 'unknown';
    const groupKey = `${category}_${normalizedDescription}`;
    const existingGroup = groups.find(group => group.key === groupKey);
    if (existingGroup) {
      existingGroup.issues.push(issue);
    } else {
      groups.push({ key: groupKey, issues: [issue] });
    }
  });
  return groups;
}

export function getContextReductionFactor(issues: ReliabilityIssue[]): number {
  if (!Array.isArray(issues) || issues.length === 0) return 1.0;
  let factor = 1.0;
  const firstIssue = issues[0];
  if (!firstIssue) return factor;
  const desc = normalizeString(firstIssue.description);

  if (desc.includes('test') || (firstIssue.codeContext && firstIssue.codeContext.includes('test')))
    factor *= ANALYSIS_CONSTANTS.FACTORS.TEST_CODE;
  if (desc.includes('catch') || desc.includes('try') ||
    (firstIssue.codeContext && (firstIssue.codeContext.includes('catch') || firstIssue.codeContext.includes('try'))))
    factor *= ANALYSIS_CONSTANTS.FACTORS.ERROR_HANDLING;
  if (desc.includes('helper') || desc.includes('util') ||
    (firstIssue.codeContext && (firstIssue.codeContext.includes('helper') || firstIssue.codeContext.includes('util'))))
    factor *= ANALYSIS_CONSTANTS.FACTORS.UTILITY_CODE;
  if (issues.length > 1)
    factor *= ANALYSIS_CONSTANTS.FACTORS.REPEATED_ISSUES;

  return factor;
}

export function evaluatePatternRisk(issuePattern: string, codeContext: string): boolean {
  if (!issuePattern || !codeContext) return false;

  if (issuePattern.includes('null-unsafe') || issuePattern.includes('undefined')) {
    if (codeContext.trim().startsWith('import') || codeContext.trim().match(/^(\/\/|\/*|\*)/)) return false;
    if (codeContext.trim().match(/^(const|let|var)\s+\w+\s*=/)) return false;
    if (codeContext.trim().match(/^\s*\w+\s*:/)) return false;
    const hasNullDereference = codeContext.match(/(\w+)\.\w+/) &&
      !codeContext.includes('?.') && !codeContext.includes('??') &&
      !codeContext.includes('!==') && !codeContext.includes('!=') &&
      !codeContext.includes('if (') && !codeContext.includes('typeof');
    return Boolean(hasNullDereference);
  }

  if (issuePattern.includes('division') || issuePattern.includes('divide')) {
    const hasDivisionOp = codeContext.match(/\/\s*(\w+|\d+)/);
    if (!hasDivisionOp) return false;
    const divisorMatch = codeContext.match(/\/\s*(\w+)/);
    if (!divisorMatch) {
      const literalMatch = codeContext.match(/\/\s*(\d+)/);
      if (literalMatch && literalMatch[1] !== '0') return false;
      return literalMatch && literalMatch[1] === '0';
    }
    const divisor = divisorMatch[1];
    const hasValidation = codeContext.includes(`${divisor} !== 0`) ||
      codeContext.includes(`${divisor} != 0`) ||
      codeContext.includes(`${divisor} > 0`) ||
      codeContext.includes(`if (${divisor})`) ||
      codeContext.includes('try') ||
      codeContext.includes('catch');
    return !hasValidation;
  }

  if (issuePattern.includes('array') || issuePattern.includes('bounds')) {
    const hasArrayAccess = codeContext.match(/(\w+)\s*\[\s*(\w+|\d+)\s*\]/);
    if (!hasArrayAccess) return false;
    const array = hasArrayAccess[1];
    const index = hasArrayAccess[2];
    if (index.match(/^\d+$/) && parseInt(index) < 1000) return false;
    const hasBoundsCheck = codeContext.includes(`${index} < ${array}.length`) ||
      codeContext.includes(`${array}.length > ${index}`) ||
      codeContext.includes(`${index} >= 0`) ||
      codeContext.match(new RegExp(`for.*${index}.*${array}\.length`)) ||
      codeContext.includes('try') ||
      codeContext.includes('catch');
    const isLoopVariable = codeContext.match(new RegExp(`for.*${index}\s*=.*${index}\+\+`));
    return !hasBoundsCheck && !isLoopVariable;
  }

  if (issuePattern.includes('input') || issuePattern.includes('validation')) {
    const hasUserInput = codeContext.includes('input') || codeContext.includes('param') || codeContext.includes('arg');
    if (!hasUserInput) return false;
    const hasRiskyOps = codeContext.includes('.parse') || codeContext.includes('JSON') || codeContext.match(/\[\s*\w+\s*\]/) || codeContext.includes('/');
    if (!hasRiskyOps) return false;
    const hasValidation = codeContext.includes('if') || codeContext.includes('typeof') || codeContext.includes('instanceof') || codeContext.includes('===') || codeContext.includes('!==') || codeContext.includes('try');
    return hasRiskyOps && !hasValidation;
  }

  return true;
}

export function determinePathSensitivity(issues: ReliabilityIssue[]): number {
  if (!Array.isArray(issues) || issues.length === 0) return 1.0;
  let pathFactor = 1.0;
  const firstIssue = issues[0];
  if (!firstIssue) return pathFactor;
  const desc = normalizeString(firstIssue.description);
  const codeContext = firstIssue.codeContext || '';

  if (codeContext) {
    const hasBranchingConditions = codeContext.includes('if (') || codeContext.includes('else ') || codeContext.includes('switch(');
    const hasTypeGuards = codeContext.includes('typeof ') || codeContext.includes('instanceof ') || codeContext.match(/!=\s*null/) || codeContext.match(/!==\s*null/);
    const hasTryCatch = codeContext.includes('try') && codeContext.includes('catch');
    if (hasTryCatch) pathFactor *= 0.4;
    else if (hasBranchingConditions || hasTypeGuards) pathFactor *= ANALYSIS_CONSTANTS.FACTORS.GUARDED_PATH;
  } else {
    if (desc.includes('exception path') || desc.includes('rare condition')) pathFactor *= ANALYSIS_CONSTANTS.FACTORS.RARE_PATH;
    if (desc.includes('edge case') || desc.includes('boundary condition')) pathFactor *= ANALYSIS_CONSTANTS.FACTORS.EDGE_CASE;
    if (desc.includes('validated') || desc.includes('checked')) pathFactor *= ANALYSIS_CONSTANTS.FACTORS.VALIDATED_CODE;
  }

  return pathFactor;
}

function generateImprovementsByIssueType(groups: IssueGroup[], category: string): string[] {
  const improvements: string[] = [];
  const filteredGroups = groups.filter(g => g.issues[0]?.category === category);
  if (filteredGroups.length === 0) return improvements;
  switch (category) {
    case 'runtime':
      improvements.push('Add strict validation and crash-prone operation checks');
      break;
    case 'exception':
      improvements.push('Use structured exception handling consistently');
      break;
    case 'structure':
      improvements.push('Flatten deep nesting and refactor control flows');
      break;
    case 'readability':
      improvements.push('Improve clarity and reduce redundant logic');
      break;
  }
  return improvements;
}

export function generateReliabilityImprovements(groupedIssues: IssueGroup[]): string[] {
  if (!Array.isArray(groupedIssues) || groupedIssues.length === 0) return [];
  const improvements: string[] = [];
  const categories = ['runtime', 'exception', 'structure', 'readability'];
  categories.forEach(category => {
    improvements.push(...generateImprovementsByIssueType(groupedIssues, category));
  });
  return improvements.length > 0 ? improvements : ['Improve validation and control flow robustness'];
}

function getSeverityLevel(issue: ReliabilityIssue): string {
  if (!issue) return 'minor';
  return issue.type || 'minor';
}

export function categorizeReliabilityIssues(issues: ReliabilityIssue[]): CategoryWithIssues[] {
  if (!Array.isArray(issues) || issues.length === 0) return [];
  return [
    {
      name: 'Bugs - Critical',
      issues: issues.filter(i => i?.category === 'runtime' && i?.type === 'critical'),
      severity: 'critical'
    },
    {
      name: 'Bugs - Exception Handling',
      issues: issues.filter(i => i?.category === 'exception'),
      severity: 'major'
    },
    {
      name: 'Code Smells - Structure',
      issues: issues.filter(i => i?.category === 'structure'),
      severity: i => getSeverityLevel(i)
    },
    {
      name: 'Code Smells - Maintainability',
      issues: issues.filter(i => i?.category === 'readability'),
      severity: 'minor'
    }
  ].filter(category => category.issues.length > 0);
}
