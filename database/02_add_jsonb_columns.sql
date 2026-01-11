-- Add JSONB columns for flexible data storage
-- This enables the "Hybrid Schema" strategy (Strict ID/Email + Flexible Config)

alter table public.customers 
add column if not exists preferences jsonb default '{}'::jsonb,
add column if not exists metadata jsonb default '{}'::jsonb;

-- Comment on columns for documentation
comment on column public.customers.preferences is 'Stores dietary, accessibility, emergency contact, and travel preferences.';
comment on column public.customers.metadata is 'Stores technical or sales metadata like signup source or campaign IDs.';
