-- Pricing Schedules Table (Parent)
CREATE TABLE IF NOT EXISTS pricing_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Pricing Rates Table (Child Rows)
-- Stores the actual price points for each tier and customer type
CREATE TABLE IF NOT EXISTS pricing_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES pricing_schedules(id) ON DELETE CASCADE NOT NULL,
    customer_type_id UUID REFERENCES customer_types(id) ON DELETE CASCADE, -- Optional if type deleted? Or strict?
    tier TEXT NOT NULL CHECK (tier IN ('Retail', 'Online', 'Special', 'Custom')),
    price DECIMAL(10, 2) DEFAULT 0.00,
    tax_percentage DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(schedule_id, customer_type_id, tier) -- Prevent duplicate rates for same type/tier in one schedule
);

-- RLS Policies
ALTER TABLE pricing_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON pricing_schedules;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON pricing_rates;

-- Re-create with explicit WITH CHECK to allow inserts
CREATE POLICY "Enable all access for authenticated users" ON pricing_schedules
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON pricing_rates
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
