-- 1. Vehicles Table
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity int not null default 0,
  plate_number text,
  status text not null default 'active', -- active, maintenance, retired
  created_at timestamptz default now()
);

alter table public.vehicles enable row level security;
create policy "Enable all access for authenticated users" on public.vehicles for all using (true);

-- 2. Pickup Points Table
create table if not exists public.pickup_points (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  map_link text,
  instructions text, -- e.g., "Wait at the curb"
  created_at timestamptz default now()
);

alter table public.pickup_points enable row level security;
create policy "Enable all access for authenticated users" on public.pickup_points for all using (true);

-- 3. Hotels Table (Linked to Pickup Points)
create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  pickup_point_id uuid references public.pickup_points(id),
  created_at timestamptz default now()
);

alter table public.hotels enable row level security;
create policy "Enable all access for authenticated users" on public.hotels for all using (true);

-- Seed Data
insert into public.vehicles (name, capacity, plate_number, status) values
('Van 1', 14, 'ABC-123', 'active'),
('Bus A', 25, 'BUS-999', 'maintenance'),
('VIP SUV', 6, 'VIP-001', 'active');

insert into public.pickup_points (name, map_link, instructions) values
('Waikiki Gateway', 'https://maps.google.com/?q=Waikiki+Gateway', 'Front entrance'),
('Sheraton Waikiki Bus Depot', 'https://maps.google.com/?q=Aloha+Landing', 'Aloha Landing Bus Depot'),
('Hilton Hawaiian Village', 'https://maps.google.com/?q=Grand+Islander', 'Grand Islander Bus Stop');

-- Seed Hotels (Linking to Pickup Points dynamically would be ideal, but for seed we use implicit knowledge or update later. 
-- For now, just inserting basic hotels, we can link them in the UI).
insert into public.hotels (name, address, phone) values
('Sheraton Waikiki', '2255 Kalakaua Ave', '808-922-4422'),
('Hilton Hawaiian Village', '2005 Kalia Rd', '808-949-4321'),
('Halekulani', '2199 Kalia Rd', '808-923-2311');
