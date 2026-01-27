-- Create staff table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    role_id UUID REFERENCES public.roles(id), -- Assuming roles table exists
    phone TEXT,
    email TEXT,
    notes TEXT,
    messaging_app TEXT -- Stores JSON string of messaging apps
);

-- Safely add messaging_app column if staff table existed but column was missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'messaging_app') THEN
        ALTER TABLE public.staff ADD COLUMN messaging_app TEXT;
    END IF;
END $$;
