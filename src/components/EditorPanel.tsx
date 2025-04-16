
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CodeEditor from "@/components/CodeEditor";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ProgrammingLanguage } from "@/types";
import { Code, Brain } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { programmingLanguages } from "@/data/languages";

interface EditorPanelProps {
  code: string;
  setCode: (code: string) => void;
  selectedLanguage: ProgrammingLanguage;
  setSelectedLanguage: (language: ProgrammingLanguage) => void;
  isAnalyzing: boolean;
  onAnalyzeCode: () => void;
  htmlCode: string;
  setHtmlCode: (html: string) => void;
  cssCode: string;
  setCssCode: (css: string) => void;
  jsCode: string;
  setJsCode: (js: string) => void;
}

const EditorPanel = ({
  code,
  setCode,
  selectedLanguage,
  setSelectedLanguage,
  isAnalyzing,
  onAnalyzeCode,
  htmlCode,
  setHtmlCode,
  cssCode,
  setCssCode,
  jsCode,
  setJsCode,
}: EditorPanelProps) => {
  const handleLanguageChange = (language: ProgrammingLanguage) => {
    setSelectedLanguage(language);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <Code className="h-5 w-5 mr-2 text-primary" />
            Code Editor
          </h2>
          <div className="w-48">
            <LanguageSelector 
              languages={programmingLanguages} 
              selected={selectedLanguage} 
              onSelect={handleLanguageChange} 
            />
          </div>
        </div>
        <Separator className="bg-border" />
      </div>
      <div className="flex-1 min-h-0 mt-2 mb-2">
        <CodeEditor 
          code={code} 
          language={selectedLanguage} 
          onChange={setCode}
          webContent={
            selectedLanguage.id === "web" 
              ? {
                  html: htmlCode,
                  css: cssCode,
                  js: jsCode,
                  onChangeHtml: setHtmlCode,
                  onChangeCss: setCssCode,
                  onChangeJs: setJsCode,
                } 
              : undefined
          }
        />
      </div>
      <div className="flex justify-end">
        <Button 
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/20"
          disabled={isAnalyzing}
          onClick={onAnalyzeCode}
        >
          {isAnalyzing ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-r-transparent rounded-full"></span>
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              Analyze Code
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EditorPanel;
