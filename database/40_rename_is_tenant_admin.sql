-- Migration: Rename is_tenant_admin to is_organization_admin in users table
-- This completes the tenant → organization renaming

-- Rename the is_tenant_admin column to is_organization_admin
ALTER TABLE users 
RENAME COLUMN is_tenant_admin TO is_organization_admin;

-- Add comment for documentation
COMMENT ON COLUMN users.is_organization_admin IS 'Whether the user is an admin of their organization (renamed from is_tenant_admin)';
