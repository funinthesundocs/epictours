-- Secure Bookings Table
-- Description: Enables strict RLS and ensures organization_id exists on bookings.

-- 1. Ensure organization_id column exists
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 2. Backfill existing bookings (optional, if any exist without org)
-- Defaulting to Aloha Circle Island only if null
DO $$
DECLARE
    target_org_id UUID := '6065c460-ce9c-418a-8071-6367f8a20f35';
BEGIN
    UPDATE public.bookings
    SET organization_id = target_org_id
    WHERE organization_id IS NULL;
END $$;

-- 3. Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 4. Drop permissive policies
DROP POLICY IF EXISTS "Enable all for public" ON public.bookings;
DROP POLICY IF EXISTS "Allow all access" ON public.bookings;

-- 5. Create strict policies
-- View: Members of the organization
-- View: Members of the organization
CREATE POLICY "View organization bookings" ON public.bookings
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
        OR 
        auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
    );

-- Insert: Must assign to own organization
CREATE POLICY "Create organization bookings" ON public.bookings
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
        OR 
        auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
    );

-- Update: Must belong to organization
CREATE POLICY "Update organization bookings" ON public.bookings
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
        OR 
        auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
    );

-- Delete: Must belong to organization
CREATE POLICY "Delete organization bookings" ON public.bookings
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_users 
            WHERE user_id = auth.uid()
        )
        OR 
        auth.uid() IN (SELECT id FROM public.users WHERE (is_platform_super_admin = true OR is_platform_system_admin = true))
    );

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
