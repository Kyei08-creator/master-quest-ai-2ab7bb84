import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncIndicatorProps {
  syncing: boolean;
  lastAutoSave: Date | null;
  onSync: () => void;
  disabled?: boolean;
}

export const SyncIndicator = ({ syncing, lastAutoSave, onSync, disabled }: SyncIndicatorProps) => {
  return (
    <div className="flex items-center gap-3">
      {lastAutoSave && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in">
          <Cloud className={cn(
            "w-4 h-4 transition-all duration-300",
            syncing && "animate-pulse text-primary"
          )} />
          <span>Last synced: {lastAutoSave.toLocaleTimeString()}</span>
        </div>
      )}
      
      <button
        onClick={onSync}
        disabled={disabled || syncing}
        className={cn(
          "flex items-center gap-2 text-xs px-3 py-1.5 rounded-md transition-all duration-300",
          "bg-primary/10 hover:bg-primary/20 text-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          syncing && "bg-primary/20"
        )}
      >
        <RefreshCw className={cn(
          "w-3.5 h-3.5 transition-transform duration-500",
          syncing && "animate-spin"
        )} />
        <span>{syncing ? "Syncing..." : "Sync Now"}</span>
      </button>
    </div>
  );
};
