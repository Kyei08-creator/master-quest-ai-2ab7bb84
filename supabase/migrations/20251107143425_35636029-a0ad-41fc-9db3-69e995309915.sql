-- Create enum for content status
CREATE TYPE public.content_status AS ENUM ('draft', 'pending_review', 'approved', 'flagged');

-- Add content_status to assignments table
ALTER TABLE public.assignments 
ADD COLUMN content_status public.content_status NOT NULL DEFAULT 'pending_review',
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);

-- Create content_reviews table
CREATE TABLE public.content_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'assignment', 'quiz', 'resource'
  content_id UUID NOT NULL,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  status public.content_status NOT NULL,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alternative_questions table for experts to suggest improvements
CREATE TABLE public.alternative_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  original_question_index INTEGER NOT NULL,
  suggested_question TEXT NOT NULL,
  suggested_by UUID NOT NULL REFERENCES auth.users(id),
  reasoning TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'pending_review',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternative_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_reviews
CREATE POLICY "Instructors and admins can view all reviews"
ON public.content_reviews
FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Instructors and admins can create reviews"
ON public.content_reviews
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'instructor'::app_role) OR 
   has_role(auth.uid(), 'admin'::app_role)) AND
  auth.uid() = reviewer_id
);

CREATE POLICY "Reviewers can update their own reviews"
ON public.content_reviews
FOR UPDATE
USING (auth.uid() = reviewer_id);

-- RLS Policies for alternative_questions
CREATE POLICY "Users can view approved alternative questions"
ON public.alternative_questions
FOR SELECT
USING (
  status = 'approved'::content_status OR
  auth.uid() = suggested_by OR
  has_role(auth.uid(), 'instructor'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Instructors can create alternative questions"
ON public.alternative_questions
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'instructor'::app_role) OR 
   has_role(auth.uid(), 'admin'::app_role)) AND
  auth.uid() = suggested_by
);

CREATE POLICY "Instructors and admins can update alternative questions"
ON public.alternative_questions
FOR UPDATE
USING (
  has_role(auth.uid(), 'instructor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add trigger for updated_at
CREATE TRIGGER update_content_reviews_updated_at
  BEFORE UPDATE ON public.content_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alternative_questions_updated_at
  BEFORE UPDATE ON public.alternative_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_content_reviews_content ON public.content_reviews(content_type, content_id);
CREATE INDEX idx_content_reviews_status ON public.content_reviews(status);
CREATE INDEX idx_content_reviews_reviewer ON public.content_reviews(reviewer_id);
CREATE INDEX idx_alternative_questions_assignment ON public.alternative_questions(assignment_id);
CREATE INDEX idx_alternative_questions_status ON public.alternative_questions(status);