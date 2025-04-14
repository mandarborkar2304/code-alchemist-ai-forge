
import { useState } from "react";
import { TestCase } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TestCaseDisplayProps {
  testCases: TestCase[];
}

const TestCaseDisplay: React.FC<TestCaseDisplayProps> = ({ testCases }) => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const passedCount = testCases.filter(tc => tc.passed).length;
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium flex items-center">
          <span className="inline-block w-3 h-3 rounded-full mr-2 bg-primary"></span>
          Test Cases Results
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(
            "text-xs",
            passedCount === testCases.length 
              ? "bg-green-500/10 text-green-400 border-green-500/30" 
              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
          )}>
            <span className="mr-1 font-bold">
              {passedCount}
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
          <Collapsible 
            key={index} 
            open={openItems.includes(index)}
            onOpenChange={() => toggleItem(index)}
            className={cn(
              "rounded-md border transition-all duration-200 backdrop-blur-sm",
              testCase.passed
                ? "bg-green-950/10 border-green-700/30 hover:border-green-700/50"
                : "bg-red-950/10 border-red-700/30 hover:border-red-700/50"
            )}
          >
            <CollapsibleTrigger className="flex justify-between items-center w-full p-3 text-left">
              <div className="flex items-center">
                {testCase.passed ? (
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <X className="w-4 h-4 text-red-500 mr-2" />
                )}
                <span className="text-xs font-medium">Test Case #{index + 1}</span>
              </div>
              {openItems.includes(index) ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 pt-0 grid grid-cols-1 gap-3 text-xs border-t border-border/50 animate-slide-in">
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
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default TestCaseDisplay;
