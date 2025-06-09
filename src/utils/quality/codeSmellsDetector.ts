
export interface CodeSmell {
  type: string;
  severity: 'Major' | 'Minor';
  description: string;
  line?: number;
  suggestion: string;
  category: 'Method' | 'Structure' | 'Naming' | 'Logic' | 'Performance';
}

export interface CodeSmellsResult {
  smells: CodeSmell[];
  summary: {
    total: number;
    major: number;
    minor: number;
    byCategory: { [key: string]: number };
  };
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

export function detectCodeSmells(code: string, language: string): CodeSmellsResult {
  const smells: CodeSmell[] = [];
  
  // Detect various code smells
  smells.push(...detectLongMethods(code, language));
  smells.push(...detectDuplicateCode(code));
  smells.push(...detectMagicNumbers(code));
  smells.push(...detectDeepNesting(code));
  smells.push(...detectUnusedVariables(code, language));
  smells.push(...detectExcessiveConditionals(code));
  smells.push(...detectLongParameterLists(code, language));
  smells.push(...detectComplexExpressions(code));
  smells.push(...detectEmptyBlocks(code));
  smells.push(...detectInconsistentNaming(code, language));
  
  // Calculate summary
  const summary = {
    total: smells.length,
    major: smells.filter(s => s.severity === 'Major').length,
    minor: smells.filter(s => s.severity === 'Minor').length,
    byCategory: categorizeSmells(smells)
  };
  
  // Calculate score (100 - penalties)
  const majorPenalty = summary.major * 10;
  const minorPenalty = summary.minor * 3;
  const score = Math.max(0, 100 - majorPenalty - minorPenalty);
  
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D';
  
  return { smells, summary, score, grade };
}

function detectLongMethods(code: string, language: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const functions = extractFunctions(code, language);
  
  functions.forEach(func => {
    const lineCount = func.body.split('\n').length;
    
    if (lineCount > 50) {
      smells.push({
        type: 'Long Method',
        severity: 'Major',
        description: `Function '${func.name}' is ${lineCount} lines long`,
        line: func.startLine,
        suggestion: 'Break this method into smaller, more focused functions',
        category: 'Method'
      });
    } else if (lineCount > 30) {
      smells.push({
        type: 'Long Method',
        severity: 'Minor',
        description: `Function '${func.name}' is ${lineCount} lines long`,
        line: func.startLine,
        suggestion: 'Consider breaking this method into smaller functions',
        category: 'Method'
      });
    }
  });
  
  return smells;
}

function detectDuplicateCode(code: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');
  const duplicates = findDuplicateBlocks(lines, 5); // Minimum 5 lines
  
  duplicates.forEach(duplicate => {
    smells.push({
      type: 'Duplicate Code',
      severity: 'Major',
      description: `${duplicate.lines.length} duplicate lines found`,
      line: duplicate.firstOccurrence,
      suggestion: 'Extract duplicate code into a reusable function',
      category: 'Structure'
    });
  });
  
  return smells;
}

function detectMagicNumbers(code: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    // Look for numeric literals that aren't 0, 1, -1, or 2
    const magicNumbers = line.match(/\b(?!0\b|1\b|-1\b|2\b)\d{2,}\b/g);
    
    if (magicNumbers) {
      magicNumbers.forEach(number => {
        smells.push({
          type: 'Magic Number',
          severity: 'Minor',
          description: `Magic number '${number}' found`,
          line: index + 1,
          suggestion: 'Replace with a named constant',
          category: 'Naming'
        });
      });
    }
  });
  
  return smells;
}

