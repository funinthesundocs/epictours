-- Create report_presets table for storing saved report configurations
CREATE TABLE IF NOT EXISTS report_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_report_presets_user_id ON report_presets(user_id);

-- Enable RLS
ALTER TABLE report_presets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own presets
CREATE POLICY "Users can view own presets" ON report_presets
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own presets
CREATE POLICY "Users can insert own presets" ON report_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own presets
CREATE POLICY "Users can update own presets" ON report_presets
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own presets
CREATE POLICY "Users can delete own presets" ON report_presets
  FOR DELETE USING (auth.uid() = user_id);
