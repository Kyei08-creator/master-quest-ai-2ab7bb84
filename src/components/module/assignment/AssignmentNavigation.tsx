import { Button } from "@/components/ui/button";

interface AssignmentNavigationProps {
  currentSection: number;
  totalSections: number;
  submitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const AssignmentNavigation = ({
  currentSection,
  totalSections,
  submitting,
  onPrevious,
  onNext,
  onSubmit
}: AssignmentNavigationProps) => {
  const isLastSection = currentSection === totalSections - 1;

  return (
    <div className="flex justify-between mt-6">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentSection === 0}
      >
        Previous Section
      </Button>
      
      {!isLastSection ? (
        <Button onClick={onNext}>
          Next Section
        </Button>
      ) : (
        <Button 
          onClick={onSubmit}
          disabled={submitting}
          className="bg-green-600 hover:bg-green-700"
        >
          {submitting ? "Submitting..." : "Submit Assignment"}
        </Button>
      )}
    </div>
  );
};
