
import { CodeAnalysis, ReliabilityIssue } from "@/types";
import CodeAnalysisDisplay from "@/components/CodeAnalysisDisplay";
import { Brain, Clock, HardDrive, AlertTriangle, Lightbulb } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { categorizeReliabilityIssues } from "@/utils/codeQualityRatings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalysisPanelProps {
  analysis: CodeAnalysis | null;
  onApplyCorrection: (code: string) => void;
}

function isReliabilityIssueArray(arr: any[]): arr is ReliabilityIssue[] {
  return arr.length > 0 && typeof arr[0] === "object" && "description" in arr[0];
}

const AnalysisPanel = ({
  analysis,
  onApplyCorrection
}: AnalysisPanelProps) => {
  // Group reliability issues by SonarQube-style categories
  const issueCategories = analysis?.reliability?.issues
    ? Array.isArray(analysis.reliability.issues)
      ? isReliabilityIssueArray(analysis.reliability.issues)
        ? categorizeReliabilityIssues(analysis.reliability.issues)
        : categorizeReliabilityIssues(
            analysis.reliability.issues.map((issue: string) => ({
              type: 'minor',
              description: issue,
              impact: 1,
              category: 'readability',
            }))
          )
      : []
    : [];

  // Mock data for new features (in real implementation, this would come from analysis)
  const complexityData = {
    time: { timeComplexity: 'O(n²)', confidence: 'high', explanation: 'Nested loops detected', factors: ['Double nested loops'] },
    space: { spaceComplexity: 'O(n)', confidence: 'medium', explanation: 'Dynamic array usage', factors: ['Array allocation'] },
    overallScore: 75,
    grade: 'B' as const
  };

  const codeSmells = {
    smells: [
      {
        type: 'Long Method',
        severity: 'Major' as const,
        description: 'Function exceeds 30 lines',
        line: 15,
        suggestion: 'Break into smaller functions',
        category: 'Method' as const
      },
      {
        type: 'Magic Number',
        severity: 'Minor' as const,
        description: 'Magic number 42 found',
        line: 8,
        suggestion: 'Replace with named constant',
        category: 'Naming' as const
      }
    ],
    summary: { total: 2, major: 1, minor: 1, byCategory: { Method: 1, Naming: 1 } },
    score: 85,
    grade: 'B' as const
  };

  const recommendations = {
    recommendations: [
      {
        title: 'Optimize Nested Loops',
        description: 'Consider using more efficient algorithms to reduce O(n²) complexity',
        priority: 'High' as const,
        category: 'Performance' as const,
        actionable: true,
        impact: 'Significant performance improvement'
      },
      {
        title: 'Break Down Large Functions',
        description: 'Extract smaller, focused functions for better maintainability',
        priority: 'Medium' as const,
        category: 'Maintainability' as const,
        actionable: true,
        impact: 'Improves code readability'
      }
    ],
    prioritizedActions: [],
    summary: { total: 2, highPriority: 1, categories: { Performance: 1, Maintainability: 1 } }
  };

  // Calculate the aggregated impact per category for better visibility
  const categoriesWithImpact = issueCategories.map(category => {
    const totalImpact = category.issues.reduce((sum, issue) => sum + (issue.impact || 1), 0);
    return {
      ...category,
      totalImpact
    };
  }).sort((a, b) => b.totalImpact - a.totalImpact);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center my-[10px] mx-[5px]">
          <h2 className="text-lg font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" />
            Enhanced Code Analysis
          </h2>
        </div>
        <Separator className="bg-border" />
      </div>
      
      <div className="flex-1 min-h-0 mt-4 overflow-auto">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="complexity">Complexity</TabsTrigger>
            <TabsTrigger value="smells">Code Smells</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <CodeAnalysisDisplay
              analysis={analysis}
              onApplyCorrection={onApplyCorrection}
            />
          </TabsContent>
          
          <TabsContent value="complexity" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                  <CardTitle className="text-sm font-medium">Time Complexity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{complexityData.time.timeComplexity}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {complexityData.time.explanation}
                  </p>
                  <div className="mt-2">
                    <Badge variant={complexityData.time.confidence === 'high' ? 'default' : 'secondary'}>
                      {complexityData.time.confidence} confidence
                    </Badge>
                  </div>
                  {complexityData.time.factors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium">Factors:</p>
                      <ul className="text-xs list-disc pl-4">
                        {complexityData.time.factors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <HardDrive className="h-4 w-4 mr-2 text-green-500" />
                  <CardTitle className="text-sm font-medium">Space Complexity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{complexityData.space.spaceComplexity}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {complexityData.space.explanation}
                  </p>
                  <div className="mt-2">
                    <Badge variant={complexityData.space.confidence === 'high' ? 'default' : 'secondary'}>
                      {complexityData.space.confidence} confidence
                    </Badge>
                  </div>
                  {complexityData.space.factors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium">Factors:</p>
                      <ul className="text-xs list-disc pl-4">
                        {complexityData.space.factors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Overall Complexity Grade: {complexityData.grade}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${complexityData.overallScore}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Score: {complexityData.overallScore}/100
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="smells" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                <CardTitle className="text-sm font-medium">
                  Code Smells Detected ({codeSmells.summary.total})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Badge variant="destructive">{codeSmells.summary.major} Major</Badge>
                  <Badge variant="secondary">{codeSmells.summary.minor} Minor</Badge>
                </div>
                
                <div className="space-y-3">
                  {codeSmells.smells.map((smell, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">{smell.type}</h4>
                        <Badge variant={smell.severity === 'Major' ? 'destructive' : 'secondary'}>
                          {smell.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {smell.description} {smell.line && `(line ${smell.line})`}
                      </p>
                      <p className="text-xs text-blue-600">
                        💡 {smell.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${codeSmells.score}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Code Smells Score: {codeSmells.score}/100 (Grade {codeSmells.grade})
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                <CardTitle className="text-sm font-medium">
                  Actionable Recommendations ({recommendations.summary.total})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.recommendations.map((rec, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">{rec.title}</h4>
                        <div className="flex gap-2">
                          <Badge variant={
                            rec.priority === 'High' ? 'destructive' : 
                            rec.priority === 'Medium' ? 'default' : 'secondary'
                          }>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline">{rec.category}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {rec.description}
                      </p>
                      <div className="bg-muted rounded p-2">
                        <p className="text-xs font-medium text-green-700">
                          Impact: {rec.impact}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {recommendations.summary.highPriority > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      🚨 {recommendations.summary.highPriority} high-priority recommendation(s) require immediate attention.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="detailed" className="space-y-4">
            {categoriesWithImpact.length > 0 && (
              <div className="p-4 border rounded-md">
                <h3 className="text-md font-medium mb-2">SonarQube-Style Analysis</h3>
                {categoriesWithImpact.map((category, idx) => (
                  <div key={idx} className="mb-3">
                    <h4 className="text-sm font-semibold flex justify-between">
                      <span>{category.name} ({category.issues.length})</span>
                      <span className={`text-xs ${
                        category.totalImpact >= 5 ? 'text-red-500' : 
                        category.totalImpact >= 3 ? 'text-amber-500' : 
                        'text-blue-500'
                      }`}>
                        Impact: -{category.totalImpact} points
                      </span>
                    </h4>
                    <ul className="text-sm list-disc pl-5">
                      {category.issues.slice(0, 3).map((issue, i) => (
                        <li key={i} className="text-muted-foreground">
                          {issue.description} {issue.line ? `(line ${issue.line})` : ''} 
                          <span className={`text-xs ml-2 ${
                            issue.type === 'critical' ? 'text-red-500' : 
                            issue.type === 'major' ? 'text-amber-500' : 
                            'text-blue-500'
                          }`}>
                            {issue.type === 'critical' ? 'Blocker' : 
                             issue.type === 'major' ? 'Major' : 'Minor'}
                          </span>
                        </li>
                      ))}
                      {category.issues.length > 3 && (
                        <li className="text-muted-foreground italic">
                          +{category.issues.length - 3} more issues...
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalysisPanel;
