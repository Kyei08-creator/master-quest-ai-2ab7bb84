import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Sparkles } from "lucide-react";

interface QuizEmptyProps {
  quizType: "quiz" | "final_test";
  generating: boolean;
  onGenerate: () => void;
}

export const QuizEmpty = ({ quizType, generating, onGenerate }: QuizEmptyProps) => {
  return (
    <Card className="shadow-card-custom">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {quizType === "quiz" ? (
            <>
              <Sparkles className="w-5 h-5 text-primary" />
              Practice Quiz
            </>
          ) : (
            <>
              <GraduationCap className="w-5 h-5 text-accent" />
              Final Test
            </>
          )}
        </CardTitle>
        <CardDescription>
          {quizType === "quiz" 
            ? "Test your understanding with a practice quiz (25 MCQ questions)"
            : "Take the final test to complete this module - 50 marks total (80% required to pass)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={onGenerate} 
          disabled={generating} 
          className={quizType === "final_test" ? "w-full bg-red-600 hover:bg-red-700" : "w-full"}
        >
          {generating ? "Generating..." : quizType === "quiz" ? "Generate Practice Quiz" : "Take Final Test"}
        </Button>
      </CardContent>
    </Card>
  );
};
