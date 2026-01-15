-- 15_add_experience_code.sql
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS short_code text;
