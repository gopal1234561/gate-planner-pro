CREATE POLICY "Users can update their own study sessions"
ON public.study_sessions
FOR UPDATE
USING (auth.uid() = user_id);