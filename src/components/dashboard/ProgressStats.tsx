import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Trophy, Target, TrendingUp } from "lucide-react";

interface Module {
  id: string;
  status: string;
  final_score: number | null;
}

interface ProgressStatsProps {
  modules: Module[];
}

export const ProgressStats = ({ modules }: ProgressStatsProps) => {
  const totalModules = modules.length;
  const completedModules = modules.filter(m => m.status === "completed").length;
  const inProgressModules = modules.filter(m => m.status === "in_progress").length;
  const needsReviewModules = modules.filter(m => m.status === "needs_revisit").length;

  const completionPercentage = totalModules > 0 
    ? Math.round((completedModules / totalModules) * 100) 
    : 0;

  const completedScores = modules
    .filter(m => m.final_score !== null)
    .map(m => m.final_score as number);

  const averageScore = completedScores.length > 0
    ? Math.round(completedScores.reduce((sum, score) => sum + score, 0) / completedScores.length)
    : 0;

  const passedModules = completedScores.filter(score => score >= 80).length;

  return (
    <div className="space-y-6 mb-8">
      <Card className="shadow-card-custom border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Course Completion</span>
              <span className="text-muted-foreground">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {completedModules} of {totalModules} modules completed
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card-custom">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Total Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalModules}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {inProgressModules} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card-custom">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="w-4 h-4 text-success" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{completedModules}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {passedModules} passed with 80%+
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card-custom">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {completedScores.length > 0 ? `${averageScore}%` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {completedScores.length} graded test{completedScores.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card-custom">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-destructive" />
              Needs Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{needsReviewModules}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Below passing threshold
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
