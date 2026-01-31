-- Create date_range_presets table for storing custom date range configurations
CREATE TABLE IF NOT EXISTS date_range_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_date_range_presets_user_id ON date_range_presets(user_id);

-- Enable RLS
ALTER TABLE date_range_presets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own presets
CREATE POLICY "Users can view own date range presets" ON date_range_presets
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own presets
CREATE POLICY "Users can insert own date range presets" ON date_range_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own presets
CREATE POLICY "Users can delete own date range presets" ON date_range_presets
  FOR DELETE USING (auth.uid() = user_id);
