
CREATE TABLE public.manual_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  hours_studied NUMERIC NOT NULL DEFAULT 0,
  pyqs_solved INTEGER NOT NULL DEFAULT 0,
  revision_count INTEGER NOT NULL DEFAULT 0,
  last_studied DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tracker entries"
ON public.manual_tracker FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracker entries"
ON public.manual_tracker FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracker entries"
ON public.manual_tracker FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracker entries"
ON public.manual_tracker FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_manual_tracker_updated_at
BEFORE UPDATE ON public.manual_tracker
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
