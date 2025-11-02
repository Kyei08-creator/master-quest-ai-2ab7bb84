-- Create assignment_submissions table
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL,
  assignment_id UUID NOT NULL,
  answers JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'submitted',
  score INTEGER,
  total_marks INTEGER NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own assignment submissions" 
ON public.assignment_submissions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM modules 
  WHERE modules.id = assignment_submissions.module_id 
  AND modules.user_id = auth.uid()
));

CREATE POLICY "Users can create own assignment submissions" 
ON public.assignment_submissions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM modules 
  WHERE modules.id = assignment_submissions.module_id 
  AND modules.user_id = auth.uid()
));

-- Create index for better query performance
CREATE INDEX idx_assignment_submissions_module_id ON public.assignment_submissions(module_id);
CREATE INDEX idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);