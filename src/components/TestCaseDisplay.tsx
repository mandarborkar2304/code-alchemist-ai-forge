
import { TestCase } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestCaseDisplayProps {
  testCases: TestCase[];
}

const TestCaseDisplay: React.FC<TestCaseDisplayProps> = ({ testCases }) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Test Cases</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <span className="mr-1 font-bold">
              {testCases.filter((tc) => tc.passed).length}
            </span>
            /
            <span className="ml-1">
              {testCases.length}
            </span>
          </Badge>
        </div>
      </div>
      <div className="space-y-2">
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
              <span className="text-xs font-medium">Test Case #{index + 1}</span>
              {testCase.passed !== undefined && (
                <div className="flex items-center">
                  {testCase.passed ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
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
                  <pre className="mt-1 p-2 bg-black/30 rounded overflow-x-auto scrollbar-thin">
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
