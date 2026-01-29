-- ============================================
-- RBAC & MULTI-TENANCY MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 0. RENAME EXISTING ROLES TABLE (Staff Positions)
-- This preserves Driver, Guide, Agent, etc.
-- ============================================
DO $$
BEGIN
    -- Rename roles to staff_positions if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public') THEN
        -- Check if staff_positions doesn't already exist
        IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'staff_positions' AND table_schema = 'public') THEN
            ALTER TABLE roles RENAME TO staff_positions;
            RAISE NOTICE 'Renamed roles to staff_positions';
        END IF;
    END IF;
    
    -- Update the foreign key column name in staff table if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'role_id') THEN
        ALTER TABLE staff RENAME COLUMN role_id TO position_id;
        RAISE NOTICE 'Renamed staff.role_id to staff.position_id';
    END IF;
END $$;

-- ============================================
-- 1. TENANTS (Organizations/Clients)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- 2. MODULES (Purchasable Features)
-- ============================================
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Seed initial modules
INSERT INTO modules (code, name, description) VALUES
    ('crm', 'CRM', 'Customer relationship management'),
    ('bookings', 'Bookings Platform', 'Experience booking and availability management'),
    ('transportation', 'Transportation', 'Vehicles, vendors, pickup points, hotels, schedules'),
    ('communications', 'Communications', 'Phone system, AI agents, live agents'),
    ('visibility', 'Visibility', 'OTA, website, social media, blog management'),
    ('finance', 'Finance', 'Billing, bank accounts, partners, reports'),
    ('settings', 'Settings', 'System configuration and customization')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 3. MODULE RESOURCES (For granular permissions)
-- ============================================
CREATE TABLE IF NOT EXISTS module_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    resource_code TEXT NOT NULL,
    resource_name TEXT NOT NULL,
    default_actions TEXT[] DEFAULT ARRAY['create', 'read', 'update', 'delete'],
    UNIQUE(module_id, resource_code)
);

-- Seed resources for each module
INSERT INTO module_resources (module_id, resource_code, resource_name)
SELECT m.id, r.resource_code, r.resource_name
FROM modules m
CROSS JOIN (VALUES
    -- CRM Resources
    ('crm', 'customers', 'Customers'),
    ('crm', 'customer_types', 'Customer Types'),
    -- Bookings Resources
    ('bookings', 'bookings', 'Bookings'),
    ('bookings', 'experiences', 'Experiences'),
    ('bookings', 'availabilities', 'Availabilities'),
    ('bookings', 'booking_options', 'Booking Options'),
    -- Transportation Resources
    ('transportation', 'vehicles', 'Vehicles'),
    ('transportation', 'vendors', 'Vendors'),
    ('transportation', 'pickup_points', 'Pickup Points'),
    ('transportation', 'hotels', 'Hotels'),
    ('transportation', 'schedules', 'Schedules'),
    -- Finance Resources
    ('finance', 'billing', 'Billing'),
    ('finance', 'bank_accounts', 'Bank Accounts'),
    ('finance', 'partners', 'Partners'),
    ('finance', 'reports', 'Reports'),
    ('finance', 'pricing', 'Pricing'),
    -- Settings Resources
    ('settings', 'custom_fields', 'Custom Fields'),
    ('settings', 'pricing_variations', 'Pricing Variations'),
    ('settings', 'users', 'Users'),
    ('settings', 'roles', 'Roles')
) AS r(module_code, resource_code, resource_name)
WHERE m.code = r.module_code
ON CONFLICT (module_id, resource_code) DO NOTHING;

-- ============================================
-- 4. TENANT SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id),
    starts_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'trial', 'expired', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, module_id)
);

-- ============================================
-- 5. USERS (All User Accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    
    -- Platform-level role (Tier 1)
    platform_role TEXT CHECK (platform_role IN ('developer', 'system_admin', NULL)),
    
    -- Tenant association (NULL for platform admins)
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    
    -- Tenant-level admin flag (Tier 2)
    is_tenant_admin BOOLEAN DEFAULT false,
    
    -- Auth fields
    password_hash TEXT,
    temp_password BOOLEAN DEFAULT false,
    supabase_auth_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- 6. ROLES (Client-Defined Custom Roles)
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6b7280',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- ============================================
-- 7. ROLE PERMISSIONS (Granular Access)
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module_code TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    scope JSONB DEFAULT '{}',
    UNIQUE(role_id, module_code, resource_type)
);

