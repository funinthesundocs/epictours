-- ============================================
-- ADD PARTNER/AFFILIATE ROLES & ORGANIZATION MANAGEMENT MODULE
-- Migration ID: 31
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure 'organization_management' module exists (or rename/alias)
INSERT INTO modules (code, name, description)
VALUES ('organization_management', 'Organization Management', 'Management of organization structure, partners, and settings')
ON CONFLICT (code) DO NOTHING;

-- 2. Add 'partners' and 'affiliates' as resources under this module if not exists
INSERT INTO module_resources (module_id, resource_code, resource_name)
SELECT m.id, 'partners', 'Partners'
FROM modules m
WHERE m.code = 'organization_management'
ON CONFLICT (module_id, resource_code) DO NOTHING;

INSERT INTO module_resources (module_id, resource_code, resource_name)
SELECT m.id, 'affiliates', 'Affiliates'
FROM modules m
WHERE m.code = 'organization_management'
ON CONFLICT (module_id, resource_code) DO NOTHING;


-- 3. Seed 'Partner' and 'Affiliate' Roles for the Default Tenant
-- (Assuming default tenant ID from 24_users_and_rbac.sql: 00000000-0000-0000-0000-000000000001)

-- Partner Role
INSERT INTO roles (tenant_id, name, description, color, is_default)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'Partner', 
    'External partner with limited access', 
    '#3b82f6', -- Blue
    false
)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Affiliate Role
INSERT INTO roles (tenant_id, name, description, color, is_default)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'Affiliate', 
    'External affiliate with restricted visibility', 
    '#10b981', -- Green
    false
)
ON CONFLICT (tenant_id, name) DO NOTHING;


-- 4. Assign Default Permissions to these Roles (Optional example)
-- Granting read access to 'partners' resource for Partner role as an example
-- You can define specific permissions here.

DO $$
DECLARE
    v_partner_role_id UUID;
    v_affiliate_role_id UUID;
    v_org_mgmt_code TEXT := 'organization_management';
BEGIN
    SELECT id INTO v_partner_role_id FROM roles WHERE name = 'Partner' AND tenant_id = '00000000-0000-0000-0000-000000000001';
    SELECT id INTO v_affiliate_role_id FROM roles WHERE name = 'Affiliate' AND tenant_id = '00000000-0000-0000-0000-000000000001';

    -- Partner Permissions
    IF v_partner_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, module_code, resource_type, can_create, can_read, can_update, can_delete)
        VALUES 
            (v_partner_role_id, v_org_mgmt_code, 'partners', false, true, false, false) -- View self/others?
        ON CONFLICT (role_id, module_code, resource_type) DO UPDATE 
        SET can_read = true;
    END IF;

    -- Affiliate Permissions
    IF v_affiliate_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, module_code, resource_type, can_create, can_read, can_update, can_delete)
        VALUES 
            (v_affiliate_role_id, v_org_mgmt_code, 'affiliates', false, true, false, false)
        ON CONFLICT (role_id, module_code, resource_type) DO UPDATE 
        SET can_read = true;
    END IF;
END $$;
