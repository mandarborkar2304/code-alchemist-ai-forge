
import { CodeViolations } from '@/types';

// Analyze code for issues with line references
export const analyzeCodeForIssues = (code: string): { details: string[], lineReferences: {line: number, issue: string}[] } => {
  const issues: string[] = [];
  const lineReferences: {line: number, issue: string}[] = [];
  const lines = code.split('\n');
  
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
        if (currentFunction > 20) {
          issues.push(`Function length exceeds 20 lines (${currentFunction} lines) - consider breaking down into smaller functions`);
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
        if (currentNesting > 2) {
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
  
  if (maxNesting > 3) {
    issues.push(`Nesting level exceeds 3 (max: ${maxNesting}) - consider restructuring to reduce complexity`);
    nestingStartLines.forEach(line => {
      lineReferences.push({
        line,
        issue: "Deep nesting"
      });
    });
  }
  
  // Check for missing error handling
  if (!code.includes('try') || !code.includes('catch')) {
    issues.push("No error handling mechanisms (try-catch) detected");
  }
  
  // Check for documentation
  const commentLines = lines.filter(line => line.trim().startsWith('//') || 
                                          line.trim().startsWith('/*') || 
                                          line.trim().startsWith('*')).length;
  const commentRatio = commentLines / lines.length;
  
  if (commentRatio < 0.1) {
    issues.push(`Low comment-to-code ratio (${(commentRatio * 100).toFixed(1)}% < 10%) - consider adding more documentation`);
  }
  
  // Check for variable naming
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const shortVarMatch = line.match(/\bvar\s+([a-z]{1,2})\b|\blet\s+([a-z]{1,2})\b|\bconst\s+([a-z]{1,2})\b/);
    if (shortVarMatch) {
      const varName = shortVarMatch[1] || shortVarMatch[2] || shortVarMatch[3];
      issues.push(`Short variable name "${varName}" detected - use descriptive naming for better readability`);
      lineReferences.push({
        line: i + 1,
        issue: `Short variable name "${varName}"`
      });
    }
  }
  
  // Check for magic numbers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for numbers in code that aren't 0, 1, or -1 (common acceptable magic numbers)
    const magicNumberMatch = line.match(/[^a-zA-Z0-9_]([2-9]|[1-9][0-9]+)[^a-zA-Z0-9_]/g);
    if (magicNumberMatch && !line.includes('//')) {
      lineReferences.push({
        line: i + 1,
        issue: "Magic number"
      });
      // Only add this issue once
      if (!issues.includes("Magic numbers detected - consider using named constants")) {
        issues.push("Magic numbers detected - consider using named constants");
      }
    }
  }
  
  return { details: issues, lineReferences };
};

// Categorize violations as major or minor
export const categorizeViolations = (issuesList: string[]): CodeViolations => {
  // Determine major vs minor issues
  const majorIssues = issuesList.filter(issue => 
    issue.includes("exceeds") || 
    issue.includes("No error handling") || 
    issue.includes("critical") ||
    issue.includes("exceeds 3")
  );
  
  const minorIssues = issuesList.filter(issue => !majorIssues.includes(issue));
  
  return {
    major: majorIssues.length,
    minor: minorIssues.length,
    details: [...majorIssues.map(issue => `Major: ${issue}`), ...minorIssues.map(issue => `Minor: ${issue}`)],
  };
};

