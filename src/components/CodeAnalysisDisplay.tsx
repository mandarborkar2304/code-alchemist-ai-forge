
import { CodeAnalysis } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Code, AlertOctagon, AlertCircle, Info, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  return (
    <div className="space-y-4 h-full overflow-y-auto scrollbar-thin pr-2">
      <Card className="border-border bg-black/20">
        <CardHeader className="p-4">
          <CardTitle className="text-base flex items-center">
            {analysis.overallGrade === 'A' ? (
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
                            <p className="max-w-xs">Source code complexity that correlates to number of coding errors</p>
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
                            <p className="max-w-xs">The ability to update and modify the code under test</p>
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
                            <p className="max-w-xs">The ability to perform consistently as per specifications and uncover bugs/issues</p>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeAnalysisDisplay;
