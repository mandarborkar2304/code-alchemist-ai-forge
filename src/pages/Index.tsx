import React from 'react';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CodeEditor from "@/components/CodeEditor";
import { LanguageSelector } from "@/components/LanguageSelector";
import CodeAnalysisDisplay from "@/components/CodeAnalysisDisplay";
import { programmingLanguages } from "@/data/languages";
import { CodeAnalysis, ProgrammingLanguage } from "@/types";
import { generateMockAnalysis } from "@/utils/mockAnalysis";
import { Brain, Code, CodeSquare, Github, Lightbulb, MoonStar, Play, PlusCircle, SunMedium } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

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
    <div className="min-h-screen flex flex-col bg-background text-foreground grid-pattern">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CodeSquare className="h-7 w-7 text-primary animate-pulse-glow" />
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-gradient-primary">Code</span>Alchemist
            </h1>
          </div>
          <p className="hidden md:block text-sm text-muted-foreground">
            Analyze, Fix, and Master Your Code in Real-Time — With AI.
          </p>
          <div className="flex items-center gap-2">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="outline" size="icon" className="glow-effect">
                  <Lightbulb className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 text-yellow-500" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-56 neo-blur border-primary/20">
                <div className="grid gap-1">
                  <h4 className="font-medium">Pro Features Coming Soon</h4>
                  <p className="text-sm text-muted-foreground">
                    Enhanced analysis, custom test cases, and more!
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs border-primary/20 hover:border-primary/50 bg-background glow-effect"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              New Project
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs border-primary/20 hover:border-primary/50 bg-background ml-1 glow-effect"
            >
              <Github className="h-3.5 w-3.5 mr-1.5" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <ResizablePanelGroup 
          direction="horizontal" 
          className="h-[calc(100vh-8rem)] rounded-lg overflow-hidden border border-border futuristic-border"
        >
          {/* Left Panel - Code Editor */}
          <ResizablePanel defaultSize={50} minSize={30} className="bg-black/30">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-3 border-b border-border bg-black/50">
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
              <div className="flex-1 min-h-0 p-3">
                <CodeEditor 
                  code={code} 
                  language={selectedLanguage} 
                  onChange={setCode} 
                />
              </div>
              <div className="flex justify-end p-3 border-t border-border bg-black/50">
                <Button 
                  className="gap-2 glow-effect"
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
          
          <ResizableHandle withHandle className="bg-border/50" />
          
          {/* Right Panel - Analysis Display */}
          <ResizablePanel defaultSize={50} minSize={30} className="bg-black/30">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-3 border-b border-border bg-black/50">
                <h2 className="text-lg font-semibold flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-primary" />
                  AI Analysis
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs glow-effect"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Run Tests
                </Button>
              </div>
              <div className="flex-1 min-h-0 p-3 overflow-y-auto scrollbar-thin">
                <CodeAnalysisDisplay 
                  analysis={analysis} 
                  onApplyCorrection={handleApplyCorrection} 
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      {/* Landing Hero - Shown when no analysis has been done */}
      {!code && !analysis && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="container max-w-3xl text-center animate-fade-in opacity-10 select-none">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 text-muted-foreground/20">
              <span className="text-gradient-primary">Code</span>Alchemist
            </h1>
            <p className="text-2xl text-muted-foreground/10 mb-8 max-w-2xl mx-auto">
              Analyze, Fix, and Master Your Code in Real-Time — With AI
            </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <div className="container max-w-3xl text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient-primary">Transform Your Code</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Analyze, Fix, and Master Your Code in Real-Time — With AI.
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center pointer-events-auto">
                <Button 
                  size="lg" 
                  className="gap-2 glow-effect"
                  onClick={() => {
                    // Set some sample code
                    const sampleCode = `def factorial(n):\n    if n == 0:\n        return 1\n    else:\n        return n * factorial(n-1)\n\nprint(factorial(5))`;
                    setCode(sampleCode);
                    setSelectedLanguage(programmingLanguages[5]); // Python
                  }}
                >
                  <CodeSquare className="h-5 w-5" />
                  Try with Sample Code
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-2 glow-effect"
                  onClick={() => {
                    // Clear code
                    setCode("");
                    setAnalysis(null);
                  }}
                >
                  <Github className="h-5 w-5" />
                  Import from GitHub
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 CodeAlchemist. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Documentation
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                GitHub
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Community
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
