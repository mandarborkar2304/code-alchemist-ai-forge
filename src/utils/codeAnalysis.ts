import { CodeViolations } from '@/types';
import { TestCase } from '@/types';

// Quality Rules Configuration
const rules = {
  cyclomaticComplexity: {
    warnThreshold: 10, // Warn at > 10 per method
  },
  functionLength: {
    warnThreshold: 10, // Warn at > 10 lines per method
  },
  nestingDepth: {
    warnThreshold: 5, // Warn at > 5 levels (best practices recommend ≤ 4)
  },
  commentDensity: {
    warnThresholdPercent: 20, // Warn if < 20 %
  },
  codeDuplication: {
    // Placeholder for block-based duplication detection
    warnThreshold: 10, // Set based on your block size preference for detection
  },
  noGlobalVariables: {
    enabled: true,
  },
  customSmells: [
    {
      id: "no-console-log",
      pattern: "console\\.log",
      message: "Avoid console.log in production code",
    },
    {
      id: "no-todo-fixme",
      pattern: "\\/\\/\\s*(TODO|FIXME)",
      message: "Remove TODO/FIXME comments before commit",
    },
  ] as Array<{ id: string; pattern: string; message: string }>,

};

// Analyze code for issues with line references
export const analyzeCodeForIssues = (code: string): { details: string[], lineReferences: { line: number, issue: string }[] } => {
  const issues: string[] = [];
  const lineReferences: { line: number, issue: string }[] = [];
  const lines = code.split('\n');

  const hasControlFlow = code.includes('if') || code.includes('for') || code.includes('while');
  if (!hasControlFlow && lines.length < 15) {
    return { details: [], lineReferences: [] };
  }

  let currentFunction = 0;
  let inFunction = false;
  let functionStartLine = 0;

  // Check function length
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
        if (currentFunction > rules.functionLength.warnThreshold) {
          issues.push(`Function length exceeds ${rules.functionLength.warnThreshold} lines (${currentFunction} lines) - consider breaking down into smaller functions`);
          lineReferences.push({ line: functionStartLine, issue: `Long function (${currentFunction} lines)` });
        }
      }
    }
  }

  // Check nesting depth
  let maxNesting = 0;
  let currentNesting = 0;
  let nestingStartLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openBraces = (line.match(/{/g) || []).length;
    const closedBraces = (line.match(/}/g) || []).length;

    for (let j = 0; j < openBraces; j++) {
      currentNesting++;
      if (currentNesting > rules.nestingDepth.warnThreshold) {
        nestingStartLines.push(i + 1);
      }
    }

    maxNesting = Math.max(maxNesting, currentNesting);

    for (let j = 0; j < closedBraces; j++) {
      currentNesting--;
    }
  }

  if (maxNesting > rules.nestingDepth.warnThreshold) {
    issues.push(`Nesting level exceeds ${rules.nestingDepth.warnThreshold} (max: ${maxNesting}) - consider restructuring to reduce complexity`);
    nestingStartLines.forEach(line => {
      lineReferences.push({ line, issue: "Deep nesting" });
    });
  }

  // Check comment density
  if (lines.length > 20) {
    const commentLines = lines.filter(line =>
      line.trim().startsWith('//') ||
      line.trim().startsWith('/*') ||
      line.trim().startsWith('*')
    ).length;

    const commentRatio = commentLines / lines.length;
    if (commentRatio < rules.commentDensity.warnThresholdPercent / 100) {
      issues.push(`Low comment-to-code ratio (${(commentRatio * 100).toFixed(1)}% < ${rules.commentDensity.warnThresholdPercent}%) - consider adding more documentation`);
    }
  }

  // Check for magic numbers (this will require additional logic based on your definition of blocks)
  if (lines.length > 10) {
    let hasMagicNumbers = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const magicNumberMatch = line.match(/[^a-zA-Z0-9_]([3-9]|[1-9][0-9]+)[^a-zA-Z0-9_]/g);
      if (magicNumberMatch && !line.includes('//')) {
        lineReferences.push({ line: i + 1, issue: "Magic number" });
        hasMagicNumbers = true;
      }
    }

    if (hasMagicNumbers) {
      issues.push("Magic numbers detected - consider using named constants");
    }
  }

  // Check for custom smells (e.g., TODO/FIXME and console.log)
  rules.customSmells.forEach((smell) => {
    const regex = new RegExp(smell.pattern, "g");
    lines.forEach((line, idx) => {
      if (regex.test(line)) {
        issues.push(smell.message);
        lineReferences.push({ line: idx + 1, issue: smell.id });
      }
    });
  });

  return { details: issues, lineReferences };
};

// Categorize violations with major, and minor
export const categorizeViolations = (issuesList: string[]): CodeViolations => {
  const majorIssues = issuesList.filter(issue =>
      issue.includes("Function length exceeds") ||
      issue.includes("Nesting level exceeds") ||
      issue.includes("No error handling")
  );

  const minorIssues = issuesList.filter(issue =>
    !majorIssues.includes(issue)
  );

  return {
    major: majorIssues.length,
    minor: minorIssues.length,
    details: [
      ...majorIssues.map(issue => `Major: ${issue}`),
      ...minorIssues.map(issue => `Minor: ${issue}`),
    ],
  };
};

// Block-based duplication detection (placeholder for your specific logic)
export const detectCodeDuplication = (code: string) => {
  // Implement block-based duplication logic here
  const lines = code.split('\n');
  let duplicateBlocks = [];

  // Simulate block-based detection logic
  for (let i = 0; i < lines.length - 5; i++) {
    const block = lines.slice(i, i + 5).join('\n');
    for (let j = i + 1; j < lines.length - 5; j++) {
      if (lines.slice(j, j + 5).join('\n') === block) {
        duplicateBlocks.push({ start: i + 1, block });
        break;
      }
    }
  }

  if (duplicateBlocks.length > 0) {
    duplicateBlocks.forEach(block => {
      issues.push(`Block-based code duplication detected at line ${block.start}`);
      lineReferences.push({ line: block.start, issue: "Code Duplication" });
    });
  }

  return duplicateBlocks;
};

