
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

const Index = () => {
  const [code, setCode] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>(programmingLanguages[5]); // Default to Python
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleAnalyzeCode = () => {
    if (!code.trim()) {
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
      const result = generateMockAnalysis(code, selectedLanguage.id);
      setAnalysis(result);
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: "Your code has been analyzed successfully.",
      });
    }, 1500);
  };

  const handleApplyCorrection = (correctedCode: string) => {
    setCode(correctedCode);
    toast({
      title: "Correction Applied",
      description: "The improved code has been applied to the editor.",
    });
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
          </div>
          <div className="flex items-center gap-2">
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
        <div className="grid md:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
          {/* Left Column - Code Editor */}
          <div className="flex flex-col space-y-4">
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
                    onSelect={setSelectedLanguage} 
                  />
                </div>
              </div>
              <Separator className="bg-border" />
            </div>
            <div className="flex-1 min-h-0">
              <CodeEditor 
                code={code} 
                language={selectedLanguage} 
                onChange={setCode} 
              />
            </div>
            <div className="flex justify-end">
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

          {/* Right Column - Analysis Display */}
          <div className="flex flex-col space-y-4">
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
            <div className="flex-1 min-h-0">
              <CodeAnalysisDisplay 
                analysis={analysis} 
                onApplyCorrection={handleApplyCorrection} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
