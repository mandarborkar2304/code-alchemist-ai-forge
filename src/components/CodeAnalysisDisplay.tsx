
import { useEffect, useState } from "react";
import { CodeAnalysis } from "@/types";
import { CodeQualityMeter } from "./CodeQualityMeter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestCaseDisplay from "./TestCaseDisplay";
import { AlertTriangle, CheckCircle, Code, Eye, EyeOff, Terminal, Flask, PenSquare, Layers, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeAnalysisDisplayProps {
  analysis: CodeAnalysis | null;
  onApplyCorrection: (code: string) => void;
}

const CodeAnalysisDisplay: React.FC<CodeAnalysisDisplayProps> = ({
  analysis,
  onApplyCorrection,
}) => {
  const [showingCorrectedCode, setShowingCorrectedCode] = useState(false);

  useEffect(() => {
    // Reset view when analysis changes
    setShowingCorrectedCode(false);
  }, [analysis]);

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md animate-fade-in">
          <Code className="w-12 h-12 text-primary/50 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Start Your Code Analysis</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Enter your code in the editor and hit analyze to see comprehensive AI feedback, quality metrics, and suggested improvements.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Terminal className="w-8 h-8 text-primary/70 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Feasibility Check</p>
            </div>
            <div className="text-center">
              <Flask className="w-8 h-8 text-primary/70 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Test Case Execution</p>
            </div>
            <div className="text-center">
              <Bot className="w-8 h-8 text-primary/70 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">AI Code Corrections</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const passedAllTests = analysis.testCases.every((tc) => tc.passed);

  return (
    <div className="space-y-4 h-full overflow-y-auto scrollbar-thin pr-2 animate-fade-in">
      {/* Feasibility Card */}
      <Card className="border-border card-gradient">
        <CardHeader className="p-4">
          <CardTitle className="text-base flex items-center">
            {analysis.feasibility.score >= 70 ? (
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            )}
            Code Execution Feasibility
          </CardTitle>
          <CardDescription className="text-xs">
            {analysis.feasibility.score >= 90 
              ? "Your code is ready for execution without issues." 
              : analysis.feasibility.score >= 70
              ? "Your code can run with minor adjustments."
              : "Your code needs significant changes to execute properly."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <CodeQualityMeter
            label="Execution Feasibility"
            value={analysis.feasibility.score}
          />
          
          {analysis.feasibility.issues.length > 0 && (
            <div className="mt-4 text-sm bg-black/30 rounded-md p-3 border border-border">
              <p className="font-medium mb-2 text-xs">Issues to Address:</p>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-muted-foreground">
                {analysis.feasibility.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Analysis Tabs */}
      <Card className="border-border card-gradient">
        <CardHeader className="p-4">
          <CardTitle className="text-base flex items-center">
            {passedAllTests ? (
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            )}
            Code Analysis Results
          </CardTitle>
          <CardDescription className="text-xs flex items-center justify-between">
            <span>Analysis completed</span>
            <span className="font-mono text-muted-foreground">
              {new Date().toLocaleTimeString()}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Tabs defaultValue="quality" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4 bg-black/30">
              <TabsTrigger value="quality" className="data-[state=active]:bg-primary/20">
                <Layers className="h-4 w-4 mr-2" />
                Quality
              </TabsTrigger>
              <TabsTrigger value="tests" className="data-[state=active]:bg-primary/20">
                <Flask className="h-4 w-4 mr-2" />
                Tests
              </TabsTrigger>
              <TabsTrigger value="feedback" className="data-[state=active]:bg-primary/20">
                <PenSquare className="h-4 w-4 mr-2" />
                Feedback
              </TabsTrigger>
              <TabsTrigger value="fixed" className="data-[state=active]:bg-primary/20">
                <Bot className="h-4 w-4 mr-2" />
                AI Fix
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quality" className="space-y-4 animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center">
                  <Layers className="h-4 w-4 mr-2 text-primary" />
                  Code Quality Metrics
                </h3>
                <div className="space-y-3">
                  <CodeQualityMeter
                    label="Readability"
                    value={analysis.codeQuality.readability}
                  />
                  <CodeQualityMeter
                    label="Structure"
                    value={analysis.codeQuality.structure}
                  />
                  <CodeQualityMeter
                    label="Naming Conventions"
                    value={analysis.codeQuality.naming}
                  />
                  <CodeQualityMeter
                    label="Efficiency"
                    value={analysis.codeQuality.efficiency}
                  />
                  <CodeQualityMeter
                    label="Overall Quality"
                    value={analysis.codeQuality.overall}
                    className="pt-3 border-t border-border"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-primary" />
                  Code Robustness
                </h3>
                <div className="space-y-3">
                  <CodeQualityMeter
                    label="Edge Case Handling"
                    value={analysis.robustness}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tests" className="animate-fade-in">
              <TestCaseDisplay testCases={analysis.testCases} />
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4 animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center">
                  <PenSquare className="h-4 w-4 mr-2 text-primary" />
                  AI Suggestions
                </h3>
                <div className="p-3 rounded-md bg-black/30 border border-border text-sm">
                  <p className="whitespace-pre-line">{analysis.aiSuggestions}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fixed" className="space-y-4 animate-fade-in">
              {analysis.correctedCode && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium flex items-center">
                      <Bot className="h-4 w-4 mr-2 text-primary" />
                      AI Corrected Code
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-primary/30 hover:bg-primary/10 glow-effect"
                        onClick={() => onApplyCorrection(analysis.correctedCode!)}
                      >
                        Apply Correction
                      </Button>
                    </div>
                  </div>
                  <pre className="p-4 rounded-md bg-code border border-border text-sm overflow-x-auto scrollbar-thin">
                    <code className="text-code-foreground">{analysis.correctedCode}</code>
                  </pre>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Create a simple Shield icon since it's missing
const Shield = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default CodeAnalysisDisplay;
