
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
    const timer = setTimeout(() => setProgress(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xs font-medium">{value}%</p>
      </div>
      <Progress
        value={progress}
        className="h-2 bg-secondary"
        indicatorClassName={cn("bg-gradient-to-r transition-all duration-500", colorClass)}
      />
    </div>
  );
}
