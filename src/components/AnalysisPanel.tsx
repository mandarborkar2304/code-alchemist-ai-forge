import { CodeAnalysis, ReliabilityIssue } from "@/types";
import CodeAnalysisDisplay from "@/components/CodeAnalysisDisplay";
import { Brain } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { categorizeReliabilityIssues } from "@/utils/codeQualityRatings";

interface AnalysisPanelProps {
  analysis: CodeAnalysis | null;
  onApplyCorrection: (code: string) => void;
}

const AnalysisPanel = ({
  analysis,
  onApplyCorrection
}: AnalysisPanelProps) => {
  // Group reliability issues by category if they exist
  const issueCategories = analysis?.reliability?.issues ? 
    // Check if issues are of type ReliabilityIssue[] or convert if they are strings
    Array.isArray(analysis.reliability.issues) && 
    typeof analysis.reliability.issues[0] === 'string' ?
      // If they're strings, convert them to ReliabilityIssue objects with minimum required properties
      categorizeReliabilityIssues(
        (analysis.reliability.issues as string[]).map(issue => ({
          type: 'minor',
          description: issue,
          impact: 1,
          category: 'readability'
        }))
      ) : 
      // Otherwise use them directly as ReliabilityIssue[]
      categorizeReliabilityIssues(analysis.reliability.issues as ReliabilityIssue[]) 
    : [];

  return (
    <div className="flex flex-col h-full">
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
        />
        
        {issueCategories.length > 0 && (
          <div className="mt-4 p-4 border rounded-md">
            <h3 className="text-md font-medium mb-2">Issue Categories</h3>
            {issueCategories.map((category, idx) => (
              <div key={idx} className="mb-3">
                <h4 className="text-sm font-semibold">{category.name} ({category.issues.length})</h4>
                <ul className="text-sm list-disc pl-5">
                  {category.issues.slice(0, 3).map((issue, i) => (
                    <li key={i} className="text-muted-foreground">
                      {issue.description} {issue.line ? `(line ${issue.line})` : ''} 
                      <span className="text-xs ml-2 opacity-70">
                        Impact: -{issue.impact} points
                      </span>
                    </li>
                  ))}
                  {category.issues.length > 3 && (
                    <li className="text-muted-foreground italic">
                      +{category.issues.length - 3} more issues...
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;
