-- Update document_submissions to allow presentation and flashcard types
ALTER TABLE public.document_submissions 
DROP CONSTRAINT IF EXISTS document_submissions_assessment_type_check;

ALTER TABLE public.document_submissions
ADD CONSTRAINT document_submissions_assessment_type_check 
CHECK (assessment_type IN ('assignment', 'quiz', 'final_test', 'presentation', 'flashcard'));