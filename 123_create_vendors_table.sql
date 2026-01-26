-- Create Vendors Table
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    ein_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Vendor ID to Vehicles
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

-- Policy (Open access for now, similar to other tables)
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.vendors
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.vendors
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.vendors
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.vendors
    FOR DELETE USING (true);
