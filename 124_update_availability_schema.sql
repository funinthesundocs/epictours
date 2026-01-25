-- Add pricing_tier_id to availabilities table to link to Pricing Variations
-- This allows specifying a default Pricing Tier (e.g. Retail, Wholesale) for the availability slot.

ALTER TABLE IF EXISTS public.availabilities
ADD COLUMN IF NOT EXISTS pricing_tier_id UUID REFERENCES public.pricing_variations(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_availabilities_pricing_tier_id ON public.availabilities(pricing_tier_id);
