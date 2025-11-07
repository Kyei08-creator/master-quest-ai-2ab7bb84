import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ConflictAlertProps {
  conflictedTabs: string[];
  onRefresh: () => void;
  onDismiss: () => void;
}

export const ConflictAlert = ({ conflictedTabs, onRefresh, onDismiss }: ConflictAlertProps) => {
  if (conflictedTabs.length === 0) return null;

  return (
    <Alert variant="default" className="border-info/50 bg-info/5">
      <AlertCircle className="h-4 w-4 text-info" />
      <AlertTitle className="text-info">Sync Conflict Resolved</AlertTitle>
      <AlertDescription className="text-sm space-y-3">
        <div>
          Your local changes to{" "}
          <strong>
            {conflictedTabs.length === 1
              ? conflictedTabs[0]
              : conflictedTabs.length === 2
              ? `${conflictedTabs[0]} and ${conflictedTabs[1]}`
              : `${conflictedTabs.slice(0, -1).join(", ")}, and ${conflictedTabs[conflictedTabs.length - 1]}`}
          </strong>{" "}
          were not saved because a newer version exists from another device.
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            className="gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Latest Version
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
