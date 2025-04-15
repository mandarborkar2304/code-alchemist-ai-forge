
import { useState } from "react";
import { CodeAnalysis } from "@/types";
import CodeAnalysisDisplay from "@/components/CodeAnalysisDisplay";
import { Brain, Play, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";

interface AnalysisPanelProps {
  analysis: CodeAnalysis | null;
  onApplyCorrection: (code: string) => void;
}

const AnalysisPanel = ({ analysis, onApplyCorrection }: AnalysisPanelProps) => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {isMobile ? (
        <Collapsible
          open={!isCollapsed}
          onOpenChange={(open) => setIsCollapsed(!open)}
          className="w-full"
        >
          <div className="flex justify-between items-center mb-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                <h2 className="text-lg font-semibold flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-primary animate-pulse-glow" />
                  AI Analysis
                  <Sparkles className={`h-4 w-4 ml-2 text-primary transition-opacity duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-50'}`} />
                </h2>
              </Button>
            </CollapsibleTrigger>
            <div className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'} ${isCollapsed ? 'invisible' : 'visible'}`}>
              <Button variant="outline" size="sm" className="text-xs glow-effect">
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Run Tests
              </Button>
            </div>
          </div>

          <Separator className="bg-border mb-4" />

          <CollapsibleContent className="transition-all">
            <div className="flex-1 min-h-0 overflow-auto">
              <CodeAnalysisDisplay 
                analysis={analysis} 
                onApplyCorrection={onApplyCorrection} 
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center">
              <Brain className="h-5 w-5 mr-2 text-primary animate-pulse-glow" />
              AI Analysis
            </h2>
            <Button variant="outline" size="sm" className="text-xs glow-effect">
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Run Tests
            </Button>
          </div>
          <Separator className="bg-border mt-2 mb-4" />
          <div className="flex-1 min-h-0 overflow-auto">
            <CodeAnalysisDisplay 
              analysis={analysis} 
              onApplyCorrection={onApplyCorrection} 
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AnalysisPanel;
