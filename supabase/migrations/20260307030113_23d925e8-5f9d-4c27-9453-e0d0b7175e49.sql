
-- Notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- PYQ Questions table
CREATE TABLE public.pyq_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  year INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT,
  is_user_added BOOLEAN DEFAULT false,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pyq_questions ENABLE ROW LEVEL SECURITY;

-- Everyone can read all PYQs (pre-populated + user-added)
CREATE POLICY "Anyone can view PYQs" ON public.pyq_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own PYQs" ON public.pyq_questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own PYQs" ON public.pyq_questions FOR UPDATE TO authenticated USING (auth.uid() = user_id AND is_user_added = true);
CREATE POLICY "Users can delete their own PYQs" ON public.pyq_questions FOR DELETE TO authenticated USING (auth.uid() = user_id AND is_user_added = true);

-- PYQ Solved tracker
CREATE TABLE public.pyq_solved (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID REFERENCES public.pyq_questions(id) ON DELETE CASCADE NOT NULL,
  solved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.pyq_solved ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their solved PYQs" ON public.pyq_solved FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark PYQs as solved" ON public.pyq_solved FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unmark PYQs" ON public.pyq_solved FOR DELETE USING (auth.uid() = user_id);

-- Study plans table
CREATE TABLE public.study_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_data JSONB NOT NULL DEFAULT '{}',
  target_gate_year INTEGER NOT NULL DEFAULT 2027,
  daily_hours INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plans" ON public.study_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own plans" ON public.study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plans" ON public.study_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plans" ON public.study_plans FOR DELETE USING (auth.uid() = user_id);
