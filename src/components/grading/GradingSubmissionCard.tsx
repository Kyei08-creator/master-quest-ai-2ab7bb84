import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle } from "lucide-react";

interface Submission {
  id: string;
  submitted_at: string;
  status: string;
  score: number | null;
  total_marks: number;
  modules: {
    topic: string;
  };
  profiles: {
    full_name: string;
  };
}

interface GradingSubmissionCardProps {
  submission: Submission;
  onGrade: (submission: Submission) => void;
}

export const GradingSubmissionCard = ({ submission, onGrade }: GradingSubmissionCardProps) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">{submission.modules.topic}</h3>
              <p className="text-sm text-muted-foreground">
                Student: {submission.profiles.full_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(submission.submitted_at).toLocaleDateString()} at{" "}
                {new Date(submission.submitted_at).toLocaleTimeString()}
              </span>
            </div>
            
            {submission.status === "graded" ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Graded: {submission.score}/{submission.total_marks}
              </Badge>
            ) : (
              <Badge variant="secondary">Pending Review</Badge>
            )}
          </div>
        </div>

        <Button onClick={() => onGrade(submission)} size="sm">
          {submission.status === "graded" ? "Review Grade" : "Grade Assignment"}
        </Button>
      </div>
    </Card>
  );
};
