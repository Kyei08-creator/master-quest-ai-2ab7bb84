-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update assignment_submissions to allow instructors to update
CREATE POLICY "Instructors can update assignment submissions"
ON public.assignment_submissions
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'instructor') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Allow instructors to view all assignment submissions
CREATE POLICY "Instructors can view all submissions"
ON public.assignment_submissions
FOR SELECT
USING (
  public.has_role(auth.uid(), 'instructor') OR 
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM modules
    WHERE modules.id = assignment_submissions.module_id 
    AND modules.user_id = auth.uid()
  )
);