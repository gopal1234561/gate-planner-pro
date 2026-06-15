
CREATE TABLE public.pyqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  year INTEGER,
  question_text TEXT,
  explanation TEXT,
  image_url TEXT,
  source_link TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pyqs TO authenticated;
GRANT ALL ON public.pyqs TO service_role;
ALTER TABLE public.pyqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own pyqs" ON public.pyqs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pyqs" ON public.pyqs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pyqs" ON public.pyqs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pyqs" ON public.pyqs FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_pyqs_updated_at BEFORE UPDATE ON public.pyqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
