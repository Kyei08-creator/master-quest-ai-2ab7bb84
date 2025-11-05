import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AssignmentSubmittedProps {
  onReset: () => void;
}

export const AssignmentSubmitted = ({ onReset }: AssignmentSubmittedProps) => {
  return (
    <Card className="shadow-card-custom animate-fade-in">
      <CardHeader>
        <CardTitle>Assignment Submitted</CardTitle>
      </CardHeader>
      <CardContent className="text-center py-12">
        <div className="mb-6">
          <div className="text-6xl mb-4 animate-scale-in">✓</div>
          <h3 className="text-2xl font-bold mb-2 animate-fade-in">Successfully Submitted!</h3>
          <p className="text-muted-foreground mb-4 animate-fade-in">
            Your assignment has been submitted for review. Check the Results tab to see your submission status.
          </p>
        </div>
        <Button 
          onClick={onReset} 
          variant="outline"
          className="transition-all duration-200 hover:scale-105"
        >
          View Assignment Again
        </Button>
      </CardContent>
    </Card>
  );
};