function detectDeepNesting(code: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');
  let currentDepth = 0;
  let maxDepth = 0;
  let deepNestingLines: number[] = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Count opening braces/blocks
    if (trimmed.includes('{') || 
        trimmed.match(/:\s*$/) ||
        trimmed.includes('if') ||
        trimmed.includes('for') ||
        trimmed.includes('while')) {
      currentDepth++;
      
      if (currentDepth > 4) {
        deepNestingLines.push(index + 1);
      }
      
      maxDepth = Math.max(maxDepth, currentDepth);
    }
    
    // Count closing braces
    if (trimmed.includes('}')) {
      currentDepth = Math.max(0, currentDepth - 1);
    }
  });
  
  if (maxDepth > 5) {
    smells.push({
      type: 'Deep Nesting',
      severity: 'Major',
      description: `Maximum nesting depth of ${maxDepth} detected`,
      line: deepNestingLines[0],
      suggestion: 'Reduce nesting by extracting methods or using early returns',
      category: 'Structure'
    });
  } else if (maxDepth > 4) {
    smells.push({
      type: 'Deep Nesting',
      severity: 'Minor',
      description: `Nesting depth of ${maxDepth} detected`,
      line: deepNestingLines[0],
      suggestion: 'Consider reducing nesting complexity',
      category: 'Structure'
    });
  }
  
  return smells;
}

function detectUnusedVariables(code: string, language: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const variables = extractVariableDeclarations(code, language);
  
  variables.forEach(variable => {
    const usageCount = countVariableUsage(code, variable.name, variable.line);
    
    if (usageCount === 0) {
      smells.push({
        type: 'Unused Variable',
        severity: 'Minor',
        description: `Variable '${variable.name}' is declared but never used`,
        line: variable.line,
        suggestion: 'Remove unused variable or use it in your logic',
        category: 'Logic'
      });
    }
  });
  
  return smells;
}

function detectExcessiveConditionals(code: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    // Count conditional operators in a single line
    const conditionals = (line.match(/if|else|switch|case|\?.*:/g) || []).length;
    
    if (conditionals > 3) {
      smells.push({
        type: 'Complex Conditional',
        severity: 'Major',
        description: `${conditionals} conditional statements in one line`,
        line: index + 1,
        suggestion: 'Break complex conditionals into separate statements or use polymorphism',
        category: 'Logic'
      });
    }
  });
  
  return smells;
}

function detectLongParameterLists(code: string, language: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const functions = extractFunctions(code, language);
  
  functions.forEach(func => {
    const paramCount = func.parameters.length;
    
    if (paramCount > 6) {
      smells.push({
        type: 'Long Parameter List',
        severity: 'Major',
        description: `Function '${func.name}' has ${paramCount} parameters`,
        line: func.startLine,
        suggestion: 'Consider using parameter objects or breaking the function down',
        category: 'Method'
      });
    } else if (paramCount > 4) {
      smells.push({
        type: 'Long Parameter List',
        severity: 'Minor',
        description: `Function '${func.name}' has ${paramCount} parameters`,
        line: func.startLine,
        suggestion: 'Consider reducing the number of parameters',
        category: 'Method'
      });
    }
  });
  
  return smells;
}

function detectComplexExpressions(code: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    // Count operators that might indicate complexity
    const operators = (line.match(/[+\-*/%<>=!&|^]/g) || []).length;
    const parentheses = (line.match(/[()]/g) || []).length;
    
    if (operators > 8 || parentheses > 6) {
      smells.push({
        type: 'Complex Expression',
        severity: 'Minor',
        description: 'Complex expression detected',
        line: index + 1,
        suggestion: 'Break complex expressions into intermediate variables',
        category: 'Logic'
      });
    }
  });
  
  return smells;
}

function detectEmptyBlocks(code: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i].trim();
    const nextLine = lines[i + 1].trim();
    
    if (currentLine.includes('{') && nextLine === '}') {
      smells.push({
        type: 'Empty Block',
        severity: 'Minor',
        description: 'Empty code block found',
        line: i + 1,
        suggestion: 'Remove empty blocks or add appropriate logic',
        category: 'Structure'
      });
    }
  }
  
  return smells;
}

