
import { CodeAnalysis } from "@/types";
import CodeAnalysisDisplay from "@/components/CodeAnalysisDisplay";
import { Brain, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AnalysisPanelProps {
  analysis: CodeAnalysis | null;
  onApplyCorrection: (code: string) => void;
}

const AnalysisPanel = ({ analysis, onApplyCorrection }: AnalysisPanelProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" />
            AI Analysis
          </h2>
          <Button variant="outline" size="sm" className="text-xs">
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Run Tests
          </Button>
        </div>
        <Separator className="bg-border" />
      </div>
      <div className="flex-1 min-h-0 mt-4 overflow-auto">
        <CodeAnalysisDisplay 
          analysis={analysis} 
          onApplyCorrection={onApplyCorrection} 
        />
      </div>
    </div>
  );
};

export default AnalysisPanel;
