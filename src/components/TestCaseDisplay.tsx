
import { TestCase } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TestCaseDisplayProps {
  testCases: TestCase[];
}

const TestCaseDisplay: React.FC<TestCaseDisplayProps> = ({ testCases }) => {
  const [expandedCase, setExpandedCase] = useState<number | null>(null);
  
  const toggleExpand = (index: number) => {
    setExpandedCase(expandedCase === index ? null : index);
  };

  const passedCount = testCases.filter(tc => tc.passed).length;
  const totalCount = testCases.length;
  const passRate = Math.round((passedCount / totalCount) * 100);
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Test Cases</h3>
        <div className="flex items-center gap-2">
          <div 
            className="w-full bg-muted h-1.5 rounded-full overflow-hidden"
            style={{ width: '80px' }}
          >
            <div 
              className={cn(
                "h-full transition-all duration-700 ease-out",
                passRate === 100 
                  ? "bg-green-500" 
                  : passRate >= 50 
                    ? "bg-yellow-500" 
                    : "bg-red-500"
              )}
              style={{ width: `${passRate}%` }}
            ></div>
          </div>
          <Badge variant="outline" className="text-xs py-0.5 backdrop-blur">
            <span className="mr-1 font-bold">
              {passedCount}
            </span>
            /
            <span className="ml-1">
              {totalCount}
            </span>
          </Badge>
        </div>
      </div>
      <div className="space-y-2">
        {testCases.map((testCase, index) => (
          <div
            key={index}
            className={cn(
              "rounded-md border transition-all duration-300 animate-fade-in card-futuristic backdrop-blur-sm",
              testCase.passed
                ? "bg-green-950/20 border-green-700/30 hover:border-green-700/50"
                : "bg-red-950/20 border-red-700/30 hover:border-red-700/50",
              expandedCase === index ? "shadow-lg" : ""
            )}
            style={{ 
              animationDelay: `${index * 100}ms`,
              boxShadow: testCase.passed 
                ? expandedCase === index ? '0 0 12px rgba(74, 222, 128, 0.2)' : 'none'
                : expandedCase === index ? '0 0 12px rgba(239, 68, 68, 0.2)' : 'none'
            }}
          >
            <div 
              className="flex justify-between items-center p-3 cursor-pointer"
              onClick={() => toggleExpand(index)}
            >
              <span className="text-xs font-medium flex items-center">
                Test Case #{index + 1}
                {expandedCase !== index && (
                  <span className="ml-2 text-xs opacity-60 hidden sm:inline">
                    {testCase.input.length > 25 
                      ? testCase.input.substring(0, 25) + "..." 
                      : testCase.input}
                  </span>
                )}
              </span>
              <div className="flex items-center">
                {testCase.passed !== undefined && (
                  <div className="flex items-center mr-2">
                    {testCase.passed ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                )}
                <AlertCircle 
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-300",
                    expandedCase === index ? "rotate-180" : ""
                  )} 
                  opacity={0.6} 
                />
              </div>
            </div>
            
            {expandedCase === index && (
              <div className="grid grid-cols-1 gap-2 text-xs p-3 pt-0 border-t border-white/5 animate-fade-in">
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestCaseDisplay;
