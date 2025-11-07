-- Add profile_role column to profiles table for user self-identification
ALTER TABLE public.profiles 
ADD COLUMN profile_role text DEFAULT 'learner' CHECK (profile_role IN ('learner', 'expert', 'teacher'));