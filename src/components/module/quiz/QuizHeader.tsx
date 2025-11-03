import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle } from "@/components/ui/card";

interface QuizMetrics {
  practicalityTheoretical: string;
  predictability: string;
  difficulty: string;
  alignment: string;
  learningTime: string;
  proficiency: string;
}

interface QuizHeaderProps {
  moduleTopic: string;
  quizType: "quiz" | "final_test";
  answeredCount: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  questionsPerPage: number;
  metrics?: QuizMetrics;
  onPageChange: (index: number) => void;
}

export const QuizHeader = ({
  moduleTopic,
  quizType,
  answeredCount,
  totalQuestions,
  currentQuestionIndex,
  questionsPerPage,
  metrics,
  onPageChange
}: QuizHeaderProps) => {
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);

  return (
    <CardHeader>
      <div className="flex items-center justify-between mb-4">
        <CardTitle>
          Module: {moduleTopic} - {quizType === "quiz" ? "Quiz" : "Final Test"}
        </CardTitle>
        <Badge>{answeredCount} / {totalQuestions} answered</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Test your understanding with a practice {quizType === "quiz" ? "quiz" : "test"} based on the module resources.
      </p>

      {metrics && (
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
            {quizType === "quiz" ? "Quiz" : "Final Test"} Details (AI Metrics)
          </h4>
          <div className="space-y-1 text-sm">
            <p>• **Practicality/Theoretical:** {metrics.practicalityTheoretical}</p>
            <p>• **Predictability:** {metrics.predictability}</p>
            <p>• **Difficulty:** {metrics.difficulty}</p>
            <p>• **Alignment:** {metrics.alignment}</p>
            <p>• **Learning Time:** {metrics.learningTime}</p>
            <p>• **Proficiency Required:** {metrics.proficiency}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: totalPages }, (_, i) => (
          <Button
            key={i}
            variant={Math.floor(currentQuestionIndex / questionsPerPage) === i ? "default" : "outline"}
            onClick={() => onPageChange(i * questionsPerPage)}
            size="sm"
          >
            Question {i * questionsPerPage + 1}
          </Button>
        ))}
      </div>
    </CardHeader>
  );
};
