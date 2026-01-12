-- 13_experiences_schema.sql

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slogan text,
  event_type text default 'Tour', -- Tour, Activity, Transport, etc.
  description text,
  
  -- Timing
  start_time text, -- Just text for display (e.g. "7:00 AM")
  end_time text,   -- Just text for display (e.g. "4:00 PM")
  
  -- Age & Restrictions
  min_age integer,
  max_age integer,
  
  -- Capacity
  min_group_size integer,
  max_group_size integer,
  
  -- Lists & Details
  what_to_bring text[], -- Array of strings
  checkin_details text,
  transport_details text, -- "Checkin / Transport Details"
  
  -- Policies
  cancellation_policy text,
  restrictions text,
  disclaimer text,
  waiver_link text,
  
  -- Meta
  is_active boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table public.experiences enable row level security;
create policy "Enable all access for authenticated users" on public.experiences for all using (true);
