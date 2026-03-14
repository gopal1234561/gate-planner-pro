
CREATE TABLE public.formula_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'general',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.formula_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own formula sheets" ON public.formula_sheets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own formula sheets" ON public.formula_sheets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own formula sheets" ON public.formula_sheets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own formula sheets" ON public.formula_sheets FOR DELETE USING (auth.uid() = user_id);
