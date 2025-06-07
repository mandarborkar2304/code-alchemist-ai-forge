
export interface CppFunction {
  name: string;
  returnType: string;
  parameters: string[];
  startLine: number;
  endLine: number;
  isPublic: boolean;
  isVirtual: boolean;
  isStatic: boolean;
  className?: string;
}

export interface CppClass {
  name: string;
  startLine: number;
  endLine: number;
  isAbstract: boolean;
  baseClasses: string[];
  methods: CppFunction[];
  members: string[];
}

export interface CppParseResult {
  functions: CppFunction[];
  classes: CppClass[];
  namespaces: string[];
  includes: string[];
  complexity: number;
}

export class CppParser {
  private code: string;
  private lines: string[];
  
  constructor(code: string) {
    this.code = this.preprocessCode(code);
    this.lines = this.code.split('\n');
  }

  parse(): CppParseResult {
    const functions = this.extractFunctions();
    const classes = this.extractClasses();
    const namespaces = this.extractNamespaces();
    const includes = this.extractIncludes();
    const complexity = this.calculateOverallComplexity();

    return {
      functions,
      classes,
      namespaces,
      includes,
      complexity
    };
  }

  private preprocessCode(code: string): string {
    // Remove single-line comments
    let processed = code.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments
    processed = processed.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove preprocessor directives (except includes for analysis)
    processed = processed.replace(/^#(?!include).*$/gm, '');
    
    // Remove string literals to avoid false matches
    processed = processed.replace(/"([^"\\]|\\.)*"/g, '""');
    processed = processed.replace(/'([^'\\]|\\.)*'/g, "''");
    
