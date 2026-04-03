CREATE TABLE public.mistakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic TEXT,
  mistake_text TEXT NOT NULL,
  correction TEXT,
  category TEXT DEFAULT 'other',
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mistakes" ON public.mistakes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mistakes" ON public.mistakes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mistakes" ON public.mistakes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mistakes" ON public.mistakes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_mistakes_updated_at BEFORE UPDATE ON public.mistakes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();