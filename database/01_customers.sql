-- Create the Status Enums
create type customer_status as enum ('active', 'lead', 'inactive', 'archived');

-- Create Customers Table
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  phone text,
  status customer_status default 'lead',
  total_value numeric default 0,
  last_active timestamptz default now(),
  tags text[] default '{}',
  avatar_url text
);

-- Enable Row Level Security
alter table public.customers enable row level security;

-- Create Policy: Allow public read/write (Development Mode)
-- WARN: This is for initial development only.
create policy "Public Access"
  on public.customers
  for all
  using (true)
  with check (true);

-- Seed some initial data
insert into public.customers (name, email, status, total_value, tags)
values
  ('Alice Johnson', 'alice@example.com', 'active', 1250.00, '{VIP, 2024}'),
  ('David Smith', 'david@example.com', 'lead', 0, '{New, Potential}'),
  ('Elena Rodriguez', 'elena@test.com', 'inactive', 500.00, '{2023}'),
  ('Michael Chen', 'chen@test.com', 'active', 5000.00, '{Whale, VIP}');
