-- Backfill: Schedule Stops Organization ID
-- Description: Updates schedule_stops with the organization_id from their parent schedule.

DO $$
BEGIN
    -- Update schedule_stops based on parent schedule's organization_id
    UPDATE schedule_stops ss
    SET organization_id = s.organization_id
    FROM schedules s
    WHERE ss.schedule_id = s.id
    AND ss.organization_id IS NULL
    AND s.organization_id IS NOT NULL;

    RAISE NOTICE 'Backfilled organization_id for schedule_stops.';
END $$;
