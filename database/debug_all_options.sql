-- Dump all booking option schedules to check names and JSON structure
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, name, config_retail FROM public.booking_option_schedules
    LOOP
        RAISE NOTICE 'ID: %, Name: "%", JSON: %', r.id, r.name, r.config_retail;
    END LOOP;
END $$;
