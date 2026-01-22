-- Helper to assign the first booking option schedule to all availabilities
DO $$ 
DECLARE 
    schedule_id UUID;
BEGIN
    SELECT id INTO schedule_id FROM public.booking_option_schedules LIMIT 1;
    
    IF schedule_id IS NOT NULL THEN
        UPDATE public.availabilities
        SET booking_option_schedule_id = schedule_id
        WHERE booking_option_schedule_id IS NULL;
    END IF;
END $$;
