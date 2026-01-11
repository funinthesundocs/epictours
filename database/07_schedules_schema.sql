-- 1. Schedules Table (Master)
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time text, -- e.g. "7:00 AM"
  created_at timestamptz default now()
);

alter table public.schedules enable row level security;
create policy "Enable all access for authenticated users" on public.schedules for all using (true);

-- 2. Schedule Stops Table (Detail)
create table if not exists public.schedule_stops (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references public.schedules(id) on delete cascade,
  pickup_point_id uuid references public.pickup_points(id),
  pickup_time text, -- e.g. "7:15 AM"
  order_index int default 0,
  created_at timestamptz default now()
);

alter table public.schedule_stops enable row level security;
create policy "Enable all access for authenticated users" on public.schedule_stops for all using (true);

-- Seed Data (Example "Circle Island" schedule)
DO $$
DECLARE
  sid uuid;
  pid1 uuid;
  pid2 uuid;
BEGIN
  -- insert schedule
  INSERT INTO public.schedules (name, start_time) 
  VALUES ('Hawaii Circle Island', '7:00 AM') 
  RETURNING id INTO sid;

  -- get pickup point ids (assuming seed data exists)
  SELECT id INTO pid1 FROM public.pickup_points WHERE name = 'The Duke Statue' LIMIT 1;
  SELECT id INTO pid2 FROM public.pickup_points WHERE name = 'Ilikai Hotel (Flag Pole)' LIMIT 1;

  -- insert stops if pickups exist
  IF pid1 IS NOT NULL THEN
    INSERT INTO public.schedule_stops (schedule_id, pickup_point_id, pickup_time, order_index)
    VALUES (sid, pid1, '7:15 AM', 1);
  END IF;

  IF pid2 IS NOT NULL THEN
    INSERT INTO public.schedule_stops (schedule_id, pickup_point_id, pickup_time, order_index)
    VALUES (sid, pid2, '7:30 AM', 2);
  END IF;

END $$;
