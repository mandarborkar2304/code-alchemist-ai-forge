import { CodeAnalysis } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestCaseDisplay from "./TestCaseDisplay";
import { AlertTriangle, CheckCircle, Code, AlertOctagon, AlertCircle, Info, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CodeQualityMeter } from "./CodeQualityMeter";

interface CodeAnalysisDisplayProps {
  analysis: CodeAnalysis | null;
  onApplyCorrection: (code: string) => void;
}

const getRatingColor = (rating: 'A' | 'B' | 'C' | 'D') => {
  switch (rating) {
    case 'A': return 'bg-green-500';
    case 'B': return 'bg-yellow-500';
    case 'C': return 'bg-orange-500';
    case 'D': return 'bg-red-500';
  }
};

const scoreToPercentage = (rating: 'A' | 'B' | 'C' | 'D'): number => {
  switch (rating) {
    case 'A': return 90;
    case 'B': return 70;
    case 'C': return 50;
    case 'D': return 30;
  }
};

const CodeAnalysisDisplay: React.FC<CodeAnalysisDisplayProps> = ({
  analysis,
  onApplyCorrection,
}) => {
  const getComplexityTooltip = () => (
    <p className="max-w-xs">
      A source code complexity that correlates to a number of coding errors.<br/><br/>
      <strong>Complexity Ratings:</strong><br/>
      A- Good<br/>
      B- Medium complexity<br/>
      C- High complexity<br/>
      D- Extreme complexity
    </p>
  );

  const getMaintainabilityTooltip = () => (
    <p className="max-w-xs">
      The ability to update or modify the system under test.<br/><br/>
      <strong>Maintainability Ratings:</strong><br/>
      A- Low maintainability required<br/>
      B- Medium maintainability required<br/>
      C- High maintainability required<br/>
      D- Extreme maintainability required
    </p>
  );

  const getReliabilityTooltip = () => (
    <p className="max-w-xs">
      The ability to perform consistently as per the specifications and uncover bugs/issues in code.<br/><br/>
      <strong>Reliability Ratings:</strong><br/>
      A- 0 Bugs<br/>
      B- At least 1 Minor Bug<br/>
      C- At least 1 Major Bug<br/>
      D- At least 1 Critical Bug
    </p>
  );

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
          <Tabs defaultValue="metrics" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4 bg-muted">
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="tests">Test Cases</TabsTrigger>
              <TabsTrigger value="feedback">AI Feedback</TabsTrigger>
            </TabsList>
            
            <TabsContent value="metrics" className="space-y-4 min-h-[400px] animate-fade-in">
              <div className="space-y-4">
                {analysis.metrics && (
                  <Card className="p-4">
                    <CardTitle className="text-sm mb-3 flex items-center">
                      <LineChart className="h-4 w-4 mr-1.5" />
                      Code Metrics
                    </CardTitle>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Lines of Code</p>
                        <p className="text-sm font-medium">{analysis.metrics.linesOfCode}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Comment Coverage</p>
                        <p className="text-sm font-medium">{analysis.metrics.commentPercentage.toFixed(1)}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Function Count</p>
                        <p className="text-sm font-medium">{analysis.metrics.functionCount}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Avg Function Length</p>
                        <p className="text-sm font-medium">{analysis.metrics.averageFunctionLength} lines</p>
                      </div>
                    </div>
                  </Card>
                )}
              
                <div className="grid gap-4">
                  <Card>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm flex items-center">
                          Cyclomatic Complexity
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {getComplexityTooltip()}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardTitle>
                        <Badge className={getRatingColor(analysis.cyclomaticComplexity.score)}>
                          {analysis.cyclomaticComplexity.score}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs flex flex-col">
                        <span className="font-semibold mt-1">Rating: {analysis.cyclomaticComplexity.description}</span>
                        <span className="mt-1">{analysis.cyclomaticComplexity.reason}</span>
                        
                        {analysis.cyclomaticComplexity.issues && analysis.cyclomaticComplexity.issues.length > 0 && (
                          <div className="mt-2">
                            <span className="font-semibold">Issues:</span>
                            <ul className="list-disc list-inside mt-1">
                              {analysis.cyclomaticComplexity.issues.map((issue, i) => (
                                <li key={i} className="text-xs">{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {analysis.cyclomaticComplexity.improvements && analysis.cyclomaticComplexity.improvements.length > 0 && (
                          <div className="mt-2">
                            <span className="font-semibold">Recommendations:</span>
                            <ul className="list-disc list-inside mt-1">
                              {analysis.cyclomaticComplexity.improvements.map((improvement, i) => (
                                <li key={i} className="text-xs">{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  
                  <Card>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm flex items-center">
                          Maintainability
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {getMaintainabilityTooltip()}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardTitle>
                        <Badge className={getRatingColor(analysis.maintainability.score)}>
                          {analysis.maintainability.score}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs flex flex-col">
                        <span className="font-semibold mt-1">Rating: {analysis.maintainability.description}</span>
                        <span className="mt-1">{analysis.maintainability.reason}</span>
                        
                        {analysis.maintainability.issues && analysis.maintainability.issues.length > 0 && (
                          <div className="mt-2">
                            <span className="font-semibold">Issues:</span>
                            <ul className="list-disc list-inside mt-1">
                              {analysis.maintainability.issues.map((issue, i) => (
                                <li key={i} className="text-xs">{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {analysis.maintainability.improvements && analysis.maintainability.improvements.length > 0 && (
                          <div className="mt-2">
                            <span className="font-semibold">Recommendations:</span>
                            <ul className="list-disc list-inside mt-1">
                              {analysis.maintainability.improvements.map((improvement, i) => (
                                <li key={i} className="text-xs">{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  
                  <Card>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm flex items-center">
                          Reliability
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {getReliabilityTooltip()}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardTitle>
                        <Badge className={getRatingColor(analysis.reliability.score)}>
                          {analysis.reliability.score}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs flex flex-col">
                        <span className="font-semibold mt-1">Rating: {analysis.reliability.description}</span>
                        <span className="mt-1">{analysis.reliability.reason}</span>
                        
                        {analysis.reliability.issues && analysis.reliability.issues.length > 0 && (
                          <div className="mt-2">
                            <span className="font-semibold">Issues:</span>
                            <ul className="list-disc list-inside mt-1">
                              {analysis.reliability.issues.map((issue, i) => (
                                <li key={i} className="text-xs">{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {analysis.reliability.improvements && analysis.reliability.improvements.length > 0 && (
                          <div className="mt-2">
                            <span className="font-semibold">Recommendations:</span>
                            <ul className="list-disc list-inside mt-1">
                              {analysis.reliability.improvements.map((improvement, i) => (
                                <li key={i} className="text-xs">{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <Alert variant={analysis.violations.major > 0 ? "destructive" : "default"}>
                  <AlertOctagon className="h-4 w-4" />
                  <AlertTitle>Code Violations</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Major Violations:</span>
                        <Badge variant="destructive">{analysis.violations.major}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Minor Violations:</span>
                        <Badge variant="secondary">{analysis.violations.minor}</Badge>
                      </div>
                      {analysis.violations.details.length > 0 && (
                        <ul className="mt-2 space-y-1 text-sm">
                          {analysis.violations.details.map((detail, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {analysis.violations.lineReferences && analysis.violations.lineReferences.length > 0 && (
                        <div className="mt-3">
                          <span className="text-xs font-semibold">Line-specific issues:</span>
                          <ul className="mt-1 space-y-1 text-xs">
                            {analysis.violations.lineReferences.map((ref, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <span className="font-mono">Line {ref.line}:</span> {ref.issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="tests" className="min-h-[400px]">
              <TestCaseDisplay testCases={analysis.testCases} />
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4 min-h-[400px]">
              <div className="space-y-3 h-full">
                <h3 className="text-sm font-medium">AI Code Review</h3>
                <div className="p-3 rounded-md bg-muted border border-border text-sm h-[calc(100vh-400px)] overflow-y-auto whitespace-pre-line markdown">
                  {analysis.aiSuggestions}
                </div>
              </div>

              {analysis.correctedCode && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Improved Code</h3>
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
