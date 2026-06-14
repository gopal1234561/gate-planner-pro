
-- Deduplicate subjects per user keeping the earliest row, reassigning references
WITH ranked AS (
  SELECT id, user_id, name,
         ROW_NUMBER() OVER (PARTITION BY user_id, lower(name) ORDER BY created_at, id) AS rn,
         FIRST_VALUE(id) OVER (PARTITION BY user_id, lower(name) ORDER BY created_at, id) AS keep_id
  FROM public.subjects
),
mapping AS (
  SELECT id AS dup_id, keep_id FROM ranked WHERE rn > 1
)
, _u1 AS (UPDATE public.notes n SET subject_id = m.keep_id FROM mapping m WHERE n.subject_id = m.dup_id RETURNING 1)
, _u2 AS (UPDATE public.formula_sheets f SET subject_id = m.keep_id FROM mapping m WHERE f.subject_id = m.dup_id RETURNING 1)
, _u3 AS (UPDATE public.topics t SET subject_id = m.keep_id FROM mapping m WHERE t.subject_id = m.dup_id RETURNING 1)
, _u4 AS (UPDATE public.tasks t SET subject_id = m.keep_id FROM mapping m WHERE t.subject_id = m.dup_id RETURNING 1)
, _u5 AS (UPDATE public.study_sessions s SET subject_id = m.keep_id FROM mapping m WHERE s.subject_id = m.dup_id RETURNING 1)
, _u6 AS (UPDATE public.mistakes mk SET subject_id = m.keep_id FROM mapping m WHERE mk.subject_id = m.dup_id RETURNING 1)
DELETE FROM public.subjects WHERE id IN (SELECT dup_id FROM mapping);

-- Prevent future duplicates (case-insensitive per user)
CREATE UNIQUE INDEX IF NOT EXISTS subjects_user_name_lower_uniq
  ON public.subjects (user_id, lower(name));
