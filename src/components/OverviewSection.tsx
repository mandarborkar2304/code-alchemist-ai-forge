
import { CodeAnalysis } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FileText, GitBranch, TrendingUp, Clock, Database } from "lucide-react";

interface OverviewSectionProps {
  analysis: CodeAnalysis;
}

const OverviewSection = ({ analysis }: OverviewSectionProps) => {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityColor = (notation: string) => {
    switch (notation) {
      case 'O(1)':
      case 'O(log n)':
        return 'text-green-600';
      case 'O(n)':
      case 'O(n log n)':
        return 'text-yellow-600';
      case 'O(n²)':
      case 'O(n³)':
        return 'text-orange-600';
      case 'O(2^n)':
      case 'O(n!)':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quality Metrics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Quality Metrics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="text-xs text-muted-foreground">Overall Grade</div>
              <Badge className={`${getGradeColor(analysis.overallGrade || 'C')} text-lg px-3 py-1`}>
                {analysis.overallGrade || 'C'}
              </Badge>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-xs text-muted-foreground">Reliability</div>
              <Badge className={getGradeColor(analysis.reliability.score)}>
                {analysis.reliability.score}
              </Badge>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-xs text-muted-foreground">Maintainability</div>
              <Badge className={getGradeColor(analysis.maintainability.score)}>
                {analysis.maintainability.score}
              </Badge>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-xs text-muted-foreground">Complexity</div>
              <Badge className={getGradeColor(analysis.cyclomaticComplexity.score)}>
                {analysis.cyclomaticComplexity.score}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Structural Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-600" />
            Structural Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-1">
              <div className="text-2xl font-semibold text-purple-600">
                {analysis.metrics?.linesOfCode || 0}
              </div>
              <div className="text-xs text-muted-foreground">Lines of Code</div>
            </div>
            
            <div className="text-center space-y-1">
              <div className="text-2xl font-semibold text-blue-600">
                {analysis.metrics?.functionCount || 0}
              </div>
              <div className="text-xs text-muted-foreground">Functions</div>
            </div>
            
            <div className="text-center space-y-1">
              <div className="text-2xl font-semibold text-orange-600">
                {Math.round(analysis.metrics?.averageFunctionLength || 0)}
              </div>
              <div className="text-xs text-muted-foreground">Avg Function Length</div>
            </div>
            
            <div className="text-center space-y-1">
              <div className="text-2xl font-semibold text-red-600">
                {analysis.metrics?.cyclomaticComplexity || 0}
              </div>
              <div className="text-xs text-muted-foreground">Cyclomatic Complexity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Complexity */}
      {analysis.complexityAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Performance Complexity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Time Complexity</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`font-mono ${getComplexityColor(analysis.complexityAnalysis.timeComplexity.notation)}`}
                >
                  {analysis.complexityAnalysis.timeComplexity.notation}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Space Complexity</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`font-mono ${getComplexityColor(analysis.complexityAnalysis.spaceComplexity.notation)}`}
                >
                  {analysis.complexityAnalysis.spaceComplexity.notation}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-amber-600" />
            Issues Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-1">
              <div className="text-2xl font-semibold text-red-600">
                {analysis.violations.major}
              </div>
              <div className="text-xs text-muted-foreground">Major Violations</div>
            </div>
            
            <div className="text-center space-y-1">
              <div className="text-2xl font-semibold text-yellow-600">
                {analysis.violations.minor}
              </div>
              <div className="text-xs text-muted-foreground">Minor Violations</div>
            </div>
            
            {analysis.codeSmells && (
              <>
                <div className="text-center space-y-1">
                  <div className="text-2xl font-semibold text-orange-600">
                    {analysis.codeSmells.majorCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Major Code Smells</div>
                </div>
                
                <div className="text-center space-y-1">
                  <div className="text-2xl font-semibold text-amber-600">
                    {analysis.codeSmells.minorCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Minor Code Smells</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewSection;
