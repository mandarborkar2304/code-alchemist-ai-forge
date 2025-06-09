
import { CodeSmellsAnalysis, CodeSmell } from "@/types/complexityTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, Info, Zap, Code, RefreshCw, Trash2 } from "lucide-react";

interface CodeSmellsDisplayProps {
  analysis: CodeSmellsAnalysis;
}

const CodeSmellsDisplay = ({ analysis }: CodeSmellsDisplayProps) => {
  const getSmellIcon = (type: CodeSmell['type']) => {
    switch (type) {
      case 'deep-nesting':
        return <Code className="h-4 w-4 text-orange-600" />;
      case 'long-method':
        return <Zap className="h-4 w-4 text-red-600" />;
      case 'duplicate-code':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'magic-numbers':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unused-variables':
        return <Trash2 className="h-4 w-4 text-gray-600" />;
      case 'dead-code':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: 'major' | 'minor') => {
    return severity === 'major' 
      ? 'bg-red-100 text-red-800 border-red-200'
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const formatSmellType = (type: CodeSmell['type']) => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (analysis.totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="h-4 w-4 text-green-600" />
            Code Smells
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600">
            <Info className="h-4 w-4" />
            <span className="text-sm">No code smells detected! Great job!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Code className="h-4 w-4 text-orange-600" />
          Code Smells ({analysis.totalCount})
        </CardTitle>
        <div className="flex gap-2 pt-2">
          <Badge className="bg-red-100 text-red-800 border-red-200">
            {analysis.majorCount} Major
          </Badge>
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            {analysis.minorCount} Minor
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {Object.entries(analysis.categories).map(([category, smells]) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <span>{category}</span>
                  <Badge variant="outline" className="text-xs">
                    {smells.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {smells.map((smell, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getSmellIcon(smell.type)}
                          <span className="text-sm font-medium">
                            {formatSmellType(smell.type)}
                          </span>
                          {smell.line && (
                            <Badge variant="outline" className="text-xs">
                              Line {smell.line}
                            </Badge>
                          )}
                        </div>
                        <Badge className={getSeverityColor(smell.severity)}>
                          {smell.severity}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {smell.description}
                      </p>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-blue-600">
                          💡 Suggestion:
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {smell.suggestion}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-orange-600">
                          ⚠️ Impact:
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {smell.impact}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default CodeSmellsDisplay;
