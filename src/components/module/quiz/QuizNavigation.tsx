import { Button } from "@/components/ui/button";

interface QuizNavigationProps {
  currentQuestionIndex: number;
  endIndex: number;
  totalQuestions: number;
  questionsPerPage: number;
  quizType: "quiz" | "final_test";
  answeredCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const QuizNavigation = ({
  currentQuestionIndex,
  endIndex,
  totalQuestions,
  questionsPerPage,
  quizType,
  answeredCount,
  onPrevious,
  onNext,
  onSubmit
}: QuizNavigationProps) => {
  const isLastPage = endIndex >= totalQuestions;
  const canSubmit = answeredCount === totalQuestions;

  return (
    <div className="flex justify-between items-center pt-4">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentQuestionIndex === 0}
        className="transition-all duration-200 hover:scale-105"
      >
        Previous
      </Button>
      
      {!isLastPage ? (
        <Button 
          onClick={onNext}
          className="transition-all duration-200 hover:scale-105"
        >
          Next
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`transition-all duration-200 hover:scale-105 ${quizType === "final_test" ? "bg-red-600 hover:bg-red-700" : ""}`}
        >
          Submit {quizType === "quiz" ? "Quiz" : "Final Test"}
        </Button>
      )}
    </div>
  );
};
