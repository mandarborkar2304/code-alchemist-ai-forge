
import React, { useState, useRef, useEffect } from "react";
import { ProgrammingLanguage } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileCode, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface CodeFile {
  id: string;
  name: string;
  language: ProgrammingLanguage;
  content: string;
}

interface TabsCodeEditorProps {
  files: CodeFile[];
  onFileContentChange: (fileId: string, newContent: string) => void;
  onRemoveFile?: (fileId: string) => void;
  activeFileId: string;
  onActiveFileChange: (fileId: string) => void;
}

const TabsCodeEditor: React.FC<TabsCodeEditorProps> = ({
  files,
  onFileContentChange,
  onRemoveFile,
  activeFileId,
  onActiveFileChange,
}) => {
  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-code text-muted-foreground">
        <p>No files to display</p>
      </div>
    );
  }

  const activeFile = files.find(file => file.id === activeFileId) || files[0];

  return (
    <Tabs
      value={activeFileId}
      onValueChange={onActiveFileChange}
      className="h-full flex flex-col"
    >
      <div className="px-1 border-b border-border bg-code">
        <TabsList className="h-10 bg-code w-full flex overflow-x-auto scrollbar-thin">
          {files.map((file) => (
            <TabsTrigger
              key={file.id}
              value={file.id}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 data-[state=active]:bg-muted",
                file.id === activeFileId ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <FileCode className="h-4 w-4" />
              <span>{file.name}</span>
              {onRemoveFile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 rounded-full hover:bg-destructive/20 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(file.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="flex-1">
        {files.map((file) => (
          <TabsContent
            key={file.id}
            value={file.id}
            className="h-full data-[state=active]:flex data-[state=inactive]:hidden"
          >
            <CodeEditorWithLineNumbers
              code={file.content}
              language={file.language}
              onChange={(newContent) => onFileContentChange(file.id, newContent)}
            />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};

interface CodeEditorWithLineNumbersProps {
  code: string;
  language: ProgrammingLanguage;
  onChange: (value: string) => void;
}

const CodeEditorWithLineNumbers: React.FC<CodeEditorWithLineNumbersProps> = ({
  code,
  language,
  onChange,
}) => {
  const [lines, setLines] = useState<string[]>([]);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineCountRef = useRef<HTMLDivElement>(null);
  
  // Update line numbers when code changes
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
    <div className="relative w-full h-full flex flex-col bg-code overflow-hidden">
      <div className="px-4 py-2 bg-muted flex items-center justify-between border-b border-border text-sm font-medium text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="text-sm">{language.name}</span>
          <span className="text-xs opacity-50">{language.fileExtension}</span>
        </div>
        <div className="flex space-x-1">
          <div className="w-3 h-3 rounded-full bg-code-red"></div>
          <div className="w-3 h-3 rounded-full bg-code-yellow"></div>
          <div className="w-3 h-3 rounded-full bg-code-green"></div>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
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
        <textarea
          ref={editorRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="p-4 bg-code text-code-foreground focus:outline-none scrollbar-thin flex-1"
          style={{ 
            resize: 'none',
            tabSize: 2,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            fontFamily: "'Fira Code', 'Consolas', monospace"
          }}
        />
      </div>
    </div>
  );
};

export default TabsCodeEditor;
