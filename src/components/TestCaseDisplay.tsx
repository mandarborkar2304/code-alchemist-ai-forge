
import { TestCase } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Check, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TestCaseDisplayProps {
  testCases: TestCase[];
}

const TestCaseDisplay: React.FC<TestCaseDisplayProps> = ({ testCases }) => {
  const passedTests = testCases.filter((tc) => tc.passed).length;
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Test Cases</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">
            {passedTests === testCases.length ? 
              "All tests passed" : 
              `${passedTests}/${testCases.length} tests passed`}
          </span>
          <Badge variant="outline" className={cn(
            "text-xs",
            passedTests === testCases.length ? "bg-green-900/20" : "bg-yellow-900/20"
          )}>
            <span className="mr-1 font-bold">
              {passedTests}
            </span>
            /
            <span className="ml-1">
              {testCases.length}
            </span>
          </Badge>
        </div>
      </div>
      <div className="space-y-3">
        {testCases.map((testCase, index) => (
          <div
            key={index}
            className={cn(
              "p-3 rounded-md border",
              testCase.passed
                ? "bg-green-950/20 border-green-700/30"
                : "bg-red-950/20 border-red-700/30"
            )}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium flex items-center">
                Test Case #{index + 1}
                {testCase.executionDetails && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="max-w-xs text-xs">{testCase.executionDetails}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
              {testCase.passed !== undefined && (
                <div className="flex items-center">
                  {testCase.passed ? (
                    <Badge variant="outline" className="bg-green-900/20 border-green-700/30 text-xs px-1.5 py-0 h-5 gap-1">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Passed</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-900/20 border-red-700/30 text-xs px-1.5 py-0 h-5 gap-1">
                      <X className="w-3 h-3 text-red-500" />
                      <span>Failed</span>
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div>
                <span className="font-medium text-muted-foreground">Input:</span>
                <pre className="mt-1 p-2 bg-black/30 rounded overflow-x-auto scrollbar-thin">
                  {testCase.input}
                </pre>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Expected Output:</span>
                <pre className="mt-1 p-2 bg-black/30 rounded overflow-x-auto scrollbar-thin">
                  {testCase.expectedOutput}
                </pre>
              </div>
              {testCase.actualOutput !== undefined && (
                <div>
                  <span className="font-medium text-muted-foreground">Actual Output:</span>
                  <pre className="mt-1 p-2 bg-black/30 rounded overflow-x-auto scrollbar-thin whitespace-pre-wrap">
                    {testCase.actualOutput}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestCaseDisplay;
