import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Submission {
  id: string;
  answers: any;
  score: number | null;
  total_marks: number;
  feedback: string | null;
  modules: {
    topic: string;
  };
  profiles: {
    full_name: string;
  };
}

interface GradingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission | null;
  onSubmit: (score: number, feedback: string) => void;
}

export const GradingDialog = ({ open, onOpenChange, submission, onSubmit }: GradingDialogProps) => {
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (submission) {
      setScore(submission.score?.toString() || "");
      setFeedback(submission.feedback || "");
    }
  }, [submission]);

  const handleSubmit = () => {
    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > (submission?.total_marks || 0)) {
      return;
    }
    onSubmit(scoreNum, feedback);
    setScore("");
    setFeedback("");
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Grade Assignment</DialogTitle>
          <DialogDescription>
            {submission.modules.topic} - {submission.profiles.full_name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Student Answers</h3>
              <div className="space-y-4">
                {Object.entries(submission.answers || {}).map(([taskId, answer]) => (
                  <div key={taskId} className="border rounded-lg p-4 bg-muted/50">
                    <p className="font-medium mb-2">Task {taskId}</p>
                    <p className="whitespace-pre-wrap text-sm">{answer as string}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="score">
                  Score (out of {submission.total_marks})
                </Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={submission.total_marks}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="Enter score"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback to the student..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!score}>
            Submit Grade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