-- ============================================
-- 8. USER ROLE ASSIGNMENTS (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    assigned_by UUID REFERENCES users(id),
    UNIQUE(user_id, role_id)
);

-- ============================================
-- 9. ADD TENANT_ID TO EXISTING TABLES
-- ============================================

-- Customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Experiences
ALTER TABLE experiences 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Hotels
ALTER TABLE hotels 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Pickup Points
ALTER TABLE pickup_points 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Schedules
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Vehicles
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Vendors
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Staff
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Staff Positions (renamed from roles)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'staff_positions' AND table_schema = 'public') THEN
        EXECUTE 'ALTER TABLE staff_positions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
    END IF;
END $$;

-- Activity Logs (add tenant context)
ALTER TABLE activity_logs 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- ============================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_platform_role ON users(platform_role) WHERE platform_role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);

-- Indexes for tenant_id on existing tables
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_experiences_tenant ON experiences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hotels_tenant ON hotels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pickup_points_tenant ON pickup_points(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schedules_tenant ON schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id);

-- ============================================
-- 11. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_resources ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 12. CREATE DEFAULT TENANT & SUPERADMIN
-- ============================================

-- Create a default tenant for existing data
INSERT INTO tenants (id, name, slug) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Tenant', 'default')
ON CONFLICT (slug) DO NOTHING;

-- Assign existing data to default tenant
UPDATE customers SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE experiences SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE hotels SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE pickup_points SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE schedules SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE vehicles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE vendors SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE staff SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- Update staff_positions if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'staff_positions' AND table_schema = 'public') THEN
        EXECUTE 'UPDATE staff_positions SET tenant_id = ''00000000-0000-0000-0000-000000000001'' WHERE tenant_id IS NULL';
    END IF;
END $$;

-- Create SuperAdmin user (you can update password_hash later with proper hashing)
INSERT INTO users (id, email, name, platform_role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'funinthesundocs',
    'Admin',
    'developer',
    true
)
ON CONFLICT (email) DO UPDATE SET platform_role = 'developer';

INSERT INTO users (email, name, platform_role, is_active)
VALUES (
    'denis@crodesign.com',
    'Denis',
    'developer',
    true
)
ON CONFLICT (email) DO UPDATE SET platform_role = 'developer';

-- Give default tenant ALL module subscriptions
INSERT INTO tenant_subscriptions (tenant_id, module_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM modules
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- ============================================
-- 13. HELPER FUNCTION: Get user permissions
-- ============================================
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
    module_code TEXT,
    resource_type TEXT,
    can_create BOOLEAN,
    can_read BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        rp.module_code,
        rp.resource_type,
        bool_or(rp.can_create) as can_create,
        bool_or(rp.can_read) as can_read,
        bool_or(rp.can_update) as can_update,
        bool_or(rp.can_delete) as can_delete
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = p_user_id
    GROUP BY rp.module_code, rp.resource_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 14. HELPER FUNCTION: Check if user has module access
-- ============================================
CREATE OR REPLACE FUNCTION user_has_module_access(p_user_id UUID, p_module_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user users%ROWTYPE;
    v_has_subscription BOOLEAN;
BEGIN
    -- Get user
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    
    -- Platform admins have access to everything
    IF v_user.platform_role IN ('developer', 'system_admin') THEN
        RETURN true;
    END IF;
    
    -- Check if tenant has subscription to this module
    SELECT EXISTS (
        SELECT 1 FROM tenant_subscriptions ts
        JOIN modules m ON ts.module_id = m.id
        WHERE ts.tenant_id = v_user.tenant_id
        AND m.code = p_module_code
        AND ts.status = 'active'
        AND (ts.expires_at IS NULL OR ts.expires_at > now())
    ) INTO v_has_subscription;
    
    RETURN v_has_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
