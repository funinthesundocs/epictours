-- Backfill: Custom Fields Organization ID
-- Description: Updates null organization_id in custom_field_definitions to the Aloha Circle Island org.

DO $$
DECLARE
    target_org_id UUID := '6065c460-ce9c-418a-8071-6367f8a20f35';
BEGIN
    -- Update existing fields that have no organization_id
    UPDATE custom_field_definitions
    SET organization_id = target_org_id
    WHERE organization_id IS NULL;

    RAISE NOTICE 'Backfilled organization_id for % custom fields.', (SELECT COUNT(*) FROM custom_field_definitions WHERE organization_id = target_org_id);
END $$;
