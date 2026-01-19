-- Availabilities Table
-- Core availability records for the calendar system

CREATE TABLE IF NOT EXISTS availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    
    -- Repeat Logic
    is_repeating BOOLEAN DEFAULT false,
    repeat_days TEXT[], -- e.g., ARRAY['MON', 'WED', 'FRI']
    end_date DATE,
    
    -- Duration
    duration_type TEXT NOT NULL DEFAULT 'all_day', -- 'all_day' | 'time_range'
    start_time TIME,
    hours_long DECIMAL(4,2),
    
    -- Capacity & Settings
    max_capacity INTEGER DEFAULT 0,
    customer_type_ids UUID[], -- Array of customer_type IDs
    booking_option_schedule_id UUID,
    pricing_schedule_id UUID,
    transportation_route_id UUID,
    staff_ids UUID[], -- Array of staff IDs
    
    -- Info
    private_announcement TEXT,
    online_booking_status TEXT DEFAULT 'open', -- 'open' | 'closed'
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access" ON availabilities;
CREATE POLICY "Allow public access" ON availabilities FOR ALL USING (true) WITH CHECK (true);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_availabilities_start_date ON availabilities(start_date);
CREATE INDEX IF NOT EXISTS idx_availabilities_experience ON availabilities(experience_id);
