import React, { useState, useRef, useEffect } from "react";
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
  // Generate language-specific comment placeholders
  const getLanguageSpecificPlaceholder = (langId: string) => {
    if (langId === "python" || langId === "python3" || langId === "pythonml" || langId === "pytorch" || langId === "tensorflow" || langId === "r" || langId === "bash" || langId === "shell") {
      return "# Write/Paste your code here and hit analyze";
    } else if (langId === "html") {
      return "<!-- Write/Paste your code here and hit analyze -->";
    } else if (langId === "css") {
      return "/* Write/Paste your code here and hit analyze */";
    } else if (langId === "web") {
      return "<!-- Write/Paste your code here and hit analyze -->";
    } else if (langId === "lua") {
      return "-- Write/Paste your code here and hit analyze";
    } else {
      // Default for C, C++, C#, Dart, Go, JavaScript, Java, Kotlin, Node.js, Objective-C, Perl, PHP
      return "// Write/Paste your code here and hit analyze";
    }
  };

  // Use placeholder if code is empty
  const displayedCode = code.trim() === "" ? getLanguageSpecificPlaceholder(language.id) : code;
  
  if (language.id === "web" && webContent) {
    return <WebCodeEditor html={webContent.html} css={webContent.css} js={webContent.js} onChangeHtml={webContent.onChangeHtml} onChangeCss={webContent.onChangeCss} onChangeJs={webContent.onChangeJs} />;
  }
  
  return <EnhancedCodeEditor code={displayedCode} onChange={onChange} language={language} />;
};

interface EnhancedCodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language: ProgrammingLanguage;
}

