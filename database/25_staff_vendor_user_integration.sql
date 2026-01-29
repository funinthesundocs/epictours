-- ============================================
-- STAFF & VENDOR USER INTEGRATION
-- Links staff and vendors to optional user accounts
-- ============================================

-- 1. Add user_id to staff table (optional link to user account)
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Add user_id to vendors table (optional link to user account)
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 3. Create default roles for staff and vendor users
-- These can be assigned when creating user accounts for staff/vendors

-- Get the default tenant (or create one if missing)
DO $$
DECLARE
    default_tenant_id UUID;
    staff_role_id UUID;
    vendor_role_id UUID;
BEGIN
    -- Get or create default tenant
    SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
    
    IF default_tenant_id IS NULL THEN
        INSERT INTO tenants (name, slug) VALUES ('Default Organization', 'default')
        RETURNING id INTO default_tenant_id;
    END IF;

    -- Create "Staff Member" role with transportation read access
    INSERT INTO roles (tenant_id, name, description, color, is_default)
    VALUES (default_tenant_id, 'Staff Member', 'Default role for staff members with limited read access', '#10b981', false)
    ON CONFLICT (tenant_id, name) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO staff_role_id;

    -- Add permissions for Staff Member role
    INSERT INTO role_permissions (role_id, module_code, resource_type, can_create, can_read, can_update, can_delete)
    VALUES 
        -- Transportation: read-only access
        (staff_role_id, 'transportation', 'vehicles', false, true, false, false),
        (staff_role_id, 'transportation', 'pickup_points', false, true, false, false),
        (staff_role_id, 'transportation', 'hotels', false, true, false, false),
        (staff_role_id, 'transportation', 'schedules', false, true, false, false),
        -- Bookings: read-only access
        (staff_role_id, 'bookings', 'bookings', false, true, false, false),
        (staff_role_id, 'bookings', 'availabilities', false, true, false, false)
    ON CONFLICT (role_id, module_code, resource_type) DO NOTHING;

    -- Create "Vendor Contact" role with limited access
    INSERT INTO roles (tenant_id, name, description, color, is_default)
    VALUES (default_tenant_id, 'Vendor Contact', 'Default role for vendor portal users', '#f59e0b', false)
    ON CONFLICT (tenant_id, name) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO vendor_role_id;

    -- Add permissions for Vendor Contact role
    INSERT INTO role_permissions (role_id, module_code, resource_type, can_create, can_read, can_update, can_delete)
    VALUES 
        -- Transportation: read schedules and pickup points
        (vendor_role_id, 'transportation', 'schedules', false, true, false, false),
        (vendor_role_id, 'transportation', 'pickup_points', false, true, false, false),
        -- Bookings: read bookings
        (vendor_role_id, 'bookings', 'bookings', false, true, false, false)
    ON CONFLICT (role_id, module_code, resource_type) DO NOTHING;

    RAISE NOTICE 'Created Staff Member role (%) and Vendor Contact role (%)', staff_role_id, vendor_role_id;
END $$;

-- 4. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id) WHERE user_id IS NOT NULL;
