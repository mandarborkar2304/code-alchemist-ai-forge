
import { CodeAnalysis } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, CheckCircle, Brain, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIRecommendationsProps {
  analysis: CodeAnalysis;
  language: string;
  onApplyCorrection: (code: string) => void;
}

const AIRecommendations = ({ analysis, language, onApplyCorrection }: AIRecommendationsProps) => {
  const handleApplyCorrection = () => {
    if (analysis.correctedCode) {
      onApplyCorrection(analysis.correctedCode);
    }
  };

  const getLanguageSpecificRecommendations = () => {
    const recommendations: string[] = [];
    
    // Language-specific recommendations based on detected issues
    if (language === 'javascript' || language === 'nodejs') {
      if (analysis.violations.major > 0) {
        recommendations.push("Consider using ESLint with strict rules to catch potential issues early");
        recommendations.push("Implement proper error handling with try-catch blocks for async operations");
      }
      
      if (analysis.metrics?.averageFunctionLength > 30) {
        recommendations.push("Break down large functions using the single responsibility principle");
      }
    } else if (language === 'python' || language === 'python3' || language === 'pythonml') {
      if (analysis.violations.major > 0) {
        recommendations.push("Follow PEP 8 style guidelines for better code readability");
        recommendations.push("Use type hints to improve code documentation and IDE support");
      }
      
      if (analysis.codeSmells && analysis.codeSmells.majorCount > 0) {
        recommendations.push("Consider using dataclasses or Pydantic models for better data structure");
      }
    } else if (language === 'java') {
      if (analysis.violations.major > 0) {
        recommendations.push("Follow Java naming conventions and use proper access modifiers");
        recommendations.push("Implement proper exception handling with specific exception types");
      }
      
      if (analysis.metrics?.cyclomaticComplexity > 10) {
        recommendations.push("Apply SOLID principles to reduce complexity and improve maintainability");
      }
    }
    
    // Generic recommendations based on metrics
    if (analysis.metrics?.commentPercentage < 15) {
      recommendations.push("Add meaningful comments and documentation to improve code understanding");
    }
    
    if (analysis.complexityAnalysis?.timeComplexity.notation.includes('O(n²)')) {
      recommendations.push("Consider optimizing algorithms to reduce time complexity");
    }
    
    return recommendations;
  };

  const languageRecommendations = getLanguageSpecificRecommendations();

  return (
    <div className="space-y-4">
      {/* AI-Generated Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            AI-Generated Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{analysis.aiSuggestions}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Language-Specific Recommendations */}
      {languageRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              {language.charAt(0).toUpperCase() + language.slice(1)} Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {languageRecommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded border">
                  <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apply Corrections */}
      {analysis.correctedCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Suggested Code Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              AI has generated improved code based on the detected issues. Review and apply if appropriate.
            </p>
            <Button onClick={handleApplyCorrection} size="sm" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Apply Suggested Improvements
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIRecommendations;
