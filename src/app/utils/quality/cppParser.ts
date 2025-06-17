export interface CppFunction {
  name: string;
  returnType: string;
  parameters: string[];
  startLine: number;
  endLine: number;
  isPublic: boolean;
  isVirtual: boolean;
  isStatic: boolean;
  isConst: boolean;
  className?: string;
  complexity: number;
}

export interface CppClass {
  name: string;
  startLine: number;
  endLine: number;
  isAbstract: boolean;
  baseClasses: string[];
  methods: CppFunction[];
  members: CppVariable[];
  accessLevel: string;
}

export interface CppVariable {
  name: string;
  type: string;
  isStatic: boolean;
  isConst: boolean;
  accessLevel: string;
  lineNumber: number;
}

export interface CppParseResult {
  functions: CppFunction[];
  classes: CppClass[];
  namespaces: string[];
  includes: string[];
  variables: CppVariable[];
  complexity: number;
  templateUsage: number;
  pointerUsage: number;
}

export class CppParser {
  private code: string;
  private lines: string[];
  private currentNamespace: string = '';
  
  constructor(code: string) {
    this.code = this.preprocessCode(code);
    this.lines = this.code.split('\n');
  }

  parse(): CppParseResult {
    const functions = this.extractFunctions();
    const classes = this.extractClasses();
    const namespaces = this.extractNamespaces();
    const includes = this.extractIncludes();
    const variables = this.extractGlobalVariables();
    const complexity = this.calculateOverallComplexity();
    const templateUsage = this.countTemplateUsage();
    const pointerUsage = this.countPointerUsage();

    return {
      functions,
      classes,
      namespaces,
      includes,
      variables,
      complexity,
      templateUsage,
      pointerUsage
    };
  }

