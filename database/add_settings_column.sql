-- Add settings column to custom_field_definitions
ALTER TABLE public.custom_field_definitions 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
