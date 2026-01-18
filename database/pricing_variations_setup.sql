-- Pricing Variations Table
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pricing_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Public access for dev)
ALTER TABLE pricing_variations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access" ON pricing_variations;
CREATE POLICY "Allow public access" ON pricing_variations FOR ALL USING (true) WITH CHECK (true);

-- Add sort_order column if missing (for existing installs)
ALTER TABLE pricing_variations ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Initialize sort_order for existing rows
UPDATE pricing_variations SET sort_order = 0 WHERE sort_order IS NULL;

-- Seed some example data with sort order
INSERT INTO pricing_variations (name, sort_order) VALUES
    ('Retail', 1),
    ('Online', 2),
    ('Partner', 3),
    ('VIP', 4)
ON CONFLICT DO NOTHING;

