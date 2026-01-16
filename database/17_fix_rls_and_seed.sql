-- 1. FIX RLS POLICIES (Allow public/anon access for Development)
ALTER TABLE public.customer_types ENABLE ROW LEVEL SECURITY;

-- Remove strict authenticated policies
DROP POLICY IF EXISTS "Authenticated users can modify customer_types" ON public.customer_types;
DROP POLICY IF EXISTS "Authenticated users can read customer_types" ON public.customer_types;

-- Add permissive policy
CREATE POLICY "Allow public access" ON public.customer_types
FOR ALL
USING (true)
WITH CHECK (true);

-- 2. SEED DATA (Adults)
INSERT INTO public.customer_types (name, code, description)
VALUES ('Adults', 'AD', '4+ Years')
ON CONFLICT (code) DO UPDATE
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;
