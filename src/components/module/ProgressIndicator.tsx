import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  current: number;
  total: number;
  label: string;
  variant?: "sections" | "questions";
}

export const ProgressIndicator = ({ current, total, label, variant = "sections" }: ProgressIndicatorProps) => {
  const percentage = (current / total) * 100;
  const isComplete = current === total;

  return (
    <div className="space-y-3 p-4 bg-card border border-border rounded-lg animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {label}
          </span>
        </div>
        <span className={cn(
          "text-sm font-semibold",
          isComplete ? "text-success" : "text-primary"
        )}>
          {current} / {total}
        </span>
      </div>
      
      <div className="space-y-2">
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {isComplete 
            ? `🎉 All ${variant} completed!` 
            : `${total - current} ${variant} remaining`
          }
        </p>
      </div>
    </div>
  );
};
