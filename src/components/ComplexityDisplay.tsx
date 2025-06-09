
import { ComplexityAnalysis } from "@/types/complexityTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Database, TrendingUp, TrendingDown } from "lucide-react";

interface ComplexityDisplayProps {
  analysis: ComplexityAnalysis;
}

const ComplexityDisplay = ({ analysis }: ComplexityDisplayProps) => {
  const getComplexityColor = (notation: string) => {
    switch (notation) {
      case 'O(1)':
      case 'O(log n)':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'O(n)':
      case 'O(n log n)':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'O(n²)':
      case 'O(n³)':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'O(2^n)':
      case 'O(n!)':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'medium':
        return <TrendingUp className="h-3 w-3 text-yellow-600" />;
      case 'low':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Time Complexity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Time Complexity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={`${getComplexityColor(analysis.timeComplexity.notation)} font-mono`}>
                {analysis.timeComplexity.notation}
              </Badge>
              <div className="flex items-center gap-1">
                {getConfidenceIcon(analysis.timeComplexity.confidence)}
                <span className="text-xs text-muted-foreground">
                  {analysis.timeComplexity.confidence}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {analysis.timeComplexity.description}
            </p>
            
            {analysis.timeComplexity.factors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium">Analysis factors:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {analysis.timeComplexity.factors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-500 mt-1">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Space Complexity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-600" />
              Space Complexity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={`${getComplexityColor(analysis.spaceComplexity.notation)} font-mono`}>
                {analysis.spaceComplexity.notation}
              </Badge>
              <div className="flex items-center gap-1">
                {getConfidenceIcon(analysis.spaceComplexity.confidence)}
                <span className="text-xs text-muted-foreground">
                  {analysis.spaceComplexity.confidence}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {analysis.spaceComplexity.description}
            </p>
            
            {analysis.spaceComplexity.factors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium">Analysis factors:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {analysis.spaceComplexity.factors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-purple-500 mt-1">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComplexityDisplay;
