-- Add aggregate rating fields to assignments
ALTER TABLE public.assignments 
ADD COLUMN average_rating NUMERIC(3,2),
ADD COLUMN total_ratings INTEGER DEFAULT 0,
ADD COLUMN last_rated_at TIMESTAMP WITH TIME ZONE;

-- Create function to calculate and update aggregate ratings
CREATE OR REPLACE FUNCTION public.update_content_aggregate_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC(3,2);
  rating_count INTEGER;
  content_table TEXT;
BEGIN
  -- Determine which table to update based on content_type
  content_table := CASE NEW.content_type
    WHEN 'assignment' THEN 'assignments'
    WHEN 'quiz' THEN 'quiz_attempts'
    ELSE NULL
  END;

  IF content_table IS NULL OR NEW.rating IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate aggregate rating for this content
  SELECT 
    ROUND(AVG(rating)::NUMERIC, 2),
    COUNT(*)
  INTO avg_rating, rating_count
  FROM public.content_reviews
  WHERE content_type = NEW.content_type 
    AND content_id = NEW.content_id
    AND rating IS NOT NULL;

  -- Update the content table with aggregate rating
  IF content_table = 'assignments' THEN
    UPDATE public.assignments
    SET 
      average_rating = avg_rating,
      total_ratings = rating_count,
      last_rated_at = NOW(),
      -- Auto-flag if average rating drops below 2.5
      content_status = CASE 
        WHEN avg_rating < 2.5 AND rating_count >= 2 THEN 'flagged'::content_status
        ELSE content_status
      END
    WHERE id = NEW.content_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to update aggregate ratings after review
CREATE TRIGGER update_assignment_ratings_after_review
  AFTER INSERT OR UPDATE ON public.content_reviews
  FOR EACH ROW
  WHEN (NEW.rating IS NOT NULL)
  EXECUTE FUNCTION public.update_content_aggregate_rating();

-- Create view for content quality metrics
CREATE OR REPLACE VIEW public.content_quality_metrics AS
SELECT 
  a.id as content_id,
  'assignment' as content_type,
  a.module_id,
  m.topic as module_topic,
  a.content_status,
  a.average_rating,
  a.total_ratings,
  a.created_at,
  a.last_rated_at,
  COUNT(DISTINCT cr.id) as review_count,
  COUNT(DISTINCT CASE WHEN cr.status = 'flagged' THEN cr.id END) as flag_count,
  COUNT(DISTINCT CASE WHEN cr.status = 'approved' THEN cr.id END) as approval_count,
  STRING_AGG(DISTINCT cr.feedback, ' | ') as recent_feedback
FROM public.assignments a
LEFT JOIN public.modules m ON m.id = a.module_id
LEFT JOIN public.content_reviews cr ON cr.content_id = a.id AND cr.content_type = 'assignment'
GROUP BY a.id, a.module_id, m.topic, a.content_status, a.average_rating, a.total_ratings, a.created_at, a.last_rated_at;

-- Grant access to view
GRANT SELECT ON public.content_quality_metrics TO authenticated;

-- Create index for better performance on ratings
CREATE INDEX idx_assignments_average_rating ON public.assignments(average_rating) WHERE average_rating IS NOT NULL;
CREATE INDEX idx_content_reviews_rating ON public.content_reviews(rating) WHERE rating IS NOT NULL;