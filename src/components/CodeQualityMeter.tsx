
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CodeQualityMeterProps {
  label: string;
  value: number;
  className?: string;
}

const getColorClass = (value: number) => {
  if (value < 40) return "from-red-500 to-red-600";
  if (value < 70) return "from-yellow-500 to-yellow-600";
  return "from-green-500 to-green-600";
};

export function CodeQualityMeter({ label, value, className }: CodeQualityMeterProps) {
  const [progress, setProgress] = useState(0);
  const colorClass = getColorClass(value);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 300); // Delay for animation effect
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={cn("space-y-1.5 transition-opacity duration-300", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xs font-medium">{progress}%</p>
      </div>
      <Progress
        value={progress}
        className="h-2 bg-secondary/50 backdrop-blur-sm"
        indicatorClassName={cn("bg-gradient-to-r transition-all duration-700 ease-out", colorClass)}
      />
      
      {/* Glow effect underneath for emphasis */}
      <div 
        className={cn(
          "h-[1px] w-full mt-0.5 opacity-40 transition-all duration-700",
          progress > 70 ? "bg-green-500/30" : progress > 40 ? "bg-yellow-500/30" : "bg-red-500/30"
        )}
        style={{ 
          width: `${progress}%`,
          boxShadow: progress > 70 
            ? '0 0 8px rgba(74, 222, 128, 0.5)' 
            : progress > 40 
              ? '0 0 8px rgba(234, 179, 8, 0.5)' 
              : '0 0 8px rgba(239, 68, 68, 0.5)',
        }}
      />
    </div>
  );
}
