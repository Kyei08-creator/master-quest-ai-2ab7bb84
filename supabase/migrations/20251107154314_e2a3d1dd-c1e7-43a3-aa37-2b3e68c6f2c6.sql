-- Fix function search path for is_module_member using CREATE OR REPLACE
CREATE OR REPLACE FUNCTION public.is_module_member(module_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.modules WHERE id = module_id AND user_id = user_id
  ) OR EXISTS (
    SELECT 1 FROM public.module_members WHERE module_id = module_id AND user_id = user_id
  );
END;
$$;