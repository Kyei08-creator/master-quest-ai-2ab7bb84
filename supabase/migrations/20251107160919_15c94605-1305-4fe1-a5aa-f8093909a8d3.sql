-- Drop function CASCADE to remove all dependent policies, then rebuild everything
DROP FUNCTION IF EXISTS public.is_module_member(uuid, uuid) CASCADE;

-- 1) Recreate function with safe parameter names (sql stable instead of plpgsql)
CREATE OR REPLACE FUNCTION public.is_module_member(_module_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.modules m WHERE m.id = _module_id AND m.user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.module_members mm WHERE mm.module_id = _module_id AND mm.user_id = _user_id
  );
$$;

-- 2) Recreate all RLS policies that depend on is_module_member
CREATE POLICY "Users can view modules they have access to"
ON public.modules FOR SELECT
USING ((public.modules.user_id = auth.uid()) OR public.is_module_member(public.modules.id, auth.uid()));

CREATE POLICY "Users can view members of modules they have access to"
ON public.module_members FOR SELECT
USING (public.is_module_member(public.module_members.module_id, auth.uid()));

CREATE POLICY "Users can view discussions for accessible modules"
ON public.discussions FOR SELECT
USING (public.is_module_member(public.discussions.module_id, auth.uid()));

CREATE POLICY "Users can create discussions for accessible modules"
ON public.discussions FOR INSERT
WITH CHECK ((public.discussions.user_id = auth.uid()) AND public.is_module_member(public.discussions.module_id, auth.uid()));

CREATE POLICY "Users can view replies for accessible discussions"
ON public.discussion_replies FOR SELECT
USING (EXISTS (SELECT 1 FROM public.discussions d WHERE d.id = public.discussion_replies.discussion_id AND public.is_module_member(d.module_id, auth.uid())));

CREATE POLICY "Users can create replies for accessible discussions"
ON public.discussion_replies FOR INSERT
WITH CHECK ((public.discussion_replies.user_id = auth.uid()) AND (EXISTS (SELECT 1 FROM public.discussions d WHERE d.id = public.discussion_replies.discussion_id AND public.is_module_member(d.module_id, auth.uid()))));

CREATE POLICY "Users can view resources for accessible modules"
ON public.resources FOR SELECT
USING (public.is_module_member(public.resources.module_id, auth.uid()));

CREATE POLICY "Users can view assignments for accessible modules"
ON public.assignments FOR SELECT
USING (public.is_module_member(public.assignments.module_id, auth.uid()));

CREATE POLICY "Users can view own submissions for accessible modules"
ON public.assignment_submissions FOR SELECT
USING (public.is_module_member(public.assignment_submissions.module_id, auth.uid()) AND (EXISTS (SELECT 1 FROM public.modules WHERE public.modules.id = public.assignment_submissions.module_id AND public.modules.user_id = auth.uid())));

CREATE POLICY "Users can create submissions for accessible modules"
ON public.assignment_submissions FOR INSERT
WITH CHECK (public.is_module_member(public.assignment_submissions.module_id, auth.uid()));

CREATE POLICY "Users can view own quiz attempts for accessible modules"
ON public.quiz_attempts FOR SELECT
USING (public.is_module_member(public.quiz_attempts.module_id, auth.uid()));

CREATE POLICY "Users can create quiz attempts for accessible modules"
ON public.quiz_attempts FOR INSERT
WITH CHECK (public.is_module_member(public.quiz_attempts.module_id, auth.uid()));

CREATE POLICY "Users can view drafts for accessible modules"
ON public.module_progress_drafts FOR SELECT
USING (public.is_module_member(public.module_progress_drafts.module_id, auth.uid()));

CREATE POLICY "Users can insert drafts for accessible modules"
ON public.module_progress_drafts FOR INSERT
WITH CHECK (public.is_module_member(public.module_progress_drafts.module_id, auth.uid()));

CREATE POLICY "Users can update drafts for accessible modules"
ON public.module_progress_drafts FOR UPDATE
USING (public.is_module_member(public.module_progress_drafts.module_id, auth.uid()));