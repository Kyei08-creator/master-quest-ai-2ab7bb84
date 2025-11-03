import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";

interface Question {
  marks: number;
  correctAnswer?: number | string;
}

interface QuizResultsProps {
  quizType: "quiz" | "final_test";
  score: number;
  totalMarks: number;
  questions: Question[];
  answers: Record<number, number | string>;
  onTryAgain: () => void;
}

export const QuizResults = ({ 
  quizType, 
  score, 
  totalMarks, 
  questions, 
  answers, 
  onTryAgain 
}: QuizResultsProps) => {
  const totalPossibleMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const correctAnswers = Object.values(answers).filter(
    (a, i) => a === questions[i].correctAnswer
  ).length;

  return (
    <Card className="shadow-card-custom">
      <CardHeader>
        <CardTitle>
          {quizType === "quiz" ? "Quiz Results" : "Final Test Results"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-6">
          <div className="text-6xl font-bold mb-2">{score}%</div>
          <Badge variant={score >= 80 ? "default" : "destructive"} className="mb-4">
            {score >= 80 ? "Passed!" : "Keep Practicing"}
          </Badge>
          <p className="text-muted-foreground">
            {quizType === "final_test" 
              ? `You scored ${totalMarks} out of ${totalPossibleMarks} marks`
              : `You got ${correctAnswers} out of ${questions.length} correct`
            }
          </p>
        </div>
        <Button onClick={onTryAgain}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
};
