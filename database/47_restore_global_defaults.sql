-- ============================================================
-- 47_restore_global_defaults.sql
-- Restore Global Default permission groups and fix RLS
-- ============================================================

BEGIN;

-- 0. Allow Global Defaults (NULL orgs)
ALTER TABLE roles ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE staff_positions ALTER COLUMN organization_id DROP NOT NULL;

-- 1. Update RLS Policies to allow viewing Global Defaults (organization_id IS NULL)
-- ROLES
DROP POLICY IF EXISTS "Org members can view roles" ON roles;
CREATE POLICY "Org members can view roles" ON roles
    FOR SELECT
    USING (
        organization_id IS NULL 
        OR 
        organization_id IN (
            SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

-- POSITIONS
DROP POLICY IF EXISTS "Org members can view positions" ON staff_positions;
CREATE POLICY "Org members can view positions" ON staff_positions
    FOR SELECT
    USING (
        organization_id IS NULL 
        OR 
        organization_id IN (
            SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

-- 2. Seed Global Default Roles
-- We use unique constraints or checks if possible, otherwise use WHERE NOT EXISTS

INSERT INTO roles (id, name, description, organization_id, color)
VALUES 
    (gen_random_uuid(), 'Staff', 'Internal staff members', NULL, '#3b82f6'),
    (gen_random_uuid(), 'Partner', 'External partners', NULL, '#10b981'),
    (gen_random_uuid(), 'Affiliate', 'Affiliate marketers', NULL, '#f59e0b'),
    (gen_random_uuid(), 'Vendor Contact', 'Contacts at vendor organizations', NULL, '#8b5cf6')
ON CONFLICT DO NOTHING;
-- If constraints prevent "ON CONFLICT" on (name, NULL), try manual select insert:
INSERT INTO roles (name, description, organization_id, color)
SELECT 'Staff', 'Internal staff members', NULL, '#3b82f6'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Staff' AND organization_id IS NULL);

INSERT INTO roles (name, description, organization_id, color)
SELECT 'Partner', 'External partners', NULL, '#10b981'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Partner' AND organization_id IS NULL);

INSERT INTO roles (name, description, organization_id, color)
SELECT 'Affiliate', 'Affiliate marketers', NULL, '#f59e0b'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Affiliate' AND organization_id IS NULL);

INSERT INTO roles (name, description, organization_id, color)
SELECT 'Vendor Contact', 'Contacts at vendor organizations', NULL, '#8b5cf6'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Vendor Contact' AND organization_id IS NULL);


-- 3. Seed "Office Staff" position into the Global "Staff" Role
DO $$
DECLARE
    global_staff_role_id UUID;
BEGIN
    SELECT id INTO global_staff_role_id FROM roles WHERE name = 'Staff' AND organization_id IS NULL LIMIT 1;
    
    IF global_staff_role_id IS NOT NULL THEN
        INSERT INTO staff_positions (name, default_role_id, color, organization_id)
        SELECT 'Office Staff', global_staff_role_id, '#64748b', NULL
        WHERE NOT EXISTS (SELECT 1 FROM staff_positions WHERE name = 'Office Staff' AND organization_id IS NULL);
    END IF;
END $$;

COMMIT;
