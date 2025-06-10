
import { useState } from "react";
import { CodeAnalysis, ProgrammingLanguage } from "@/types";
import { generateMockAnalysis } from "@/utils/mockAnalysis";
import { programmingLanguages } from "@/data/languages";
import { useToast } from "@/hooks/use-toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

// Import the components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EditorPanel from "@/components/EditorPanel";
import AnalysisPanel from "@/components/AnalysisPanel";

const Editor = () => {
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

  const handleReset = () => {
    setCode("");
    setHtmlCode("");
    setCssCode("");
    setJsCode("");
    setAnalysis(null);
    toast({
      title: "Editor Reset",
      description: "All code and analysis have been cleared.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-2">
        <ResizablePanelGroup 
          direction="horizontal" 
          className="h-[calc(100vh-5rem)] border-none"
        >
          <ResizablePanel defaultSize={50} minSize={30}>
            <EditorPanel
              code={code}
              setCode={setCode}
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
              isAnalyzing={isAnalyzing}
              onAnalyzeCode={handleAnalyzeCode}
              htmlCode={htmlCode}
              setHtmlCode={setHtmlCode}
              cssCode={cssCode}
              setCssCode={setCssCode}
              jsCode={jsCode}
              setJsCode={setJsCode}
              onReset={handleReset}
              analysisResults={analysis}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={50} minSize={30}>
            <AnalysisPanel 
              analysis={analysis} 
              language={selectedLanguage.id}
              onApplyCorrection={handleApplyCorrection} 
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
      
      <Footer />
    </div>
  );
};

export default Editor;
