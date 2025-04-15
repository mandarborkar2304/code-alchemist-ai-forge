
import { CodeAnalysis } from "@/types";
import { CodeQualityMeter } from "./CodeQualityMeter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestCaseDisplay from "./TestCaseDisplay";
import { AlertTriangle, CheckCircle, Code } from "lucide-react";
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
  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Code className="w-12 h-12 text-primary/50 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            Enter your code and hit analyze to see results
          </p>
        </div>
      </div>
    );
  }

  const passedAllTests = analysis.testCases.every((tc) => tc.passed);

  return (
    <div className="space-y-4 h-full overflow-y-auto scrollbar-thin pr-2">
      <Card className="border-border bg-black/20">
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
            <TabsList className="grid grid-cols-3 mb-4 bg-muted">
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="tests">Test Cases</TabsTrigger>
              <TabsTrigger value="feedback">AI Feedback</TabsTrigger>
            </TabsList>
            <TabsContent value="quality" className="space-y-4 animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Code Quality Metrics</h3>
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
                    className="pt-1 border-t border-border"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Code Robustness</h3>
                <div className="space-y-3">
                  <CodeQualityMeter
                    label="Edge Case Handling"
                    value={analysis.robustness}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Feasibility Analysis</h3>
                <div className="space-y-3">
                  <CodeQualityMeter
                    label="Execution Feasibility"
                    value={analysis.feasibility.score}
                  />
                  {analysis.feasibility.issues.length > 0 && (
                    <div className="mt-2 text-xs text-yellow-400">
                      <p className="font-medium mb-1">Issues:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {analysis.feasibility.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tests" className="animate-fade-in">
              <TestCaseDisplay testCases={analysis.testCases} />
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4 animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">AI Suggestions</h3>
                <div className="p-3 rounded-md bg-muted border border-border text-sm">
                  <p className="whitespace-pre-line">{analysis.aiSuggestions}</p>
                </div>
              </div>

              {analysis.correctedCode && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">AI Corrected Code</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-primary/50 hover:bg-primary/10"
                      onClick={() => onApplyCorrection(analysis.correctedCode!)}
                    >
                      Apply Correction
                    </Button>
                  </div>
                  <pre className="p-3 rounded-md bg-code border border-border text-sm overflow-x-auto scrollbar-thin">
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

export default CodeAnalysisDisplay;