  private preprocessCode(code: string): string {
    // Remove single-line comments but preserve line structure
    let processed = code.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments
    processed = processed.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove string literals to avoid false matches
    processed = processed.replace(/"([^"\\]|\\.)*"/g, '""');
    processed = processed.replace(/'([^'\\]|\\.)*'/g, "''");
    
    // Normalize whitespace but keep line breaks
    processed = processed.replace(/\t/g, '    ');
    
    return processed;
  }

  private extractFunctions(): CppFunction[] {
    const functions: CppFunction[] = [];
    let currentClass: string | null = null;
    let currentAccessLevel = 'public';
    let braceDepth = 0;
    let inClass = false;
    let inNamespace = false;
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();
      
      // Track namespace context
      if (line.startsWith('namespace ') && line.includes('{')) {
        inNamespace = true;
        this.currentNamespace = line.match(/namespace\s+(\w+)/)?.[1] || '';
        continue;
      }
      
      // Track class context
      const classMatch = line.match(/^(?:template\s*<[^>]*>)?\s*class\s+(\w+)/);
      if (classMatch) {
        currentClass = classMatch[1];
        inClass = true;
        currentAccessLevel = 'private'; // C++ classes default to private
        braceDepth = 0;
        continue;
      }
      
      // Track access levels in classes
      if (inClass) {
        if (line.match(/^public\s*:/)) currentAccessLevel = 'public';
        else if (line.match(/^private\s*:/)) currentAccessLevel = 'private';
        else if (line.match(/^protected\s*:/)) currentAccessLevel = 'protected';
      }
      
      // Track brace depth to determine when we exit contexts
      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;
      
      if ((inClass || inNamespace) && braceDepth === 0 && line.includes('}')) {
        if (inClass) {
          inClass = false;
          currentClass = null;
        }
        if (inNamespace) {
          inNamespace = false;
          this.currentNamespace = '';
        }
      }
      
      // Enhanced function detection
      const func = this.detectFunction(line, i + 1, currentClass, currentAccessLevel);
      if (func) {
        func.endLine = this.findFunctionEnd(i);
        func.complexity = this.calculateFunctionComplexity(
          this.lines.slice(i, func.endLine).join('\n')
        );
        functions.push(func);
      }
    }
    
    return functions;
  }

  private detectFunction(
    line: string, 
    lineNumber: number, 
    className: string | null, 
    accessLevel: string
  ): CppFunction | null {
    
    // Skip preprocessor directives and simple statements
    if (line.startsWith('#') || line.endsWith(';') && !line.includes('(')) {
      return null;
    }
    
    // Enhanced function patterns
    const functionPatterns = [
      // Standard function: [template] [inline/virtual/static] returnType functionName(params) [const] [override] [noexcept] {
      /^(?:template\s*<[^>]*>)?\s*(?:(inline|virtual|static|explicit)\s+)*([a-zA-Z_]\w*(?:\s*[*&])*)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*(?:(const|noexcept|override)\s*)*(?:{|$)/,
      
      // Constructor: [explicit] ClassName(params) [: initializer_list] {
      /^(?:(explicit)\s+)?([A-Z]\w*)\s*\(([^)]*)\)\s*(?::\s*[^{]*)?(?:{|$)/,
      
      // Destructor: virtual? ~ClassName() [noexcept] {
      /^(?:(virtual)\s+)?~([A-Z]\w*)\s*\(\s*\)\s*(?:(noexcept)\s*)?(?:{|$)/,
      
      // Operator overload: returnType operator[symbol](params) [const] {
      /^(?:(virtual|static|inline)\s+)*([a-zA-Z_]\w*(?:\s*[*&])*)\s+(operator(?:\+\+|--|<<|>>|[+\-*\/%=<>!&|^~\[\](),]))\s*\(([^)]*)\)\s*(?:(const)\s*)?(?:{|$)/,
      
      // Function pointer assignment: returnType (*functionName)(params) = ...
      /^([a-zA-Z_]\w*(?:\s*[*&])*)\s*\(\s*\*\s*([a-zA-Z_]\w*)\s*\)\s*\(([^)]*)\)/,
      
      // Lambda functions (simplified): auto name = [capture](params) -> returnType {
      /^(?:auto|[a-zA-Z_]\w*)\s+([a-zA-Z_]\w*)\s*=\s*\[[^\]]*\]\s*\(([^)]*)\)/
    ];
    
    for (const pattern of functionPatterns) {
      const match = line.match(pattern);
      if (match) {
        const func = this.parseFunctionMatch(match, lineNumber, className, accessLevel, pattern);
        if (func && !this.isKeyword(func.name)) {
          return func;
        }
      }
    }
    
    return null;
  }

  private parseFunctionMatch(
    match: RegExpMatchArray, 
    lineNumber: number, 
    className: string | null, 
    accessLevel: string,
    pattern: RegExp
  ): CppFunction | null {
    
    let modifier = '';
    let returnType = '';
    let functionName = '';
    let params = '';
    
    // Parse based on pattern type
    if (match[0].includes('operator')) {
      // Operator overload
      [, modifier, returnType, functionName, params] = match;
    } else if (match[0].includes('~')) {
      // Destructor
      [, modifier, functionName] = match;
      returnType = 'void';
      params = '';
    } else if (match[1] === 'explicit' || (match[2] && match[2][0] === match[2][0].toUpperCase())) {
      // Constructor
      [, modifier, functionName, params] = match;
      returnType = 'void';
    } else {
      // Regular function
      [, modifier, returnType, functionName, params] = match;
    }
    
    if (!functionName) return null;
    
    const parameters = params ? this.parseParameters(params) : [];
    
    return {
      name: functionName,
      returnType: returnType || 'void',
      parameters,
      startLine: lineNumber,
      endLine: lineNumber, // Will be updated later
      isPublic: accessLevel === 'public',
      isVirtual: modifier === 'virtual' || match[0].includes('virtual'),
      isStatic: modifier === 'static' || match[0].includes('static'),
      isConst: match[0].includes('const'),
      className,
      complexity: 1 // Will be calculated later
    };
  }

  private parseParameters(paramString: string): string[] {
    if (!paramString.trim()) return [];
    
    // Split by comma, but respect template parameters and nested parentheses
    const params: string[] = [];
    let current = '';
    let depth = 0;
    let inTemplate = 0;
    
    for (const char of paramString) {
      if (char === '<') inTemplate++;
      else if (char === '>') inTemplate--;
      else if (char === '(' && inTemplate === 0) depth++;
      else if (char === ')' && inTemplate === 0) depth--;
      else if (char === ',' && depth === 0 && inTemplate === 0) {
        if (current.trim()) params.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    
    if (current.trim()) params.push(current.trim());
    
    return params.map(param => {
      // Extract parameter type (remove parameter name and default values)
      const cleaned = param.replace(/\s*=\s*[^,]*$/, ''); // Remove default values
      const parts = cleaned.trim().split(/\s+/);
      
      // Return type information (everything except the last identifier)
      if (parts.length > 1) {
        return parts.slice(0, -1).join(' ');
      }
      return parts[0] || param;
    });
  }

  private findFunctionEnd(startLine: number): number {
    let braceDepth = 0;
    let foundOpenBrace = false;
    
    for (let i = startLine; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;
      
      if (braceDepth > 0) foundOpenBrace = true;
      
      if (foundOpenBrace && braceDepth === 0) {
        return i + 1;
      }
      
      // Handle function declarations without body (ends with semicolon)
      if (!foundOpenBrace && line.includes(';') && !line.includes('for') && !line.includes('while')) {
        return i + 1;
      }
      
      // Prevent infinite loops
      if (i - startLine > 500) break;
    }
    
    return Math.min(startLine + 50, this.lines.length);
  }

  private extractClasses(): CppClass[] {
    const classes: CppClass[] = [];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();
      
      // Enhanced class detection including templates
      const classMatch = line.match(/^(?:template\s*<[^>]*>)?\s*class\s+([a-zA-Z_]\w*)(?:\s*:\s*(.+))?\s*{?/);
      if (classMatch) {
        const className = classMatch[1];
        const inheritance = classMatch[2];
        const baseClasses = inheritance 
          ? inheritance.split(',').map(base => 
              base.trim().replace(/^(public|private|protected)\s+/, '')
            )
          : [];
        
        const classEndLine = this.findClassEnd(i);
        const methods = this.extractClassMethods(i, classEndLine, className);
        const members = this.extractClassMembers(i, classEndLine);
        
        classes.push({
          name: className,
          startLine: i + 1,
          endLine: classEndLine,
          isAbstract: this.isAbstractClass(i, classEndLine),
          baseClasses,
          methods,
          members,
          accessLevel: 'private' // C++ default
        });
      }
    }
    
    return classes;
  }

  private extractClassMethods(startLine: number, endLine: number, className: string): CppFunction[] {
    const methods: CppFunction[] = [];
    let currentAccessLevel = 'private';
    
    for (let i = startLine; i < Math.min(endLine, this.lines.length); i++) {
      const line = this.lines[i].trim();
      
      // Track access levels
      if (line.match(/^public\s*:/)) currentAccessLevel = 'public';
      else if (line.match(/^private\s*:/)) currentAccessLevel = 'private';
      else if (line.match(/^protected\s*:/)) currentAccessLevel = 'protected';
      
      const method = this.detectFunction(line, i + 1, className, currentAccessLevel);
      if (method) {
        method.endLine = this.findFunctionEnd(i);
        method.complexity = this.calculateFunctionComplexity(
          this.lines.slice(i, method.endLine).join('\n')
        );
        methods.push(method);
      }
    }
    
    return methods;
  }

  private extractClassMembers(startLine: number, endLine: number): CppVariable[] {
    const members: CppVariable[] = [];
    let currentAccessLevel = 'private';
    
    for (let i = startLine; i < Math.min(endLine, this.lines.length); i++) {
      const line = this.lines[i].trim();
      
      // Track access levels
      if (line.match(/^public\s*:/)) currentAccessLevel = 'public';
      else if (line.match(/^private\s*:/)) currentAccessLevel = 'private';
      else if (line.match(/^protected\s*:/)) currentAccessLevel = 'protected';
      
      // Member variable detection
      const memberMatch = line.match(/^(?:(static|const|mutable)\s+)*([a-zA-Z_]\w*(?:\s*[*&<>]*)*)\s+([a-zA-Z_]\w*)\s*(?:=.*)?;/);
      if (memberMatch && !line.includes('(') && !this.isKeyword(memberMatch[3])) {
        members.push({
          name: memberMatch[3],
          type: memberMatch[2],
          isStatic: line.includes('static'),
          isConst: line.includes('const'),
          accessLevel: currentAccessLevel,
          lineNumber: i + 1
        });
      }
    }
    
    return members;
  }

  private extractGlobalVariables(): CppVariable[] {
    const variables: CppVariable[] = [];
    let inClass = false;
    let inFunction = false;
    let braceDepth = 0;
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();
      
      // Track context
      if (line.includes('class ') || line.includes('struct ')) inClass = true;
      if (this.isFunctionStart(line)) inFunction = true;
      
      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;
      
      if (braceDepth === 0) {
        inClass = false;
        inFunction = false;
      }
      
      // Global variable detection (outside classes and functions)
      if (!inClass && !inFunction && braceDepth === 0) {
        const varMatch = line.match(/^(?:(extern|static|const)\s+)*([a-zA-Z_]\w*(?:\s*[*&<>]*)*)\s+([a-zA-Z_]\w*)\s*(?:=.*)?;/);
        if (varMatch && !line.includes('(') && !this.isKeyword(varMatch[3])) {
          variables.push({
            name: varMatch[3],
            type: varMatch[2],
            isStatic: line.includes('static'),
            isConst: line.includes('const'),
            accessLevel: 'global',
            lineNumber: i + 1
          });
        }
      }
    }
    
    return variables;
  }

  private findClassEnd(startLine: number): number {
    let braceDepth = 0;
    let foundOpenBrace = false;
    
    for (let i = startLine; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;
      
      if (braceDepth > 0) foundOpenBrace = true;
      
      if (foundOpenBrace && braceDepth === 0 && line.includes('}')) {
        return i + 1;
      }
    }
    
    return Math.min(startLine + 100, this.lines.length);
  }

  private isAbstractClass(startLine: number, endLine: number): boolean {
    for (let i = startLine; i < Math.min(endLine, this.lines.length); i++) {
      const line = this.lines[i].trim();
      if (line.includes('virtual') && line.includes('= 0')) {
        return true;
      }
    }
    return false;
  }

  private extractNamespaces(): string[] {
    const namespaces: string[] = [];
    
    this.lines.forEach(line => {
      const namespaceMatch = line.trim().match(/^namespace\s+([a-zA-Z_]\w*)/);
      if (namespaceMatch) {
        namespaces.push(namespaceMatch[1]);
      }
    });
    
    return [...new Set(namespaces)]; // Remove duplicates
  }

  private extractIncludes(): string[] {
    const includes: string[] = [];
    
    this.lines.forEach(line => {
      const includeMatch = line.trim().match(/^#include\s*[<"]([^>"]+)[>"]/);
      if (includeMatch) {
        includes.push(includeMatch[1]);
      }
    });
    
    return includes;
  }

  private calculateOverallComplexity(): number {
    let complexity = 1; // Base complexity
    
    const controlStructures = [
      /\bif\s*\(/g, /\bfor\s*\(/g, /\bwhile\s*\(/g, /\bdo\s*\{/g,
      /\bswitch\s*\(/g, /\bcase\s+/g, /\bdefault\s*:/g,
      /\bcatch\s*\(/g, /&&|\|\|/g, /\?\s*.*:/g,
      /\bthrow\s+/g, /\btry\s*\{/g
    ];
    
    controlStructures.forEach(pattern => {
      const matches = this.code.match(pattern);
      if (matches) complexity += matches.length;
    });
    
    return complexity;
  }

  private calculateFunctionComplexity(functionCode: string): number {
    let complexity = 1; // Base complexity for method entry point
    
    const complexityPatterns = [
      /\bif\s*\(/g,           // if statements
      /\belse\s+if\s*\(/g,    // else if statements
      /\bfor\s*\(/g,          // for loops
      /\bwhile\s*\(/g,        // while loops
      /\bdo\s*\{/g,           // do-while loops
      /\bswitch\s*\(/g,       // switch statements
      /\bcase\s+[^:]*:/g,     // case labels
      /\bcatch\s*\(/g,        // catch blocks
      /&&|\|\|/g,             // logical operators
      /\?\s*[^:]*:/g,         // ternary operators
      /\bthrow\s+/g,          // throw statements
      /\breturn\s+/g          // return statements (add slight complexity)
    ];
    
    complexityPatterns.forEach(pattern => {
      const matches = functionCode.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    // Additional complexity for template usage
    const templateMatches = functionCode.match(/template\s*<[^>]*>/g);
    if (templateMatches) complexity += templateMatches.length;
    
    return complexity;
  }

  private countTemplateUsage(): number {
    let count = 0;
    this.lines.forEach(line => {
      const templates = line.match(/template\s*<[^>]*>/g);
      if (templates) count += templates.length;
      
      // Template instantiations
      const instantiations = line.match(/\w+\s*<[^>]+>/g);
      if (instantiations) count += instantiations.length;
    });
    return count;
  }

  private countPointerUsage(): number {
    let count = 0;
    this.lines.forEach(line => {
      // Raw pointer declarations
      const pointers = line.match(/\w+\s*\*/g);
      if (pointers) count += pointers.length;
      
      // Pointer dereference operations
      const dereferences = line.match(/\*\w+/g);
      if (dereferences) count += dereferences.length;
      
      // Address-of operations
      const addressOf = line.match(/&\w+/g);
      if (addressOf) count += addressOf.length;
    });
    return count;
  }

  private isFunctionStart(line: string): boolean {
    return !!(
      line.match(/^(?:template\s*<[^>]*>)?\s*(?:inline|virtual|static|explicit)?\s*\w+\s+\w+\s*\(/) ||
      line.match(/^(?:template\s*<[^>]*>)?\s*\w+\s*\([^)]*\)\s*(?:const)?\s*{/) ||
      line.match(/^[a-zA-Z_]\w*::[a-zA-Z_]\w*\s*\(/) // Member function definition
    );
  }

  private isKeyword(word: string): boolean {
    const cppKeywords = [
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
      'break', 'continue', 'return', 'goto', 'try', 'catch', 'throw',
      'class', 'struct', 'union', 'enum', 'namespace', 'using',
      'public', 'private', 'protected', 'virtual', 'static', 'const',
      'volatile', 'mutable', 'template', 'typename', 'typedef',
      'auto', 'register', 'extern', 'inline', 'friend', 'operator',
      'new', 'delete', 'this', 'nullptr', 'true', 'false',
      'int', 'float', 'double', 'char', 'bool', 'void', 'string'
    ];
    
    return cppKeywords.includes(word);
  }
}
