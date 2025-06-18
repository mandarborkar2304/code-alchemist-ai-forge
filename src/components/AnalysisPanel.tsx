
import { CodeAnalysis } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CodeAnalysisDisplay from "./CodeAnalysisDisplay";

interface AnalysisPanelProps {
  analysis: CodeAnalysis | null;
  language: string;
  onApplyCorrection: (code: string) => void;
}

const AnalysisPanel = ({ analysis, language, onApplyCorrection }: AnalysisPanelProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Code Analysis Results</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="h-full px-6 pb-6">
          <CodeAnalysisDisplay 
            analysis={analysis} 
            language={language}
            onApplyCorrection={onApplyCorrection} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisPanel;
