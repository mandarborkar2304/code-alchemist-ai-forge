
import { CodeAnalysis, ReliabilityIssue } from "@/types";
import CodeAnalysisDisplay from "@/components/CodeAnalysisDisplay";
import { Brain } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { categorizeReliabilityIssues } from "@/utils/codeQualityRatings";

interface AnalysisPanelProps {
  analysis: CodeAnalysis | null;
  onApplyCorrection: (code: string) => void;
}

function isReliabilityIssueArray(arr: any[]): arr is ReliabilityIssue[] {
  return arr.length > 0 && typeof arr[0] === "object" && "description" in arr[0];
}

const AnalysisPanel = ({
  analysis,
  onApplyCorrection
}: AnalysisPanelProps) => {
  // Group reliability issues by SonarQube-style categories
  const issueCategories = analysis?.reliability?.issues
    ? Array.isArray(analysis.reliability.issues)
      ? isReliabilityIssueArray(analysis.reliability.issues)
        ? categorizeReliabilityIssues(analysis.reliability.issues)
        : categorizeReliabilityIssues(
            analysis.reliability.issues.map((issue: string) => ({
              type: 'minor',
              description: issue,
              impact: 1,
              category: 'readability',
            }))
          )
      : []
    : [];

  // Calculate the aggregated impact per category for better visibility
  const categoriesWithImpact = issueCategories.map(category => {
    const totalImpact = category.issues.reduce((sum, issue) => sum + (issue.impact || 1), 0);
    return {
      ...category,
      totalImpact
    };
  }).sort((a, b) => b.totalImpact - a.totalImpact); // Sort by total impact descending

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
        
        {categoriesWithImpact.length > 0 && (
          <div className="mt-4 p-4 border rounded-md">
            <h3 className="text-md font-medium mb-2">SonarQube-Style Analysis</h3>
            {categoriesWithImpact.map((category, idx) => (
              <div key={idx} className="mb-3">
                <h4 className="text-sm font-semibold flex justify-between">
                  <span>{category.name} ({category.issues.length})</span>
                  <span className={`text-xs ${
                    category.totalImpact >= 5 ? 'text-red-500' : 
                    category.totalImpact >= 3 ? 'text-amber-500' : 
                    'text-blue-500'
                  }`}>
                    Impact: -{category.totalImpact} points
                  </span>
                </h4>
                <ul className="text-sm list-disc pl-5">
                  {category.issues.slice(0, 3).map((issue, i) => (
                    <li key={i} className="text-muted-foreground">
                      {issue.description} {issue.line ? `(line ${issue.line})` : ''} 
                      <span className={`text-xs ml-2 ${
                        issue.type === 'critical' ? 'text-red-500' : 
                        issue.type === 'major' ? 'text-amber-500' : 
                        'text-blue-500'
                      }`}>
                        {issue.type === 'critical' ? 'Blocker' : 
                         issue.type === 'major' ? 'Major' : 'Minor'}
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