// Generate improved code based on analysis
export const generateCorrectedCode = (code: string, metrics: { 
  cyclomaticComplexity: number, 
  maintainability: number, 
  reliability: number,
  violations: CodeViolations
}): string => {
  let correctedCode = code;
  
  // Add input validation if missing
  if (metrics.reliability < 65 && !code.includes('if') && !code.includes('undefined') && !code.includes('null')) {
    if (code.includes('function')) {
      correctedCode = correctedCode.replace(
        /function\s+(\w+)\s*\(([^)]*)\)\s*{/,
        function(match, funcName, params) {
          const paramList = params.split(',').map(p => p.trim());
          const validations = paramList.map(p => `  if (${p} === undefined || ${p} === null) {\n    throw new Error('${p} is required');\n  }`).join('\n');
          return `function ${funcName}(${params}) {\n${validations}\n`;
        }
      );
    } else if (code.includes('=>')) {
      correctedCode = correctedCode.replace(
        /const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/,
        function(match, funcName, params) {
          const paramList = params.split(',').map(p => p.trim());
          const validations = paramList.map(p => `  if (${p} === undefined || ${p} === null) throw new Error('${p} is required');`).join('\n');
          return `const ${funcName} = (${params}) => {\n${validations}\n  return `;
        }
      );
      // Close the arrow function
      if (!correctedCode.includes('return')) {
        correctedCode = correctedCode.replace(/}\s*$/, '  }\n');
      } else if (!correctedCode.includes('return {')) {
        correctedCode = correctedCode + ';\n}';
      }
    }
  }
  
  // Add error handling if missing
  if (metrics.reliability < 65 && !code.includes('try') && !code.includes('catch')) {
    if (code.includes('function')) {
      correctedCode = correctedCode.replace(
        /function\s+(\w+)\s*\(([^)]*)\)\s*{/,
        function(match, funcName, params) {
          return `function ${funcName}(${params}) {\n  try {\n`;
        }
      );
      // Add catch block at the end
      correctedCode = correctedCode.replace(
        /}(\s*)$/,
        '  } catch (error) {\n    console.error(`An error occurred in ${funcName}:`, error);\n    throw error;\n  }\n}$1'
      );
    }
  }
  
  // Improve code format and structure
  if (metrics.maintainability < 65) {
    // Add comments to functions
    correctedCode = correctedCode.replace(
      /function\s+(\w+)\s*\(([^)]*)\)/g,
      function(match, funcName, params) {
        const paramList = params.split(',').map(p => p.trim());
        const paramComments = paramList.length > 0 ? 
          `${paramList.map(p => ` * @param {any} ${p} - Description of ${p}`).join('\n')}\n` : '';
        
        return `/**\n * ${funcName} performs an operation based on the provided parameters\n${paramComments} * @returns {any} - The result of the operation\n */\nfunction ${funcName}(${params})`;
      }
    );
    
    // Convert magic numbers to named constants
    const magicNumberMatches = [...correctedCode.matchAll(/[^a-zA-Z0-9_"](\d+)[^a-zA-Z0-9_"]/g)];
    const uniqueNumbers = new Set();
    magicNumberMatches.forEach(match => {
      const num = match[1];
      if (num !== '0' && num !== '1' && num.length < 5) {
        uniqueNumbers.add(num);
      }
    });
    
    let constDeclarations = '';
    uniqueNumbers.forEach(num => {
      const constName = `CONSTANT_${num}`;
      constDeclarations += `const ${constName} = ${num};\n`;
      const regex = new RegExp(`([^a-zA-Z0-9_"])${num}([^a-zA-Z0-9_"])`, 'g');
      correctedCode = correctedCode.replace(regex, `$1${constName}$2`);
    });
    
    if (constDeclarations) {
      correctedCode = constDeclarations + '\n' + correctedCode;
    }
  }
  
  // Break long functions into smaller ones
  if (metrics.cyclomaticComplexity > 20) {
    // Simplified approach: identify and extract complex conditions
    const complexConditions = [...correctedCode.matchAll(/if\s*\((.*&&.*\|\|.*)\)/g)];
    let extractedFunctions = '';
    
    complexConditions.forEach((match, index) => {
      const condition = match[1];
      const funcName = `isConditionMet${index + 1}`;
      extractedFunctions += `/**\n * Helper function to evaluate a complex condition\n * @returns {boolean} - Whether the condition is met\n */\nfunction ${funcName}() {\n  return ${condition};\n}\n\n`;
      correctedCode = correctedCode.replace(
        `if (${condition})`,
        `if (${funcName}())`
      );
    });
    
    if (extractedFunctions) {
      correctedCode = extractedFunctions + correctedCode;
    }
  }
  
  return correctedCode;
};