    return processed;
  }

  private extractFunctions(): CppFunction[] {
    const functions: CppFunction[] = [];
    let currentClass: string | null = null;
    let currentAccessLevel = 'public';
    let braceDepth = 0;
    let inClass = false;
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();
      
      // Track class context
      const classMatch = line.match(/class\s+(\w+)/);
      if (classMatch) {
        currentClass = classMatch[1];
        inClass = true;
        currentAccessLevel = 'private'; // C++ classes default to private
        continue;
      }
      
      // Track access levels in classes
      if (inClass) {
        if (line.includes('public:')) currentAccessLevel = 'public';
        else if (line.includes('private:')) currentAccessLevel = 'private';
        else if (line.includes('protected:')) currentAccessLevel = 'protected';
      }
      
      // Track brace depth to determine when we exit a class
      if (inClass) {
        braceDepth += (line.match(/{/g) || []).length;
        braceDepth -= (line.match(/}/g) || []).length;
        if (braceDepth === 0 && line.includes('}')) {
          inClass = false;
          currentClass = null;
        }
      }
      
      // Function detection patterns
      const functionPatterns = [
        // Standard function: returnType functionName(params)
        /^(?:(static|virtual|inline)\s+)?(\w+(?:\s*\*|\s*&)?)\s+(\w+)\s*\(([^)]*)\)\s*(?:const)?\s*{?/,
        // Constructor: ClassName(params)
        /^(?:(explicit)\s+)?(\w+)\s*\(([^)]*)\)\s*(?::\s*[^{]*)?{?/,
        // Destructor: ~ClassName()
        /^(~)(\w+)\s*\(\s*\)\s*{?/,
        // Operator overload: returnType operator+(params)
        /^(?:(static|virtual|inline)\s+)?(\w+(?:\s*\*|\s*&)?)\s+(operator\S+)\s*\(([^)]*)\)\s*(?:const)?\s*{?/
      ];
      
      for (const pattern of functionPatterns) {
        const match = line.match(pattern);
        if (match) {
          const func = this.parseFunctionMatch(match, i + 1, currentClass, currentAccessLevel);
          if (func) {
            // Find function end
            func.endLine = this.findFunctionEnd(i);
            functions.push(func);
          }
          break;
        }
      }
    }
    
    return functions;
  }

  private parseFunctionMatch(
    match: RegExpMatchArray, 
    lineNumber: number, 
    className: string | null, 
    accessLevel: string
  ): CppFunction | null {
    const [, modifier, returnType, functionName, params] = match;
    
    if (!functionName || this.isKeyword(functionName)) {
      return null;
    }
    
    const parameters = params ? this.parseParameters(params) : [];
    
    return {
      name: functionName,
      returnType: returnType || 'void',
      parameters,
      startLine: lineNumber,
      endLine: lineNumber, // Will be updated later
      isPublic: accessLevel === 'public',
      isVirtual: modifier === 'virtual',
      isStatic: modifier === 'static',
      className
    };
  }

  private parseParameters(paramString: string): string[] {
    if (!paramString.trim()) return [];
    
    return paramString.split(',')
      .map(param => param.trim())
      .filter(param => param.length > 0)
      .map(param => {
        // Extract parameter type (remove parameter name)
        const parts = param.trim().split(/\s+/);
        return parts.slice(0, -1).join(' ') || parts[0];
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
      if (!foundOpenBrace && line.includes(';')) {
        return i + 1;
      }
    }
    
    return startLine + 1;
  }

  private extractClasses(): CppClass[] {
    const classes: CppClass[] = [];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();
      
      // Class declaration pattern
      const classMatch = line.match(/class\s+(\w+)(?:\s*:\s*(.+))?\s*{?/);
      if (classMatch) {
        const className = classMatch[1];
        const inheritance = classMatch[2];
        const baseClasses = inheritance 
          ? inheritance.split(',').map(base => base.trim().replace(/^(public|private|protected)\s+/, ''))
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
          members
        });
      }
    }
    
    return classes;
  }

  private findClassEnd(startLine: number): number {
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
    }
    
    return startLine + 1;
  }

  private extractClassMethods(startLine: number, endLine: number, className: string): CppFunction[] {
    // This would extract methods within the class bounds
    // For simplicity, we'll filter functions that belong to this class
    const allFunctions = this.extractFunctions();
    return allFunctions.filter(func => func.className === className);
  }

  private extractClassMembers(startLine: number, endLine: number): string[] {
    const members: string[] = [];
    
    for (let i = startLine; i < Math.min(endLine, this.lines.length); i++) {
      const line = this.lines[i].trim();
      
      // Simple member variable detection
      const memberMatch = line.match(/^(\w+(?:\s*\*|\s*&)?)\s+(\w+)\s*(?:=.*)?;/);
      if (memberMatch && !line.includes('(')) {
        members.push(memberMatch[2]);
      }
    }
    
    return members;
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
      const namespaceMatch = line.trim().match(/namespace\s+(\w+)/);
      if (namespaceMatch) {
        namespaces.push(namespaceMatch[1]);
      }
    });
    
    return namespaces;
  }

  private extractIncludes(): string[] {
    const includes: string[] = [];
    
    this.lines.forEach(line => {
      const includeMatch = line.trim().match(/#include\s*[<"]([^>"]+)[>"]/);
      if (includeMatch) {
        includes.push(includeMatch[1]);
      }
    });
    
    return includes;
  }

  private calculateOverallComplexity(): number {
    let complexity = 1; // Base complexity
    
    const controlStructures = [
      /\bif\s*\(/g, /\bfor\s*\(/g, /\bwhile\s*\(/g, /\bdo\s*{/g,
      /\bswitch\s*\(/g, /\bcase\s+/g, /\bdefault\s*:/g,
      /\bcatch\s*\(/g, /&&|\|\|/g, /\?\s*.*:/g
    ];
    
    controlStructures.forEach(pattern => {
      const matches = this.code.match(pattern);
      if (matches) complexity += matches.length;
    });
    
    return complexity;
  }

  private isKeyword(word: string): boolean {
    const cppKeywords = [
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
      'break', 'continue', 'return', 'goto', 'try', 'catch', 'throw',
      'class', 'struct', 'union', 'enum', 'namespace', 'using',
      'public', 'private', 'protected', 'virtual', 'static', 'const',
      'volatile', 'mutable', 'template', 'typename', 'typedef',
      'auto', 'register', 'extern', 'inline', 'friend', 'operator'
    ];
    
    return cppKeywords.includes(word);
  }
}
