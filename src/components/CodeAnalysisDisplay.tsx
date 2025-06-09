import { CodeAnalysis, ReliabilityIssue } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, Info, XCircle, Lightbulb, TestTube, Code2, BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import TestCaseDisplay from "./TestCaseDisplay";
import { CodeQualityMeter } from "./CodeQualityMeter";
import OverviewSection from "./OverviewSection";
import ComplexityDisplay from "./ComplexityDisplay";
import CodeSmellsDisplay from "./CodeSmellsDisplay";
import AreaOfImprovements from "./AreaOfImprovements";

interface CodeAnalysisDisplayProps {
  analysis: CodeAnalysis | null;
  onApplyCorrection: (code: string) => void;
}

const CodeAnalysisDisplay = ({ analysis, onApplyCorrection }: CodeAnalysisDisplayProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Code2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No analysis available. Submit your code to get detailed insights.</p>
        </div>
      </div>
    );
  }

  const handleApplyCorrection = () => {
    if (analysis.correctedCode) {
      onApplyCorrection(analysis.correctedCode);
    }
  };

  // Helper function to format issues
  const formatIssues = (issues: string[] | ReliabilityIssue[] | undefined) => {
    if (!issues) return "No issues found.";

    return issues.map((issue, index) => {
      if (typeof issue === 'string') {
        return (
          <li key={index} className="text-sm">
            {issue}
          </li>
        );
      } else {
        return (
          <li key={index} className="text-sm">
            {issue.description} (Impact: {issue.impact})
          </li>
        );
      }
    });
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="violations" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Violations
          </TabsTrigger>
          <TabsTrigger value="complexity" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Complexity
          </TabsTrigger>
          <TabsTrigger value="smells" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Code Smells
          </TabsTrigger>
          <TabsTrigger value="tests" className="text-xs">
            <TestTube className="h-3 w-3 mr-1" />
            Tests
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-4 overflow-auto">
          <TabsContent value="overview" className="mt-0">
            <OverviewSection analysis={analysis} />
          </TabsContent>

          <TabsContent value="violations" className="mt-0">
            <div className="space-y-4">
              {/* Violations Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Violations Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        {analysis.violations.major} Major
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        {analysis.violations.minor} Minor
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Violations Details */}
              {analysis.violations.details.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Detailed Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.violations.details.map((detail, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 rounded border">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Line References */}
              {analysis.violations.lineReferences && analysis.violations.lineReferences.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Line-by-Line Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.violations.lineReferences.map((ref, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 rounded border">
                          <Badge variant="outline" className="text-xs">
                            Line {ref.line}
                          </Badge>
                          <Badge className={ref.severity === 'major' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {ref.severity}
                          </Badge>
                          <span className="text-sm">{ref.issue}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="complexity" className="mt-0">
            {analysis.complexityAnalysis ? (
              <ComplexityDisplay analysis={analysis.complexityAnalysis} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Complexity analysis not available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="smells" className="mt-0">
            {analysis.codeSmells ? (
              <CodeSmellsDisplay analysis={analysis.codeSmells} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Code smells analysis not available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tests" className="mt-0">
            <div className="space-y-4">
              <TestCaseDisplay testCases={analysis.testCases} />
              
              {/* Area of Improvements */}
              <AreaOfImprovements analysis={analysis} />
              
              {/* AI Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{analysis.aiSuggestions}</ReactMarkdown>
                  </div>
                  
                  {analysis.correctedCode && (
                    <div className="mt-4 pt-4 border-t">
                      <Button onClick={handleApplyCorrection} size="sm" className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Apply Suggested Improvements
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default CodeAnalysisDisplay;
