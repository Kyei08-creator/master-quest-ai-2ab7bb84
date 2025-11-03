import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Question {
  question: string;
  type: "mcq" | "true_false" | "short_answer" | "case_study" | "essay";
  options?: string[];
  marks: number;
  sectionTitle?: string;
}

interface QuizQuestionProps {
  question: Question;
  questionIndex: number;
  answer?: number | string;
  onAnswerChange: (value: number | string) => void;
}

export const QuizQuestion = ({ 
  question, 
  questionIndex, 
  answer, 
  onAnswerChange 
}: QuizQuestionProps) => {
  const isMCQ = question.type === "mcq" || question.type === "true_false";
  const isWritten = question.type === "short_answer" || question.type === "case_study" || question.type === "essay";

  return (
    <div className="p-6 bg-muted/50 rounded-lg border-l-4 border-primary">
      {question.sectionTitle && (
        <div className="mb-4">
          <Badge variant="secondary" className="text-sm font-semibold">
            {question.sectionTitle}
          </Badge>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-medium flex-1">
          {questionIndex + 1}. {question.question}
        </h4>
        <Badge variant="outline" className="ml-4">
          {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
        </Badge>
      </div>

      {isMCQ && question.options && (
        <RadioGroup
          value={answer?.toString()}
          onValueChange={(value) => onAnswerChange(parseInt(value))}
        >
          {question.options.map((option, oIndex) => (
            <div key={oIndex} className="flex items-center space-x-2 py-2">
              <RadioGroupItem value={oIndex.toString()} id={`q${questionIndex}-o${oIndex}`} />
              <Label htmlFor={`q${questionIndex}-o${oIndex}`} className="cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {isWritten && (
        <textarea
          className="w-full p-3 mt-2 border rounded-md bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={
            question.type === "essay" 
              ? "Write your detailed answer here (minimum 150 words recommended)..." 
              : "Type your answer here..."
          }
          value={answer as string || ""}
          onChange={(e) => onAnswerChange(e.target.value)}
        />
      )}
    </div>
  );
};
