CREATE TABLE IF NOT EXISTS public.booking_option_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    config_retail JSONB DEFAULT '[]'::jsonb,
    config_online JSONB DEFAULT '[]'::jsonb,
    config_special JSONB DEFAULT '[]'::jsonb,
    config_custom JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.booking_option_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for public" ON public.booking_option_schedules FOR ALL TO public USING (true) WITH CHECK (true);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
