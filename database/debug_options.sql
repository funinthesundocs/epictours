DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT name, config_retail FROM public.booking_option_schedules WHERE name = 'Aloha Circle Island'
    LOOP
        RAISE NOTICE 'Schedule: %, Retail Config: %', r.name, r.config_retail;
    END LOOP;
END $$;
