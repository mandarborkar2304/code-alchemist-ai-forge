import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { Improvement } from "@/types";

interface AreaOfImprovementsProps {
  improvements: Improvement[];
}

const AreaOfImprovements = ({ improvements }: AreaOfImprovementsProps) => {
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

  if (!improvements || improvements.length === 0) {
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
          Areas of Improvement
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
