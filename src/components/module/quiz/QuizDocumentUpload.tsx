import { DocumentUpload } from "../DocumentUpload";

interface QuizDocumentUploadProps {
  moduleId: string;
  quizType: 'quiz' | 'final_test';
}

export const QuizDocumentUpload = ({ moduleId, quizType }: QuizDocumentUploadProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">
          {quizType === 'final_test' ? 'Final Test' : 'Practice Quiz'}
        </h2>
        <p className="text-muted-foreground mb-8">
          Submit your completed {quizType === 'final_test' ? 'final test' : 'quiz'} document for AI grading
        </p>
      </div>
      
      <DocumentUpload 
        moduleId={moduleId}
        assessmentType={quizType}
      />
    </div>
  );
};