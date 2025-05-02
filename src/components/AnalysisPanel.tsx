import { useState } from "react";
import { CodeAnalysis } from "@/types";
import CodeAnalysisDisplay from "@/components/CodeAnalysisDisplay";
import { Brain } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AnalysisPanelProps {
  analysis: CodeAnalysis | null;
  onApplyCorrection: (code: string) => void;
}

const AnalysisPanel = ({
  analysis,
  onApplyCorrection
}: AnalysisPanelProps) => {
  // Legacy View Mode toggle
  const [legacyView, setLegacyView] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end p-2">
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={legacyView}
            onChange={() => setLegacyView(v => !v)}
            className="form-checkbox"
          />
          <span>Legacy View Mode</span>
        </label>
      </div>
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center my-[10px] mx-[5px]">
          <h2 className="text-lg font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" />
            Static Analysis
          </h2>
        </div>
        <Separator className="bg-border" />
      </div>
      <div className="flex-1 min-h-0 mt-4 overflow-auto">
        <CodeAnalysisDisplay
          analysis={analysis}
          onApplyCorrection={onApplyCorrection}
          legacyView={legacyView}
        />
      </div>
    </div>
  );
};

export default AnalysisPanel;