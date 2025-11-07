-- Fix security warnings by setting search_path for functions
ALTER FUNCTION public.update_discussion_upvotes() SET search_path = public;
ALTER FUNCTION public.update_reply_upvotes() SET search_path = public;