import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GradingSubmissionCard } from "@/components/grading/GradingSubmissionCard";
import { GradingDialog } from "@/components/grading/GradingDialog";

interface Submission {
  id: string;
  module_id: string;
  assignment_id: string;
  answers: any;
  submitted_at: string;
  status: string;
  score: number | null;
  total_marks: number;
  feedback: string | null;
  modules: {
    topic: string;
    user_id: string;
  };
  profiles: {
    full_name: string;
  };
}

export default function Grading() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInstructor, setIsInstructor] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradingOpen, setGradingOpen] = useState(false);

  useEffect(() => {
    checkInstructorRole();
  }, []);

  const checkInstructorRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasInstructorRole = roles?.some(r => r.role === "instructor" || r.role === "admin");
    
    if (!hasInstructorRole) {
      toast.error("Access denied. Instructor role required.");
      navigate("/");
      return;
    }

    setIsInstructor(true);
    loadSubmissions();
  };

  const loadSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("assignment_submissions")
      .select(`
        id,
        module_id,
        assignment_id,
        answers,
        submitted_at,
        status,
        score,
        total_marks,
        feedback,
        modules!assignment_submissions_module_id_fkey(topic, user_id, profiles!modules_user_id_fkey(full_name))
      `)
      .order("submitted_at", { ascending: false });

    if (error) {
      toast.error("Failed to load submissions");
      console.error(error);
    } else {
      const formatted = data?.map(item => ({
        ...item,
        modules: {
          topic: (item.modules as any)?.topic || "",
          user_id: (item.modules as any)?.user_id || ""
        },
        profiles: {
          full_name: (item.modules as any)?.profiles?.full_name || "Unknown"
        }
      })) || [];
      setSubmissions(formatted as any);
    }
    setLoading(false);
  };

  const handleGrade = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradingOpen(true);
  };

  const handleGradeSubmit = async (score: number, feedback: string) => {
    if (!selectedSubmission) return;

    const { error } = await supabase
      .from("assignment_submissions")
      .update({
        score,
        feedback,
        status: "graded"
      })
      .eq("id", selectedSubmission.id);

    if (error) {
      toast.error("Failed to update grade");
      console.error(error);
    } else {
      toast.success("Grade submitted successfully");
      setGradingOpen(false);
      setSelectedSubmission(null);
      loadSubmissions();
    }
  };

  if (!isInstructor) {
    return null;
  }

  const pendingCount = submissions.filter(s => s.status === "submitted").length;
  const gradedCount = submissions.filter(s => s.status === "graded").length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Assignment Grading</h1>
          <p className="text-muted-foreground">Review and grade student assignment submissions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{submissions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Graded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{gradedCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Submissions</CardTitle>
              <Button onClick={loadSubmissions} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading submissions...</p>
            ) : submissions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No submissions yet</p>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <GradingSubmissionCard
                    key={submission.id}
                    submission={submission}
                    onGrade={handleGrade}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <GradingDialog
        open={gradingOpen}
        onOpenChange={setGradingOpen}
        submission={selectedSubmission}
        onSubmit={handleGradeSubmit}
      />
    </div>
  );
}