const EnhancedCodeEditor: React.FC<EnhancedCodeEditorProps> = ({ code, onChange, language }) => {
  const [lines, setLines] = useState<string[]>([]);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineCountRef = useRef<HTMLDivElement>(null);
  
  // Update line count when code changes
  useEffect(() => {
    const lineCount = code.split('\n').length;
    const newLines = Array.from({ length: lineCount }, (_, i) => String(i + 1));
    setLines(newLines);
    
    // Sync scroll position between line numbers and code
    if (editorRef.current && lineCountRef.current) {
      const handleScroll = () => {
        if (lineCountRef.current && editorRef.current) {
          lineCountRef.current.scrollTop = editorRef.current.scrollTop;
        }
      };
      
      editorRef.current.addEventListener('scroll', handleScroll);
      return () => {
        editorRef.current?.removeEventListener('scroll', handleScroll);
      };
    }
  }, [code]);
  
  // Handle tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      
      // Insert tab at cursor position
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newValue);
      
      // Move cursor after the inserted tab
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };
  
  return (
    <div className="relative w-full h-full rounded-md bg-code overflow-hidden border border-border">
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
      <div className="relative h-[calc(100%-2.5rem)] flex">
        {/* Line numbers */}
        <div 
          ref={lineCountRef}
          className="bg-code border-r border-border px-2 py-4 text-muted-foreground text-right select-none overflow-hidden"
          style={{ width: '3rem' }}
        >
          {lines.map((line, i) => (
            <div key={i} className="leading-6 text-xs">{line}</div>
          ))}
        </div>
        
        {/* Code editor */}
        <div className="relative flex-1">
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none rounded-none w-full h-full font-mono overflow-y-hidden"
            style={{ 
              resize: 'none',
              tabSize: 2,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              scrollbarWidth: 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
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
  // Language-specific placeholders for web languages
  const htmlPlaceholder = html.trim() === "" ? "<!-- Write/Paste your HTML code here and hit analyze -->" : html;
  const cssPlaceholder = css.trim() === "" ? "/* Write/Paste your CSS code here and hit analyze */" : css;
  const jsPlaceholder = js.trim() === "" ? "// Write/Paste your JavaScript code here and hit analyze" : js;
  
  const [htmlLines, setHtmlLines] = useState<string[]>([]);
  const [cssLines, setCssLines] = useState<string[]>([]);
  const [jsLines, setJsLines] = useState<string[]>([]);
  
  const htmlEditorRef = useRef<HTMLTextAreaElement>(null);
  const cssEditorRef = useRef<HTMLTextAreaElement>(null);
  const jsEditorRef = useRef<HTMLTextAreaElement>(null);
  
  const htmlLineCountRef = useRef<HTMLDivElement>(null);
  const cssLineCountRef = useRef<HTMLDivElement>(null);
  const jsLineCountRef = useRef<HTMLDivElement>(null);

  // Update line counts when code changes
  useEffect(() => {
    const htmlLineCount = htmlPlaceholder.split('\n').length;
    const cssLineCount = cssPlaceholder.split('\n').length;
    const jsLineCount = jsPlaceholder.split('\n').length;
    
    setHtmlLines(Array.from({ length: htmlLineCount }, (_, i) => String(i + 1)));
    setCssLines(Array.from({ length: cssLineCount }, (_, i) => String(i + 1)));
    setJsLines(Array.from({ length: jsLineCount }, (_, i) => String(i + 1)));
    
    // Setup scroll syncing for HTML editor
    if (htmlEditorRef.current && htmlLineCountRef.current) {
      const handleHtmlScroll = () => {
        if (htmlLineCountRef.current && htmlEditorRef.current) {
          htmlLineCountRef.current.scrollTop = htmlEditorRef.current.scrollTop;
        }
      };
      
      htmlEditorRef.current.addEventListener('scroll', handleHtmlScroll);
      return () => {
        htmlEditorRef.current?.removeEventListener('scroll', handleHtmlScroll);
      };
    }
  }, [htmlPlaceholder]);
  
  useEffect(() => {
    // Setup scroll syncing for CSS editor
    if (cssEditorRef.current && cssLineCountRef.current) {
      const handleCssScroll = () => {
        if (cssLineCountRef.current && cssEditorRef.current) {
          cssLineCountRef.current.scrollTop = cssEditorRef.current.scrollTop;
        }
      };
      
      cssEditorRef.current.addEventListener('scroll', handleCssScroll);
      return () => {
        cssEditorRef.current?.removeEventListener('scroll', handleCssScroll);
      };
    }
  }, [cssPlaceholder]);
  
  useEffect(() => {
    // Setup scroll syncing for JS editor
    if (jsEditorRef.current && jsLineCountRef.current) {
      const handleJsScroll = () => {
        if (jsLineCountRef.current && jsEditorRef.current) {
          jsLineCountRef.current.scrollTop = jsEditorRef.current.scrollTop;
        }
      };
      
      jsEditorRef.current.addEventListener('scroll', handleJsScroll);
      return () => {
        jsEditorRef.current?.removeEventListener('scroll', handleJsScroll);
      };
    }
  }, [jsPlaceholder]);
  
  // Handle tab key for indentation in all editors
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, currentValue: string, changeHandler: (value: string) => void) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      
      // Insert tab at cursor position
      const newValue = currentValue.substring(0, start) + '  ' + currentValue.substring(end);
      changeHandler(newValue);
      
      // Move cursor after the inserted tab
      setTimeout(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="relative w-full h-full rounded-md bg-code overflow-hidden border border-border">
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
          <div className="h-[calc(100%-2.5rem)] flex overflow-auto">
            {/* Line numbers */}
            <div 
              ref={htmlLineCountRef}
              className="bg-code border-r border-border px-2 py-4 text-muted-foreground text-right select-none overflow-hidden"
              style={{ width: '3rem' }}
            >
              {htmlLines.map((line, i) => (
                <div key={i} className="leading-6 text-xs">{line}</div>
              ))}
            </div>
            
            {/* HTML editor */}
            <textarea 
              ref={htmlEditorRef}
              className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none flex-1 overflow-y-hidden" 
              value={htmlPlaceholder} 
              onChange={e => onChangeHtml(e.target.value)} 
              onKeyDown={e => handleKeyDown(e, htmlPlaceholder, onChangeHtml)}
              spellCheck={false}
              style={{ 
                resize: 'none',
                tabSize: 2,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontFamily: "'Fira Code', 'Consolas', monospace",
                scrollbarWidth: 'none'
              }}
            />
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
          <div className="h-[calc(100%-2.5rem)] flex overflow-auto">
            {/* Line numbers */}
            <div 
              ref={cssLineCountRef}
              className="bg-code border-r border-border px-2 py-4 text-muted-foreground text-right select-none overflow-hidden"
              style={{ width: '3rem' }}
            >
              {cssLines.map((line, i) => (
                <div key={i} className="leading-6 text-xs">{line}</div>
              ))}
            </div>
            
            {/* CSS editor */}
            <textarea 
              ref={cssEditorRef}
              className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none flex-1 overflow-y-hidden" 
              value={cssPlaceholder} 
              onChange={e => onChangeCss(e.target.value)} 
              onKeyDown={e => handleKeyDown(e, cssPlaceholder, onChangeCss)}
              spellCheck={false}
              style={{ 
                resize: 'none',
                tabSize: 2,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontFamily: "'Fira Code', 'Consolas', monospace",
                scrollbarWidth: 'none'
              }}
            />
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
          <div className="h-[calc(100%-2.5rem)] flex overflow-auto">
            {/* Line numbers */}
            <div 
              ref={jsLineCountRef}
              className="bg-code border-r border-border px-2 py-4 text-muted-foreground text-right select-none overflow-hidden"
              style={{ width: '3rem' }}
            >
              {jsLines.map((line, i) => (
                <div key={i} className="leading-6 text-xs">{line}</div>
              ))}
            </div>
            
            {/* JS editor */}
            <textarea 
              ref={jsEditorRef}
              className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none flex-1 overflow-y-hidden" 
              value={jsPlaceholder} 
              onChange={e => onChangeJs(e.target.value)} 
              onKeyDown={e => handleKeyDown(e, jsPlaceholder, onChangeJs)}
              spellCheck={false}
              style={{ 
                resize: 'none',
                tabSize: 2,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontFamily: "'Fira Code', 'Consolas', monospace",
                scrollbarWidth: 'none'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
