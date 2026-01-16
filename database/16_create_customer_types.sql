-- Define the update_modified_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Customer Types Table
CREATE TABLE IF NOT EXISTS public.customer_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.customer_types ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Authenticated users can read customer_types"
    ON public.customer_types FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert/update/delete (Operational staff)
CREATE POLICY "Authenticated users can modify customer_types"
    ON public.customer_types FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_customer_types_modtime ON public.customer_types;
CREATE TRIGGER update_customer_types_modtime
    BEFORE UPDATE ON public.customer_types
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
