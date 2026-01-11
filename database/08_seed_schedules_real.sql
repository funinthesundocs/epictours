-- Seed Real Schedule Data
-- Clears existing schedules/stops to avoid duplicates if run multiple times.
TRUNCATE TABLE public.schedules CASCADE;

DO $$
DECLARE
  aci_id uuid;
  go_id uuid;
  ir_id uuid;
  
  -- Pickup Point IDs
  p_ilikai uuid;
  p_army uuid;
  p_wyndham uuid;
  p_ross uuid;
  p_duke uuid;
  p_twinfin uuid;
  p_pagoda uuid;
  p_alamoana uuid;
  p_outrigger uuid;
  p_gateway uuid;
  p_hyattkoa uuid;
  p_newotani uuid;
  p_redlobster uuid;
  p_holidayinn uuid;
  p_kalai uuid;
  p_lacroix uuid;
  p_hyattplace uuid;
BEGIN

  -- 1. Create Schedules
  INSERT INTO public.schedules (name, start_time) VALUES ('ACI (Starting 9-1-24)', '6:30 AM') RETURNING id INTO aci_id;
  INSERT INTO public.schedules (name, start_time) VALUES ('Go Hawaii Route', '6:45 AM') RETURNING id INTO go_id;
  INSERT INTO public.schedules (name, start_time) VALUES ('IR Route', '7:15 AM') RETURNING id INTO ir_id;

  -- 2. Lookup Pickup IDs (Store in variables for cleaner inserts)
  SELECT id INTO p_ilikai FROM public.pickup_points WHERE name = 'Ilikai Hotel (Flag Pole)';
  SELECT id INTO p_army FROM public.pickup_points WHERE name = 'Army Museum (Roundabout)';
  SELECT id INTO p_wyndham FROM public.pickup_points WHERE name = 'Wyndham Royal Garden Hotel';
  SELECT id INTO p_ross FROM public.pickup_points WHERE name = 'Ross on Seaside Ave.';
  SELECT id INTO p_duke FROM public.pickup_points WHERE name = 'The Duke Statue';
  SELECT id INTO p_twinfin FROM public.pickup_points WHERE name = 'Twin Fin Hotel (FKA Aston Waikiki Beach)';
  SELECT id INTO p_pagoda FROM public.pickup_points WHERE name = 'Pagoda Hotel';
  SELECT id INTO p_alamoana FROM public.pickup_points WHERE name = 'Ala Moana Hotel';
  SELECT id INTO p_outrigger FROM public.pickup_points WHERE name = 'Outrigger Reef Hotel';
  SELECT id INTO p_gateway FROM public.pickup_points WHERE name = 'Waikiki Gateway';
  SELECT id INTO p_hyattkoa FROM public.pickup_points WHERE name = 'Hyatt on Koa Ave';
  SELECT id INTO p_newotani FROM public.pickup_points WHERE name = 'New Otani Hotel';
  SELECT id INTO p_redlobster FROM public.pickup_points WHERE name = 'Red Lobster';
  SELECT id INTO p_holidayinn FROM public.pickup_points WHERE name = 'Holiday Inn Express';
  SELECT id INTO p_kalai FROM public.pickup_points WHERE name = 'Ka La''i Hotel (Old Trump Tower)';
  SELECT id INTO p_lacroix FROM public.pickup_points WHERE name = 'La Croix Hotel';
  SELECT id INTO p_hyattplace FROM public.pickup_points WHERE name = 'Hyatt Place Hotel';

  -- 3. Insert Stops: ACI
  IF aci_id IS NOT NULL THEN
    INSERT INTO public.schedule_stops (schedule_id, pickup_time, pickup_point_id, order_index) VALUES
    (aci_id, '6:30 AM', p_ilikai, 1),
    (aci_id, '6:40 AM', p_army, 2),
    (aci_id, '6:45 AM', p_wyndham, 3),
    (aci_id, '6:50 AM', p_ross, 4),
    (aci_id, '6:55 AM', p_duke, 5),
    (aci_id, '7:00 AM', p_twinfin, 6);
  END IF;

  -- 4. Insert Stops: Go Hawaii
  IF go_id IS NOT NULL THEN
     INSERT INTO public.schedule_stops (schedule_id, pickup_time, pickup_point_id, order_index) VALUES
     (go_id, '6:45 AM', p_pagoda, 1),
     (go_id, '6:50 AM', p_alamoana, 2),
     (go_id, '6:55 AM', p_ilikai, 3),
     (go_id, '7:00 AM', p_outrigger, 4),
     (go_id, '7:05 AM', p_gateway, 5),
     (go_id, '7:10 AM', p_ross, 6),
     (go_id, '7:15 AM', p_hyattkoa, 7),
     (go_id, '7:25 AM', p_newotani, 8);
  END IF;

  -- 5. Insert Stops: IR Route
  IF ir_id IS NOT NULL THEN
    INSERT INTO public.schedule_stops (schedule_id, pickup_time, pickup_point_id, order_index) VALUES
    (ir_id, '7:15 AM', p_alamoana, 1),
    (ir_id, '7:30 AM', p_redlobster, 2),
    (ir_id, '7:30 AM', p_holidayinn, 3),
    (ir_id, '7:30 AM', p_kalai, 4),
    (ir_id, '7:30 AM', p_lacroix, 5),
    (ir_id, '7:40 AM', p_ross, 6),
    (ir_id, '7:40 AM', p_hyattkoa, 7),
    (ir_id, '7:45 AM', p_hyattplace, 8);
  END IF;

END $$;
