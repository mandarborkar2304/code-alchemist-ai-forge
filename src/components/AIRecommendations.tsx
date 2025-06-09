
import { CodeAnalysis } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, Sparkles, TrendingUp, Code, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIRecommendationsProps {
  analysis: CodeAnalysis;
  onApplyCorrection: () => void;
}

interface AIInsight {
  type: 'pattern' | 'style' | 'architecture' | 'performance';
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  impact: string;
}

const AIRecommendations = ({ analysis, onApplyCorrection }: AIRecommendationsProps) => {
  const generateAIInsights = (): AIInsight[] => {
    const insights: AIInsight[] = [];
    
    // Pattern-based recommendations
    if (analysis.metrics?.linesOfCode > 100) {
      insights.push({
        type: 'architecture',
        title: 'Consider Modular Architecture',
        description: 'Your code shows good complexity but could benefit from modular design patterns',
        confidence: 'high',
        impact: 'Improves code organization and reusability'
      });
    }
    
    // Style recommendations based on language patterns
    if (analysis.language === 'python' || analysis.language === 'python3') {
      insights.push({
        type: 'style',
        title: 'Pythonic Code Patterns',
        description: 'Consider using list comprehensions and context managers for cleaner Python code',
        confidence: 'medium',
        impact: 'Enhances code readability and Python idioms'
      });
    }
    
    if (analysis.language === 'javascript' || analysis.language === 'nodejs') {
      insights.push({
        type: 'style',
        title: 'Modern JavaScript Features',
        description: 'Leverage ES6+ features like arrow functions, destructuring, and async/await',
        confidence: 'high',
        impact: 'Improves code conciseness and modern standards'
      });
    }
    
    // Performance insights based on complexity
    if (analysis.complexityAnalysis?.timeComplexity.notation.includes('n²') || 
        analysis.complexityAnalysis?.timeComplexity.notation.includes('n³')) {
      insights.push({
        type: 'performance',
        title: 'Algorithm Optimization Opportunity',
        description: 'Consider using hash maps or memoization to reduce time complexity',
        confidence: 'high',
        impact: 'Significant performance improvement for large datasets'
      });
    }
    
    // Code smell-based insights
    if (analysis.codeSmells && analysis.codeSmells.totalCount > 3) {
      insights.push({
        type: 'pattern',
        title: 'Design Pattern Application',
        description: 'Multiple code smells suggest applying design patterns like Strategy or Factory',
        confidence: 'medium',
        impact: 'Reduces code smells and improves maintainability'
      });
    }
    
    return insights.slice(0, 4); // Limit to 4 insights
  };
  
  const insights = generateAIInsights();
  
  const getTypeIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'pattern':
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      case 'style':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'architecture':
        return <Code className="h-4 w-4 text-green-600" />;
      case 'performance':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      default:
        return <Brain className="h-4 w-4 text-gray-600" />;
    }
  };
  
  const getConfidenceBadge = (confidence: AIInsight['confidence']) => {
    const styles = {
      high: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <Badge className={styles[confidence]}>
        {confidence} confidence
      </Badge>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-600" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* AI-Generated Insights */}
          {insights.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">AI-Driven Insights</h4>
              {insights.map((insight, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(insight.type)}
                      <span className="font-medium text-sm">{insight.title}</span>
                    </div>
                    {getConfidenceBadge(insight.confidence)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="font-medium">Impact:</span>
                    <span>{insight.impact}</span>
                  </div>
                  
                  <Badge variant="outline" className="text-xs capitalize">
                    {insight.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          
          {/* Traditional AI Suggestions */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Detailed Analysis</h4>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{analysis.aiSuggestions}</ReactMarkdown>
            </div>
            
            {analysis.correctedCode && (
              <div className="pt-4 border-t">
                <Button onClick={onApplyCorrection} size="sm" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Apply Suggested Improvements
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIRecommendations;
