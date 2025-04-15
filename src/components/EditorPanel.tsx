
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CodeEditor from "@/components/CodeEditor";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ProgrammingLanguage } from "@/types";
import { Code, Brain, Zap } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { programmingLanguages } from "@/data/languages";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";

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
  
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {isMobile ? (
        <Collapsible
          open={!isCollapsed}
          onOpenChange={(open) => setIsCollapsed(!open)}
          className="w-full"
        >
          <div className="flex justify-between items-center mb-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                <h2 className="text-lg font-semibold flex items-center">
                  <Code className="h-5 w-5 mr-2 text-primary animate-pulse-glow" />
                  Code Editor
                  <Zap className={`h-4 w-4 ml-2 text-primary transition-opacity duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-50'}`} />
                </h2>
              </Button>
            </CollapsibleTrigger>
            <div className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'} ${isCollapsed ? 'invisible' : 'visible'}`}>
              <LanguageSelector 
                languages={programmingLanguages} 
                selected={selectedLanguage} 
                onSelect={handleLanguageChange} 
              />
            </div>
          </div>

          <Separator className="bg-border mb-4" />

          <CollapsibleContent className="transition-all">
            <div className="flex-1 min-h-0 mb-4">
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
            <div className="flex justify-end mt-2">
              <Button 
                className="gap-2 glow-effect"
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
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center">
              <Code className="h-5 w-5 mr-2 text-primary animate-pulse-glow" />
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
          <Separator className="bg-border mt-2 mb-4" />
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
          <div className="flex justify-end mt-4">
            <Button 
              className="gap-2 glow-effect"
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
        </>
      )}
    </div>
  );
};

export default EditorPanel;
