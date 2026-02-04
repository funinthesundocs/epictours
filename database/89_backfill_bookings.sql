-- Backfill Bookings Organization ID
-- Description: Assigns the 'Aloha' Organization ID to all bookings that currently have NULL.
-- This restores visibility for legacy bookings hidden by RLS.

DO $$
DECLARE
    target_org_id UUID := '6065c460-ce9c-418a-8071-6367f8a20f35';
    updated_count INTEGER;
BEGIN
    -- Update bookings where organization_id is NULL
    UPDATE public.bookings
    SET organization_id = target_org_id
    WHERE organization_id IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Backfilled % bookings to Organization %', updated_count, target_org_id;
END $$;
