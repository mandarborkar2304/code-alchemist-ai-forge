
import { CodeAnalysis } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, TrendingUp, AlertTriangle } from "lucide-react";

interface AreaOfImprovementsProps {
  analysis: CodeAnalysis;
}

interface Improvement {
  type: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
}

const AreaOfImprovements = ({ analysis }: AreaOfImprovementsProps) => {
  const generateImprovements = (): Improvement[] => {
    const improvements: Improvement[] = [];
    
    // Critical improvements based on violations
    if (analysis.violations.major > 0) {
      improvements.push({
        type: 'critical',
        category: 'Code Quality',
        title: 'Fix Major Violations',
        description: `Resolve ${analysis.violations.major} major code violations that could impact reliability`,
        impact: 'Prevents potential bugs and improves code stability'
      });
    }
    
    // High priority improvements based on metrics
    if (analysis.metrics?.averageFunctionLength > 30) {
      improvements.push({
        type: 'high',
        category: 'Maintainability',
        title: 'Break Down Large Functions',
        description: `Functions average ${Math.round(analysis.metrics.averageFunctionLength)} lines. Consider splitting functions over 30 lines`,
        impact: 'Improves readability and testability'
      });
    }
    
    if (analysis.metrics?.maxNestingDepth > 4) {
      improvements.push({
        type: 'high',
        category: 'Complexity',
        title: 'Reduce Nesting Depth',
        description: `Maximum nesting depth is ${analysis.metrics.maxNestingDepth}. Use early returns or extract methods`,
        impact: 'Reduces cognitive complexity and improves readability'
      });
    }
    
    // Medium priority improvements based on code smells
    if (analysis.codeSmells && analysis.codeSmells.majorCount > 0) {
      const majorSmells = analysis.codeSmells.smells.filter(s => s.severity === 'major');
      const duplicateCode = majorSmells.find(s => s.type === 'duplicate-code');
      const longMethods = majorSmells.find(s => s.type === 'long-method');
      
      if (duplicateCode) {
        improvements.push({
          type: 'medium',
          category: 'Code Quality',
          title: 'Extract Duplicate Code',
          description: 'Duplicate code blocks detected. Extract common logic into reusable functions',
          impact: 'Reduces maintenance burden and ensures consistency'
        });
      }
      
      if (longMethods) {
        improvements.push({
          type: 'medium',
          category: 'Structure',
          title: 'Refactor Long Methods',
          description: 'Some methods are too long. Break them into smaller, focused functions',
          impact: 'Improves method cohesion and single responsibility'
        });
      }
    }
    
    // Complexity-based improvements
    if (analysis.complexityAnalysis?.timeComplexity.notation === 'O(n²)' || 
        analysis.complexityAnalysis?.timeComplexity.notation === 'O(n³)') {
      improvements.push({
        type: 'high',
        category: 'Performance',
        title: 'Optimize Algorithm Complexity',
        description: `Current time complexity is ${analysis.complexityAnalysis.timeComplexity.notation}. Consider more efficient algorithms`,
        impact: 'Significantly improves performance for large inputs'
      });
    }
    
    // Documentation improvements
    if (analysis.metrics?.commentPercentage < 15 && analysis.metrics?.linesOfCode > 50) {
      improvements.push({
        type: 'medium',
        category: 'Documentation',
        title: 'Add Code Documentation',
        description: `Comment density is ${Math.round(analysis.metrics.commentPercentage)}%. Add meaningful comments and documentation`,
        impact: 'Improves code understanding and maintainability'
      });
    }
    
    // Grade-based improvements
    if (analysis.reliability.score === 'D' || analysis.reliability.score === 'C') {
      improvements.push({
        type: 'critical',
        category: 'Reliability',
        title: 'Address Reliability Issues',
        description: 'Code has reliability concerns. Focus on error handling and edge cases',
        impact: 'Prevents runtime errors and improves stability'
      });
    }
    
    if (analysis.maintainability.score === 'D' || analysis.maintainability.score === 'C') {
      improvements.push({
        type: 'high',
        category: 'Maintainability',
        title: 'Improve Code Structure',
        description: 'Code structure needs improvement. Focus on organization and clarity',
        impact: 'Makes code easier to modify and extend'
      });
    }
    
    // Return top 5 most important improvements
    return improvements
      .sort((a, b) => {
        const priority = { critical: 4, high: 3, medium: 2, low: 1 };
        return priority[b.type] - priority[a.type];
      })
      .slice(0, 5);
  };
  
  const improvements = generateImprovements();
  
  const getTypeIcon = (type: Improvement['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <Target className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-yellow-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
    }
  };
  
  const getTypeBadge = (type: Improvement['type']) => {
    const styles = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return (
      <Badge className={styles[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };
  
  if (improvements.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <Lightbulb className="mx-auto h-8 w-8 mb-2 text-green-600" />
            <p className="text-muted-foreground">Great job! No major improvements needed.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-600" />
          Area of Improvements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {improvements.map((improvement, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(improvement.type)}
                  <span className="font-medium text-sm">{improvement.title}</span>
                </div>
                {getTypeBadge(improvement.type)}
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {improvement.description}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="font-medium">Impact:</span>
                  <span>{improvement.impact}</span>
                </div>
              </div>
              
              <Badge variant="outline" className="text-xs">
                {improvement.category}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AreaOfImprovements;
