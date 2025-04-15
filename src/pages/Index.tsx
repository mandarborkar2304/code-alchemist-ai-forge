
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CodeEditor from "@/components/CodeEditor";
import { LanguageSelector } from "@/components/LanguageSelector";
import CodeAnalysisDisplay from "@/components/CodeAnalysisDisplay";
import { programmingLanguages } from "@/data/languages";
import { CodeAnalysis, ProgrammingLanguage } from "@/types";
import { generateMockAnalysis } from "@/utils/mockAnalysis";
import { Brain, Code, CodeSquare, Play, PlusCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import LanguageVersions from "@/components/LanguageVersions";

const Index = () => {
  const [code, setCode] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>(programmingLanguages[5]); // Default to Python
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // States for HTML/CSS/JS
  const [htmlCode, setHtmlCode] = useState<string>("");
  const [cssCode, setCssCode] = useState<string>("");
  const [jsCode, setJsCode] = useState<string>("");

  const handleAnalyzeCode = () => {
    let codeToAnalyze = code;
    
    // If web is selected, concatenate the code
    if (selectedLanguage.id === "web") {
      codeToAnalyze = `HTML:\n${htmlCode}\n\nCSS:\n${cssCode}\n\nJS:\n${jsCode}`;
    }
    
    if (!codeToAnalyze.trim()) {
      toast({
        title: "Empty Code",
        description: "Please enter some code to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      const result = generateMockAnalysis(codeToAnalyze, selectedLanguage.id);
      setAnalysis(result);
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: "Your code has been analyzed successfully.",
      });
    }, 1500);
  };

  const handleApplyCorrection = (correctedCode: string) => {
    // For web, we'd need to parse the corrected code
    if (selectedLanguage.id === "web") {
      // This is a simple parsing implementation and might need refinement
      const htmlMatch = correctedCode.match(/HTML:\n([\s\S]*?)\n\nCSS:/);
      const cssMatch = correctedCode.match(/CSS:\n([\s\S]*?)\n\nJS:/);
      const jsMatch = correctedCode.match(/JS:\n([\s\S]*?)$/);
      
      if (htmlMatch) setHtmlCode(htmlMatch[1]);
      if (cssMatch) setCssCode(cssMatch[1]);
      if (jsMatch) setJsCode(jsMatch[1]);
    } else {
      setCode(correctedCode);
    }
    
    toast({
      title: "Correction Applied",
      description: "The improved code has been applied to the editor.",
    });
  };

  const handleLanguageChange = (language: ProgrammingLanguage) => {
    setSelectedLanguage(language);
    // Reset analysis when language changes
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CodeSquare className="h-7 w-7 text-primary animate-pulse-glow" />
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-gradient-primary">Code</span>Alchemist
            </h1>
            <p className="text-sm text-muted-foreground ml-4">by Mandar Borkar</p>
          </div>
          <div className="flex items-center gap-4">
            <LanguageVersions />
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs border-primary/20 hover:border-primary/50 bg-background"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-8rem)]">
          {/* Code Editor Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
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
              <div className="flex-1 min-h-0 mt-4">
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
                  className="gap-2"
                  disabled={isAnalyzing}
                  onClick={handleAnalyzeCode}
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
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Analysis Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-primary" />
                    AI Analysis
                  </h2>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    Run Tests
                  </Button>
                </div>
                <Separator className="bg-border" />
              </div>
              <div className="flex-1 min-h-0 mt-4 overflow-auto">
                <CodeAnalysisDisplay 
                  analysis={analysis} 
                  onApplyCorrection={handleApplyCorrection} 
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 CodeAlchemist by Mandar Borkar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
