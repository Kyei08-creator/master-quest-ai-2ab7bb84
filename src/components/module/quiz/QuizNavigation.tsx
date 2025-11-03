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
      >
        Previous
      </Button>
      
      {!isLastPage ? (
        <Button onClick={onNext}>
          Next
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={quizType === "final_test" ? "bg-red-600 hover:bg-red-700" : ""}
        >
          Submit {quizType === "quiz" ? "Quiz" : "Final Test"}
        </Button>
      )}
    </div>
  );
};
