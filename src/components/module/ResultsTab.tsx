import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trophy, Download, Clock, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QuizAttempt {
  id: string;
  score: number;
  total_questions: number;
  attempt_type: string;
  created_at: string;
}

interface AssignmentSubmission {
  id: string;
  submitted_at: string;
  status: string;
  score: number | null;
  total_marks: number;
  feedback: string | null;
}

interface ResultsTabProps {
  moduleId: string;
  module: any;
  onReload: () => void;
}

const ResultsTab = ({ moduleId, module, onReload }: ResultsTabProps) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([]);

  useEffect(() => {
    loadAttempts();
    loadAssignmentSubmissions();
  }, [moduleId]);

  const loadAttempts = async () => {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("module_id", moduleId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load attempts");
      return;
    }

    setAttempts(data || []);
  };

  const loadAssignmentSubmissions = async () => {
    const { data, error } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("module_id", moduleId)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Failed to load assignment submissions:", error);
      return;
    }

    setAssignmentSubmissions(data || []);
  };

  const downloadCertificate = () => {
    toast.success("Certificate download coming soon!");
  };

  const quizAttempts = attempts.filter((a) => a.attempt_type === "quiz");
  const finalAttempts = attempts.filter((a) => a.attempt_type === "final_test");

  return (
    <div className="space-y-6">
      {/* Module Status */}
      <Card className="shadow-card-custom border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Module Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Status</div>
              <Badge
                variant={module.status === "completed" ? "default" : "secondary"}
                className="text-lg"
              >
                {module.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Final Score</div>
              <div className="text-2xl font-bold">
                {module.final_score !== null ? `${module.final_score}%` : "—"}
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Attempts</div>
              <div className="text-2xl font-bold">{attempts.length + assignmentSubmissions.length}</div>
            </div>
          </div>
          {module.status === "completed" && (
            <Button onClick={downloadCertificate} className="w-full mt-4">
              <Download className="w-4 h-4 mr-2" />
              Download Certificate
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Assignment Submissions */}
      {assignmentSubmissions.length > 0 && (
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Assignment Submissions
            </CardTitle>
            <CardDescription>Track your assignment submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignmentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{new Date(submission.submitted_at).toLocaleString()}</span>
                    </div>
                    {submission.feedback && (
                      <p className="text-sm text-muted-foreground mt-2">{submission.feedback}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <Badge variant={
                      submission.status === "graded" 
                        ? "default" 
                        : submission.status === "submitted" 
                          ? "secondary" 
                          : "outline"
                    }>
                      {submission.status.toUpperCase()}
                    </Badge>
                    {submission.score !== null ? (
                      <span className="text-sm font-medium">
                        {submission.score}/{submission.total_marks} marks
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Awaiting grade</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Test Attempts */}
      {finalAttempts.length > 0 && (
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Final Test History
            </CardTitle>
            <CardDescription>Track your progress on final tests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {finalAttempts.map((attempt) => {
                const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
                return (
                  <div key={attempt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{new Date(attempt.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">
                        {attempt.score}/{attempt.total_questions}
                      </span>
                      <Badge variant={percentage >= 80 ? "default" : "destructive"}>
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Practice Quiz History */}
      {quizAttempts.length > 0 && (
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle>Practice Quiz History</CardTitle>
            <CardDescription>Your practice attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quizAttempts.slice(0, 10).map((attempt) => {
                const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
                return (
                  <div key={attempt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{new Date(attempt.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">
                        {attempt.score}/{attempt.total_questions}
                      </span>
                      <Badge variant="secondary">{percentage}%</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {attempts.length === 0 && assignmentSubmissions.length === 0 && (
        <Card className="shadow-card-custom">
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No attempts yet. Complete assignments, quizzes, or final tests to see results here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResultsTab;
