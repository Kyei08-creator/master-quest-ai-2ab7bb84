-- Create storage bucket for assessment submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assessment-submissions',
  'assessment-submissions',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
);

-- RLS policies for assessment submissions bucket
CREATE POLICY "Users can upload their own submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assessment-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assessment-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can view all submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assessment-submissions' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'instructor'
  )
);

-- Create document_submissions table
CREATE TABLE public.document_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('assignment', 'quiz', 'final_test')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  page_count INTEGER,
  word_count INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'graded', 'error')),
  ai_feedback TEXT,
  score NUMERIC(5,2),
  total_marks NUMERIC(5,2),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_submissions
CREATE POLICY "Users can view their own submissions"
ON public.document_submissions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions"
ON public.document_submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Instructors can view all submissions"
ON public.document_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'instructor'
  )
);

CREATE POLICY "Instructors can update submissions for grading"
ON public.document_submissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'instructor'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_document_submissions_updated_at
BEFORE UPDATE ON public.document_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_document_submissions_user_module ON public.document_submissions(user_id, module_id, assessment_type);
CREATE INDEX idx_document_submissions_status ON public.document_submissions(status);