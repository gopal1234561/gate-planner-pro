CREATE TABLE public.planner_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_date DATE NOT NULL,
  is_selected BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, selected_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_dates TO authenticated;
GRANT ALL ON public.planner_dates TO service_role;
ALTER TABLE public.planner_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own planner dates" ON public.planner_dates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own planner dates" ON public.planner_dates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own planner dates" ON public.planner_dates FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own planner dates" ON public.planner_dates FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_planner_dates_user_date ON public.planner_dates(user_id, selected_date);