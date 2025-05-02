import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import CodeEditor from "@/components/CodeEditor";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ProgrammingLanguage } from "@/types";
import { Code, Brain, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { programmingLanguages } from "@/data/languages";
import { detectCodeLanguage } from "@/utils/codeExecution";
import { useToast } from "@/hooks/use-toast";
import { CodeAnalysis } from "@/types";
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
  onReset: () => void;
  analysisResults: CodeAnalysis | null;
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
  onReset,
  analysisResults
}: EditorPanelProps) => {
  const {
    toast
  } = useToast();
  const [hasLanguageMismatch, setHasLanguageMismatch] = useState(false);
  useEffect(() => {
    if (code.trim() && selectedLanguage.id !== 'web') {
      const detectedLang = detectCodeLanguage(code);
      if (detectedLang && detectedLang !== selectedLanguage.id) {
        setHasLanguageMismatch(true);
        toast({
          title: "Language Mismatch Detected",
          description: `Selected compiler is ${selectedLanguage.name}, but code appears to be ${detectedLang}. Please verify your input.`,
          variant: "destructive"
        });
      } else {
        setHasLanguageMismatch(false);
      }
    }
  }, [code, selectedLanguage]);
  const handleAnalyzeClick = () => {
    if (hasLanguageMismatch) {
      toast({
        title: "Cannot Analyze Code",
        description: "Please resolve the language mismatch before analyzing.",
        variant: "destructive"
      });
      return;
    }
    onAnalyzeCode();
  };
  const handleLanguageChange = (language: ProgrammingLanguage) => {
    setSelectedLanguage(language);
    setHasLanguageMismatch(false);
  };
  return <div className="flex flex-col h-full">
      <div className="flex justify-between items-center pb-4">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <Code className="h-5 w-5 mr-2 text-primary" />
            Code Editor
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-40">
            <LanguageSelector languages={programmingLanguages} selected={selectedLanguage} onSelect={handleLanguageChange} />
          </div>
          <Button variant="outline" size="sm" className="gap-1 h-8" onClick={onReset}>
            <RefreshCw className="h-3 w-3" />
            Reset
          </Button>
          <Button variant="default" size="sm" disabled={isAnalyzing || hasLanguageMismatch} onClick={handleAnalyzeClick} className="gap-1 h-8 mx-[8px]">
            {isAnalyzing ? <>
                <span className="animate-spin h-3 w-3 border-2 border-t-transparent border-r-transparent rounded-full"></span>
                Analyzing
              </> : <>
                <Brain className="h-3 w-3" />
                Analyze
              </>}
          </Button>
        </div>
      </div>
      <Separator className="bg-border mb-4" />
      <div className="flex-1 min-h-0 h-[calc(100vh-8rem)]">
        <CodeEditor code={code} language={selectedLanguage} onChange={setCode} webContent={selectedLanguage.id === "web" ? {
        html: htmlCode,
        css: cssCode,
        js: jsCode,
        onChangeHtml: setHtmlCode,
        onChangeCss: setCssCode,
        onChangeJs: setJsCode
      } : undefined} />
      </div>
    </div>;
};
export default EditorPanel;