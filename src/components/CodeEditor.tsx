
import React, { useState } from "react";
import { ProgrammingLanguage } from "@/types";
import { FileCode, FileText, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange, webContent }) => {
  if (language.id === "web" && webContent) {
    return (
      <WebCodeEditor 
        html={webContent.html}
        css={webContent.css}
        js={webContent.js}
        onChangeHtml={webContent.onChangeHtml}
        onChangeCss={webContent.onChangeCss}
        onChangeJs={webContent.onChangeJs}
      />
    );
  }

  return (
    <div className="relative w-full h-full rounded-md bg-code overflow-hidden border border-border hover:border-primary/50 transition-colors duration-300">
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
      <div className="relative h-[calc(100%-2.5rem)]">
        <textarea
          className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none scrollbar-thin w-full h-full resize-none"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
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
  onChangeJs,
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="relative w-full h-full rounded-md bg-code overflow-hidden border border-border hover:border-primary/50 transition-colors duration-300">
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
            <textarea
              className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none scrollbar-thin"
              value={html}
              onChange={(e) => onChangeHtml(e.target.value)}
              spellCheck={false}
              placeholder={isMobile ? "Enter HTML code..." : "<!DOCTYPE html>\n<html>\n<head>\n  <title>Web Preview</title>\n</head>\n<body>\n  <!-- Your HTML code here -->\n</body>\n</html>"}
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
          <div className="h-[calc(100%-2.5rem)] overflow-auto">
            <textarea
              className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none scrollbar-thin"
              value={css}
              onChange={(e) => onChangeCss(e.target.value)}
              spellCheck={false}
              placeholder={isMobile ? "Enter CSS code..." : "body {\n  /* Your CSS code here */\n}"}
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
          <div className="h-[calc(100%-2.5rem)] overflow-auto">
            <textarea
              className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none scrollbar-thin"
              value={js}
              onChange={(e) => onChangeJs(e.target.value)}
              spellCheck={false}
              placeholder={isMobile ? "Enter JavaScript code..." : "// Your JavaScript code here\ndocument.addEventListener('DOMContentLoaded', function() {\n  // Code here executes when the document is loaded\n});"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
