
-- Add revision_count to topics table for spaced repetition tracking
ALTER TABLE public.topics ADD COLUMN revision_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.topics ADD COLUMN last_revised_at timestamp with time zone;
