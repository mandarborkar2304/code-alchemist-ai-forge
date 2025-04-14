
import React, { useState } from "react";
import { ProgrammingLanguage } from "@/types";

interface CodeEditorProps {
  code: string;
  language: ProgrammingLanguage;
  onChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange }) => {
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
      <div className="relative h-[calc(100%-2.5rem)]">
        <textarea
          className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none scrollbar-thin"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
