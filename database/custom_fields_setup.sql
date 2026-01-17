-- Create custom_field_definitions table
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- internal machine name
    label TEXT NOT NULL, -- display label
    type TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'select', 'quantity', 'checkbox', 'transport', 'header', 'date')),
    description TEXT,
    is_internal BOOLEAN DEFAULT false,
    options JSONB DEFAULT '[]'::jsonb, -- Store dropdown options: [{label: "A", value: "a"}, ...]
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

-- Allow public access for development (matching current permissive pattern)
CREATE POLICY "Allow public access" ON public.custom_field_definitions
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.custom_field_definitions TO anon;
GRANT ALL ON public.custom_field_definitions TO authenticated;
GRANT ALL ON public.custom_field_definitions TO service_role;
