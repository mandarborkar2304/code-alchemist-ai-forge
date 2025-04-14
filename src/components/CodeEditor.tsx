
import React, { useState } from "react";
import { ProgrammingLanguage } from "@/types";
import { Code, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeEditorProps {
  code: string;
  language: ProgrammingLanguage;
  onChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange }) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onChange(content);
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code${language.fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full h-full rounded-md overflow-hidden border border-border futuristic-border">
      <div className="flex items-center justify-between px-4 py-2 bg-black/50 border-b border-border">
        <div className="flex items-center">
          <Code className="h-4 w-4 text-primary mr-2" />
          <span className="text-sm font-medium">
            {language.name}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {language.fileExtension}
          </span>
        </div>
        <div className="flex space-x-2">
          <input
            type="file"
            id="codeFile"
            className="hidden"
            accept=".txt,.js,.py,.java,.cpp,.c,.cs,.rb,.php,.html,.css"
            onChange={handleFileUpload}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => document.getElementById('codeFile')?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={handleDownload}
            disabled={!code}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full bg-code-red"></div>
            <div className="w-3 h-3 rounded-full bg-code-yellow"></div>
            <div className="w-3 h-3 rounded-full bg-code-green"></div>
          </div>
        </div>
      </div>
      <div className="relative h-[calc(100%-2.5rem)]">
        <textarea
          className="code-editor-container p-4 bg-code text-code-foreground focus:outline-none scrollbar-thin"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder="// Enter your code here..."
        />
      </div>
    </div>
  );
};

export default CodeEditor;
