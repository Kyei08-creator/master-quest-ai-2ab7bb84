-- Fix ambiguous column reference in is_module_member function
CREATE OR REPLACE FUNCTION public.is_module_member(module_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.modules m WHERE m.id = module_id AND m.user_id = user_id
  ) OR EXISTS (
    SELECT 1 FROM public.module_members mm WHERE mm.module_id = module_id AND mm.user_id = user_id
  );
END;
$$;