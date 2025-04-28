import React, { useState } from "react";
import { ProgrammingLanguage } from "@/types";
import { FileCode, FileText, AlertCircle } from "lucide-react";
interface CodeEditorProps {
  code: string;
  language: ProgrammingLanguage;
  onChange: (value: string) => void;
  webContent?: {
    html: string;
    css: string;
    js: string;
    onChangeHtml: (value: string) => void;
    onChangeCss: (value: string) => void;
    onChangeJs: (value: string) => void;
  };
}
const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
  webContent
}) => {
  // Generate default placeholder instructions based on language
  const getDefaultInstructions = () => {
    const langId = language.id;
    if (langId === "python" || langId === "python3") {
      return "# Start by importing necessary modules\n# Use proper indentation for blocks\n\n";
    } else if (langId === "pythonml" || langId === "pytorch" || langId === "tensorflow") {
      return "# Import data science libraries (numpy, pandas, etc.)\n# Initialize models with appropriate parameters\n\n";
    } else if (langId === "java" || langId === "java19") {
      return "// Define a class with proper access modifiers\n// Include a main method to run your program\n\n";
    } else if (langId === "javascript" || langId === "nodejs") {
      return "// Initialize variables with const or let\n// Use modern ES6+ syntax when possible\n\n";
    } else if (langId === "c" || langId === "cpp" || langId === "csharp") {
      return "// Include necessary header files\n// Remember to free allocated memory\n\n";
    } else if (langId === "go") {
      return "// Import required packages\n// Define proper error handling\n\n";
    } else if (langId === "shell" || langId === "bash") {
      return "#!/bin/bash\n# Use proper file permissions\n# Handle command errors with proper exit codes\n\n";
    } else {
      return "// Write your code here\n// Follow best practices for this language\n\n";
    }
  };

  // Use instructions if code is empty
  const displayedCode = code.trim() === "" ? getDefaultInstructions() : code;
  if (language.id === "web" && webContent) {
    return <WebCodeEditor html={webContent.html} css={webContent.css} js={webContent.js} onChangeHtml={webContent.onChangeHtml} onChangeCss={webContent.onChangeCss} onChangeJs={webContent.onChangeJs} />;
  }
  return <div className="relative w-full h-full rounded-md bg-code overflow-hidden border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-code border-b border-border">
        <div className="flex items-center">
          <span className="text-sm font-medium text-muted-foreground">
            {language.name}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {language.fileExtension}
          </span>
        </div>
        <div className="flex space-x-1">
          <div className="w-3 h-3 rounded-full bg-code-red"></div>
          <div className="w-3 h-3 rounded-full bg-code-yellow"></div>
          <div className="w-3 h-3 rounded-full bg-code-green"></div>
        </div>
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <textarea value={displayedCode} onChange={e => onChange(e.target.value)} spellCheck={false} className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none scrollbar-thin rounded-none h-full" />
      </div>
    </div>;
};
interface WebCodeEditorProps {
  html: string;
  css: string;
  js: string;
  onChangeHtml: (value: string) => void;
  onChangeCss: (value: string) => void;
  onChangeJs: (value: string) => void;
}
const WebCodeEditor: React.FC<WebCodeEditorProps> = ({
  html,
  css,
  js,
  onChangeHtml,
  onChangeCss,
  onChangeJs
}) => {
  // Default instructions for web languages
  const htmlInstructions = html.trim() === "" ? "<!-- Structure your page with semantic HTML -->\n<!-- Use proper indentation for nested elements -->\n\n" : html;
  const cssInstructions = css.trim() === "" ? "/* Use responsive units (rem, %, etc.) */\n/* Group related styles together */\n\n" : css;
  const jsInstructions = js.trim() === "" ? "// Initialize variables at the top\n// Add event listeners after DOM is loaded\n\n" : js;
  return <div className="relative w-full h-full rounded-md bg-code overflow-hidden border border-border">
      <div className="flex flex-col h-full">
        {/* HTML Panel - Fixed 33.3% height */}
        <div className="h-1/3 min-h-0">
          <div className="flex items-center justify-between px-4 py-2 bg-code border-b border-border">
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2 text-orange-400" />
              <span className="text-sm font-medium text-muted-foreground">
                HTML
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                .html
              </span>
            </div>
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-code-red"></div>
              <div className="w-3 h-3 rounded-full bg-code-yellow"></div>
              <div className="w-3 h-3 rounded-full bg-code-green"></div>
            </div>
          </div>
          <div className="h-[calc(100%-2.5rem)] overflow-auto">
            <textarea className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none scrollbar-thin" value={htmlInstructions} onChange={e => onChangeHtml(e.target.value)} spellCheck={false} />
          </div>
        </div>
        
        {/* CSS Panel - Fixed 33.3% height */}
        <div className="h-1/3 min-h-0 border-t border-border">
          <div className="flex items-center justify-between px-4 py-2 bg-code border-b border-border">
            <div className="flex items-center">
              <FileCode className="w-4 h-4 mr-2 text-blue-400" />
              <span className="text-sm font-medium text-muted-foreground">
                CSS
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                .css
              </span>
            </div>
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-code-red"></div>
              <div className="w-3 h-3 rounded-full bg-code-yellow"></div>
              <div className="w-3 h-3 rounded-full bg-code-green"></div>
            </div>
          </div>
          <div className="h-[calc(100%-2.5rem)] overflow-auto">
            <textarea className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none scrollbar-thin" value={cssInstructions} onChange={e => onChangeCss(e.target.value)} spellCheck={false} />
          </div>
        </div>
        
        {/* JS Panel - Fixed 33.3% height */}
        <div className="h-1/3 min-h-0 border-t border-border">
          <div className="flex items-center justify-between px-4 py-2 bg-code border-b border-border">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-yellow-400" />
              <span className="text-sm font-medium text-muted-foreground">
                JavaScript
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                .js
              </span>
            </div>
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-code-red"></div>
              <div className="w-3 h-3 rounded-full bg-code-yellow"></div>
              <div className="w-3 h-3 rounded-full bg-code-green"></div>
            </div>
          </div>
          <div className="h-[calc(100%-2.5rem)] overflow-auto">
            <textarea className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none scrollbar-thin rounded-none flex-1 w-full h-auto resize-none" value={jsInstructions} onChange={e => onChangeJs(e.target.value)} spellCheck={false} />

          </div>
        </div>
      </div>
    </div>;
};
export default CodeEditor;