function detectInconsistentNaming(code: string, language: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const variables = extractVariableDeclarations(code, language);
  
  const camelCaseVars = variables.filter(v => /^[a-z][a-zA-Z0-9]*$/.test(v.name));
  const snakeCaseVars = variables.filter(v => /^[a-z][a-z0-9_]*$/.test(v.name));
  
  if (camelCaseVars.length > 0 && snakeCaseVars.length > 0) {
    smells.push({
      type: 'Inconsistent Naming',
      severity: 'Minor',
      description: 'Mixed camelCase and snake_case naming conventions',
      suggestion: 'Use consistent naming convention throughout the code',
      category: 'Naming'
    });
  }
  
  return smells;
}

// Helper functions
interface FunctionInfo {
  name: string;
  startLine: number;
  body: string;
  parameters: string[];
}

function extractFunctions(code: string, language: string): FunctionInfo[] {
  const functions: FunctionInfo[] = [];
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Simple function detection
    const funcMatch = line.match(/function\s+(\w+)\s*\(([^)]*)\)/) ||
                     line.match(/(\w+)\s*=\s*function\s*\(([^)]*)\)/) ||
                     line.match(/def\s+(\w+)\s*\(([^)]*)\)/);
    
    if (funcMatch) {
      const name = funcMatch[1];
      const params = funcMatch[2] ? funcMatch[2].split(',').map(p => p.trim()) : [];
      
      // Extract function body
      let body = '';
      let braceCount = 0;
      let j = i;
      
      do {
        body += lines[j] + '\n';
        braceCount += (lines[j].match(/{/g) || []).length;
        braceCount -= (lines[j].match(/}/g) || []).length;
        j++;
      } while (j < lines.length && braceCount > 0);
      
      functions.push({
        name,
        startLine: i + 1,
        body,
        parameters: params
      });
    }
  }
  
  return functions;
}

interface VariableInfo {
  name: string;
  line: number;
}

function extractVariableDeclarations(code: string, language: string): VariableInfo[] {
  const variables: VariableInfo[] = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    const declarations = line.match(/(?:let|const|var)\s+(\w+)/g) ||
                        line.match(/(\w+)\s*=/) ||
                        [];
    
    declarations.forEach(decl => {
      const match = decl.match(/(\w+)/);
      if (match) {
        variables.push({
          name: match[1],
          line: index + 1
        });
      }
    });
  });
  
  return variables;
}

function countVariableUsage(code: string, varName: string, declarationLine: number): number {
  const lines = code.split('\n');
  let count = 0;
  
  // Count usage after declaration
  for (let i = declarationLine; i < lines.length; i++) {
    const regex = new RegExp(`\\b${varName}\\b`, 'g');
    const matches = lines[i].match(regex);
    if (matches) {
      count += matches.length;
    }
  }
  
  return count - 1; // Subtract the declaration itself
}

function findDuplicateBlocks(lines: string[], minLines: number): Array<{ lines: string[], firstOccurrence: number }> {
  const duplicates: Array<{ lines: string[], firstOccurrence: number }> = [];
  
  for (let i = 0; i <= lines.length - minLines; i++) {
    const block = lines.slice(i, i + minLines);
    const blockStr = block.join('\n').trim();
    
    if (blockStr.length < 50) continue; // Skip trivial blocks
    
    for (let j = i + minLines; j <= lines.length - minLines; j++) {
      const compareBlock = lines.slice(j, j + minLines);
      const compareStr = compareBlock.join('\n').trim();
      
      if (blockStr === compareStr) {
        duplicates.push({
          lines: block,
          firstOccurrence: i + 1
        });
        break; // Found duplicate, move to next block
      }
    }
  }
  
  return duplicates;
}

function categorizeSmells(smells: CodeSmell[]): { [key: string]: number } {
  const categories: { [key: string]: number } = {};
  
  smells.forEach(smell => {
    categories[smell.category] = (categories[smell.category] || 0) + 1;
  });
  
  return categories;
}
