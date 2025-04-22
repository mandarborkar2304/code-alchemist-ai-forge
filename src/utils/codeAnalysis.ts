
import { CodeViolations, TestCase } from '@/types';

// Analyze code for issues with line references
export const analyzeCodeForIssues = (code: string): { details: string[], lineReferences: {line: number, issue: string}[] } => {
  const issues: string[] = [];
  const lineReferences: {line: number, issue: string}[] = [];
  const lines = code.split('\n');
  
  // Handle extremely simple code - return no issues for simple arithmetic and linear flow
  const hasControlFlow = code.includes('if') || code.includes('for') || code.includes('while');
  if (!hasControlFlow && lines.length < 15) {
    return { details: [], lineReferences: [] };
  }
  
  // Check for long functions
  let longestFunction = 0;
  let currentFunction = 0;
  let inFunction = false;
  let functionStartLine = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if ((line.includes('function') || line.includes('=>')) && !line.includes('//')) {
      inFunction = true;
      currentFunction = 0;
      functionStartLine = i + 1;
    }
    
    if (inFunction) {
      currentFunction++;
      if (line.includes('}') && line.trim() === '}') {
        inFunction = false;
        if (currentFunction > 25) { // Increased threshold to avoid false positives
          issues.push(`Function length exceeds 25 lines (${currentFunction} lines) - consider breaking down into smaller functions`);
          lineReferences.push({
            line: functionStartLine,
            issue: `Long function (${currentFunction} lines)`
          });
        }
        longestFunction = Math.max(longestFunction, currentFunction);
      }
    }
  }
  
  // Check for nested conditions
  let maxNesting = 0;
  let currentNesting = 0;
  let nestingStartLines: number[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openBraces = (line.match(/{/g) || []).length;
    const closedBraces = (line.match(/}/g) || []).length;
    
    if (openBraces > 0) {
      for (let j = 0; j < openBraces; j++) {
        currentNesting++;
        if (currentNesting > 3) { // Increased threshold for nesting
          nestingStartLines.push(i + 1);
        }
      }
    }
    
    maxNesting = Math.max(maxNesting, currentNesting);
    
    if (closedBraces > 0) {
      for (let j = 0; j < closedBraces; j++) {
        currentNesting--;
      }
    }
  }
  
  if (maxNesting > 4) { // Increased threshold
    issues.push(`Nesting level exceeds 4 (max: ${maxNesting}) - consider restructuring to reduce complexity`);
    nestingStartLines.forEach(line => {
      lineReferences.push({
        line,
        issue: "Deep nesting"
      });
    });
  }
  
  // Check for potential error prone code
  if (hasControlFlow && !code.includes('try') && !code.includes('catch') && code.length > 100) {
    issues.push("No error handling mechanisms (try-catch) detected in complex code");
  }
  
  // Check for documentation only in non-trivial code
  if (lines.length > 20) {
    const commentLines = lines.filter(line => line.trim().startsWith('//') || 
                                            line.trim().startsWith('/*') || 
                                            line.trim().startsWith('*')).length;
    const commentRatio = commentLines / lines.length;
    
    if (commentRatio < 0.05) { // Reduced threshold
      issues.push(`Low comment-to-code ratio (${(commentRatio * 100).toFixed(1)}% < 5%) - consider adding more documentation`);
    }
  }
  
  // Check for variable naming
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const shortVarMatch = line.match(/\bvar\s+([a-z]{1})\b|\blet\s+([a-z]{1})\b|\bconst\s+([a-z]{1})\b/);
    if (shortVarMatch) {
      const varName = shortVarMatch[1] || shortVarMatch[2] || shortVarMatch[3];
      issues.push(`Single-letter variable name "${varName}" detected - use descriptive naming for better readability`);
      lineReferences.push({
        line: i + 1,
        issue: `Short variable name "${varName}"`
      });
    }
  }
  
  // Check for magic numbers only in more complex code
  if (lines.length > 10) {
    let hasMagicNumbers = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Look for numbers in code that aren't 0, 1, -1, or 2 (common acceptable magic numbers)
      const magicNumberMatch = line.match(/[^a-zA-Z0-9_]([3-9]|[1-9][0-9]+)[^a-zA-Z0-9_]/g);
      if (magicNumberMatch && !line.includes('//')) {
        lineReferences.push({
          line: i + 1,
          issue: "Magic number"
        });
        hasMagicNumbers = true;
      }
    }
    
    if (hasMagicNumbers) {
      issues.push("Magic numbers detected - consider using named constants");
    }
  }
  
  return { details: issues, lineReferences };
};

// Generate test cases - simplified placeholder function to maintain compatibility
export const generateTestCasesFromCode = (code: string, language: string): TestCase[] => {
  return [];
};

// Categorize violations as major or minor
export const categorizeViolations = (issuesList: string[]): CodeViolations => {
  // Determine major vs minor issues
  const majorIssues = issuesList.filter(issue => 
    issue.includes("exceeds 25") || 
    issue.includes("exceeds 4") ||
    issue.includes("No error handling") && issue.includes("complex code")
  );
  
  const minorIssues = issuesList.filter(issue => !majorIssues.includes(issue));
  
  return {
    major: majorIssues.length,
    minor: minorIssues.length,
    details: [...majorIssues.map(issue => `Major: ${issue}`), ...minorIssues.map(issue => `Minor: ${issue}`)],
  };
};
