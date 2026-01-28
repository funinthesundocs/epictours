-- Add messaging app and handle columns to vendors table
-- Run this in Supabase SQL Editor

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS preferred_messaging_app TEXT,
ADD COLUMN IF NOT EXISTS messaging_handle TEXT;

-- Add comments for documentation
COMMENT ON COLUMN vendors.preferred_messaging_app IS 'Preferred messaging app (WhatsApp, Telegram, Signal, etc.)';
COMMENT ON COLUMN vendors.messaging_handle IS 'Handle or username for the messaging app';
