import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Calendar, Flame } from "lucide-react";

interface Module {
  id: string;
  status: string;
  final_score: number | null;
  created_at: string;
}

interface LearningAnalyticsProps {
  modules: Module[];
}

export const LearningAnalytics = ({ modules }: LearningAnalyticsProps) => {
  // Calculate learning streak (consecutive days with module activity)
  const sortedDates = modules
    .map(m => new Date(m.created_at).toDateString())
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const uniqueDates = Array.from(new Set(sortedDates));
  let currentStreak = 0;
  const today = new Date().toDateString();
  
  if (uniqueDates.length > 0) {
    const lastActivityDate = new Date(uniqueDates[0]);
    const todayDate = new Date(today);
    const daysSinceLastActivity = Math.floor(
      (todayDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastActivity <= 1) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const dayDiff = Math.floor(
          (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  // Get recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentModules = modules.filter(
    m => new Date(m.created_at) >= sevenDaysAgo
  ).length;

  // Performance insights
  const completedModules = modules.filter(m => m.status === "completed");
  const needsReviewModules = modules.filter(m => m.status === "needs_revisit");
  const highScorers = completedModules.filter(m => m.final_score && m.final_score >= 90).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Learning Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-orange-500 mb-2">
            {currentStreak}
          </div>
          <p className="text-sm text-muted-foreground">
            {currentStreak === 0 
              ? "Start a new streak today!"
              : currentStreak === 1
              ? "Day of consecutive learning"
              : "Days of consecutive learning"}
          </p>
          {currentStreak > 0 && (
            <Badge variant="secondary" className="mt-2">
              Keep it up! 🔥
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-500 mb-2">
            {recentModules}
          </div>
          <p className="text-sm text-muted-foreground">
            Module{recentModules !== 1 ? "s" : ""} created in the last 7 days
          </p>
          {recentModules > 0 && (
            <Badge variant="secondary" className="mt-2">
              Active learner 📚
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">High Scores (90%+)</span>
              <Badge variant="default">{highScorers}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Completed</span>
              <Badge variant="secondary">{completedModules.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Needs Review</span>
              <Badge variant="destructive">{needsReviewModules.length}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
