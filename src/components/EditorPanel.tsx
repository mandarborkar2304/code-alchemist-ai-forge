
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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <Code className="h-5 w-5 mr-2 text-primary" />
            Code Editor
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-48">
            <LanguageSelector 
              languages={programmingLanguages} 
              selected={selectedLanguage} 
              onSelect={handleLanguageChange} 
            />
          </div>
          <Button 
            className="gap-2"
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
      <Separator className="bg-border mb-4" />
      <div className="flex-1 min-h-0">
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
    </div>
  );
};

export default EditorPanel;
