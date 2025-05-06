
import React, { useState } from "react";
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

// Add the missing interface
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
  const [expandedSection, setExpandedSection] = useState<'major' | 'minor' | null>(null);
  
  // Helper functions for tooltips
  const getComplexityTooltip = () => (
    <p className="max-w-xs">
      A source code complexity that correlates to a number of coding errors.
      <br/><br/>
      <strong>Complexity Ratings:</strong><br/>
      A- Good<br/>
      B- Medium complexity<br/>
      C- High complexity<br/>
      D- Extreme complexity
    </p>
  );

  const getMaintainabilityTooltip = () => (
    <p className="max-w-xs">
      The ability to update or modify the system under test.
      <br/><br/>
      <strong>Maintainability Ratings:</strong><br/>
      A (≥90)- Highly maintainable<br/>
      B (80-89)- Good maintainability<br/>
      C (70-79)- Moderate maintainability<br/>
      D (&lt;70)- Poor maintainability
    </p>
  );

  const getReliabilityTooltip = () => (
    <p className="max-w-xs">
      The ability to perform consistently and handle errors.
      <br/><br/>
      <strong>Reliability Ratings:</strong><br/>
      A- No issues detected<br/>
      B- Minor issues detected<br/>
      C- Major issues detected<br/>
      D- Critical issues detected
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

  // Group violations by type and severity
  const majorViolationTypes = new Map<string, {count: number, examples: string[]}>(); 
  const minorViolationTypes = new Map<string, {count: number, examples: string[]}>();

  // Helper to categorize violations by type
  const categorizeViolation = (issue: string, severity: 'major' | 'minor') => {
    let type = '';
    
    // Determine issue type for grouping
    if (issue.includes('nesting') || issue.includes('Nesting')) {
      type = 'Deep nesting';
    } else if (issue.includes('error handling') || issue.includes('Exception')) {
      type = 'Missing error handling';
    } else if (issue.includes('Magic number') || issue.includes('magic number')) {
      type = 'Magic numbers';
    } else if (issue.includes('variable name') || issue.includes('Variable naming')) {
      type = 'Non-descriptive variable names';
    } else if (issue.includes('Array access') || issue.includes('array access')) {
      type = 'Unsafe array access';
    } else if (issue.includes('null') || issue.includes('Null')) {
      type = 'Null reference risk';
    } else if (issue.includes('division') || issue.includes('Division')) {
      type = 'Division by zero risk';
    } else if (issue.includes('redundant') || issue.includes('inefficient')) {
      type = 'Performance concerns';
    } else if (issue.includes('comment') || issue.includes('Comment')) {
      type = 'Insufficient comments';
    } else if (issue.includes('function') || issue.includes('method')) {
      type = 'Long functions';
    } else {
      // Default to first 3 words for grouping
      type = issue.split(' ').slice(0, 3).join(' ');
    }
    
    const target = severity === 'major' ? majorViolationTypes : minorViolationTypes;
    
    if (!target.has(type)) {
      target.set(type, { count: 1, examples: [issue] });
    } else {
      const current = target.get(type)!;
      current.count++;
      if (current.examples.length < 2) {
        current.examples.push(issue);
      }
    }
  };

  // Categorize all violations
  analysis.violations.lineReferences?.forEach(ref => {
    categorizeViolation(ref.issue, ref.severity);
  });

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
        <CardContent className="p-4">
          <Tabs defaultValue="metrics" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4 bg-muted">
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="violations">Violations</TabsTrigger>
              <TabsTrigger value="feedback">AI Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="space-y-4 min-h-[400px] animate-fade-in">
              {/* Metrics Panel: lines of code, function count, avg function length */}
              <Card className="p-4">
                <CardTitle className="text-sm mb-3 flex items-center">
                  <LineChart className="h-4 w-4 mr-1.5" />
                  Code Metrics
                </CardTitle>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Lines of Code</p>
                    <p className="text-sm font-medium">{analysis.metrics?.linesOfCode}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Function Count</p>
                    <p className="text-sm font-medium">{analysis.metrics?.functionCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Avg Function Length</p>
                    <p className="text-sm font-medium">{analysis.metrics?.averageFunctionLength} lines</p>
                  </div>
                </div>
              </Card>

              {/* Cyclomatic, Maintainability, Reliability Cards */}
              {['cyclomaticComplexity', 'maintainability', 'reliability'].map((metricKey) => {
                const metric = analysis[metricKey as keyof CodeAnalysis] as any;
                const tooltipFn = {
                  cyclomaticComplexity: getComplexityTooltip,
                  maintainability: getMaintainabilityTooltip,
                  reliability: getReliabilityTooltip
                }[metricKey];
                return (
                  <Card key={metricKey}>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm flex items-center">
                          {metricKey === 'cyclomaticComplexity' ? 'Cyclomatic Complexity' :
                           metricKey === 'maintainability' ? 'Maintainability' :
                           'Reliability'}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {tooltipFn()}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardTitle>
                        <Badge className={getRatingColor(metric.score)}>
                          {metric.score}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs flex flex-col">
                        <span className="font-semibold mt-1">Rating: {metric.description}</span>
                        <span className="mt-1">{metric.reason}</span>

                        {metric.issues && metric.issues.length > 0 && (
                          <div className="mt-2">
                            <span className="font-semibold">Issues:</span>
                            <ul className="list-disc list-inside mt-1">
                              {metric.issues.map((issue: string, i: number) => (
                                <li key={i} className="text-xs">{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {metric.improvements && metric.improvements.length > 0 && (
                          <div className="mt-2">
                            <span className="font-semibold">Recommendations:</span>
                            <ul className="list-disc list-inside mt-1">
                              {metric.improvements.map((improvement: string, i: number) => (
                                <li key={i} className="text-xs">{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </TabsContent>
            
            {/* Updated Violations Tab with categorized issues */}
            <TabsContent value="violations" className="space-y-4 min-h-[400px]">
              {/* Major Violations Section */}
              <Alert variant={majorViolationTypes.size > 0 ? "destructive" : "default"}>
                <AlertOctagon className="h-4 w-4" />
                <AlertTitle className="flex justify-between">
                  <span>Major Violations</span>
                  <Badge variant={majorViolationTypes.size > 0 ? "destructive" : "outline"} className="ml-2">
                    {majorViolationTypes.size}
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  {majorViolationTypes.size > 0 ? (
                    <div className="mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-auto text-xs hover:bg-transparent hover:underline mb-2"
                        onClick={() => setExpandedSection(expandedSection === 'major' ? null : 'major')}
                      >
                        {expandedSection === 'major' ? 'Collapse' : 'Expand'} details
                      </Button>
                      
                      {expandedSection === 'major' && (
                        <ul className="mt-2 space-y-1">
                          {Array.from(majorViolationTypes.entries()).map(([type, data], i) => (
                            <li key={i} className="text-sm">
                              <div className="flex items-start gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <div>
                                  <strong>{type}</strong> ({data.count} {data.count === 1 ? 'instance' : 'instances'})
                                  {data.examples.length > 0 && (
                                    <ul className="ml-5 mt-1 list-disc text-xs opacity-90">
                                      {data.examples.map((example, j) => (
                                        <li key={j}>{example}</li>
                                      ))}
                                      {data.count > data.examples.length && (
                                        <li className="italic">...and {data.count - data.examples.length} more</li>
                                      )}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm mt-1">No major violations detected.</p>
                  )}
                </AlertDescription>
              </Alert>
              
              {/* Minor Violations Section */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle className="flex justify-between">
                  <span>Minor Violations</span>
                  <Badge variant="secondary" className="ml-2">
                    {minorViolationTypes.size}
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  {minorViolationTypes.size > 0 ? (
                    <div className="mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-auto text-xs hover:bg-transparent hover:underline mb-2"
                        onClick={() => setExpandedSection(expandedSection === 'minor' ? null : 'minor')}
                      >
                        {expandedSection === 'minor' ? 'Collapse' : 'Expand'} details
                      </Button>
                      
                      {expandedSection === 'minor' && (
                        <ul className="mt-2 space-y-1">
                          {Array.from(minorViolationTypes.entries()).map(([type, data], i) => (
                            <li key={i} className="text-sm">
                              <div className="flex items-start gap-1.5">
                                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <div>
                                  <strong>{type}</strong> ({data.count} {data.count === 1 ? 'instance' : 'instances'})
                                  {data.examples.length > 0 && (
                                    <ul className="ml-5 mt-1 list-disc text-xs opacity-90">
                                      {data.examples.map((example, j) => (
                                        <li key={j}>{example}</li>
                                      ))}
                                      {data.count > data.examples.length && (
                                        <li className="italic">...and {data.count - data.examples.length} more</li>
                                      )}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm mt-1">No minor violations detected.</p>
                  )}
                </AlertDescription>
              </Alert>
              
              {/* Improvement Suggestions Section */}
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">Suggested Improvements</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ul className="space-y-2 text-sm">
                    {majorViolationTypes.size > 0 && (
                      <>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
                          <span>Add error handling with try-catch blocks around risky operations.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
                          <span>Break down deeply nested code blocks into separate helper methods.</span>
                        </li>
                      </>
                    )}
                    {minorViolationTypes.size > 0 && (
                      <>
                        <li className="flex items-start gap-2">
                          <Info className="h-4 w-4 mt-0.5" />
                          <span>Replace magic numbers with named constants for better readability.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Info className="h-4 w-4 mt-0.5" />
                          <span>Add comments to explain complex sections of code.</span>
                        </li>
                      </>
                    )}
                    {majorViolationTypes.size === 0 && minorViolationTypes.size === 0 && (
                      <li className="text-center text-muted-foreground">
                        No specific improvements needed.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Feedback and corrected code */}
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
