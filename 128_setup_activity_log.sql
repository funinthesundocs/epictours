-- 128_setup_activity_log.sql

-- 1. Create the activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL,
    record_id TEXT, -- Flexible enough to store UUIDs or Integer IDs as string
    old_data JSONB, -- Valid only for UPDATE/DELETE
    new_data JSONB, -- Valid only for INSERT/UPDATE
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::JSONB -- Extra context if needed
);

-- 2. Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Viewable by authenticated users (Refine based on role if needed)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.activity_logs;
-- 3. Policy: Viewable by all users (for Dev/Bypass Verify)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.activity_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.activity_logs;

CREATE POLICY "Enable read access for all users" ON public.activity_logs
    FOR SELECT
    USING (true);

-- 4. Create the generic trigger function
CREATE OR REPLACE FUNCTION log_activity_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    record_identifier TEXT;
BEGIN
    -- Try to get current user ID from Supabase auth context
    current_user_id := auth.uid();
    
    -- Determine record ID (assumes 'id' column exists, adaptable)
    IF (TG_OP = 'DELETE') THEN
        record_identifier := OLD.id::TEXT;
    ELSE
        record_identifier := NEW.id::TEXT;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.activity_logs (user_id, action, table_name, record_id, new_data)
        VALUES (current_user_id, TG_OP, TG_TABLE_NAME, record_identifier, row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Only log if actual data changed (ignoring updated_at)
        IF NEW IS DISTINCT FROM OLD THEN
            INSERT INTO public.activity_logs (user_id, action, table_name, record_id, old_data, new_data)
            VALUES (current_user_id, TG_OP, TG_TABLE_NAME, record_identifier, row_to_json(OLD), row_to_json(NEW));
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.activity_logs (user_id, action, table_name, record_id, old_data)
        VALUES (current_user_id, TG_OP, TG_TABLE_NAME, record_identifier, row_to_json(OLD));
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Attach trigger to desired tables (Safe to re-run/drop existing)

-- Vendors
DROP TRIGGER IF EXISTS log_vendors_activity ON vendors;
CREATE TRIGGER log_vendors_activity
    AFTER INSERT OR UPDATE OR DELETE ON vendors
    FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();

-- Customers
DROP TRIGGER IF EXISTS log_customers_activity ON customers;
CREATE TRIGGER log_customers_activity
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();

-- Vehicles
DROP TRIGGER IF EXISTS log_vehicles_activity ON vehicles;
CREATE TRIGGER log_vehicles_activity
    AFTER INSERT OR UPDATE OR DELETE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();

-- Bookings
DROP TRIGGER IF EXISTS log_bookings_activity ON bookings;
CREATE TRIGGER log_bookings_activity
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();

-- Availabilities
DROP TRIGGER IF EXISTS log_availabilities_activity ON availabilities;
CREATE TRIGGER log_availabilities_activity
    AFTER INSERT OR UPDATE OR DELETE ON availabilities
    FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();


-- Settings: Staff & Roles
DROP TRIGGER IF EXISTS log_staff_activity ON staff;
CREATE TRIGGER log_staff_activity
    AFTER INSERT OR UPDATE OR DELETE ON staff
    FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();

DROP TRIGGER IF EXISTS log_roles_activity ON roles;
CREATE TRIGGER log_roles_activity
    AFTER INSERT OR UPDATE OR DELETE ON roles
    FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();

-- Settings: Custom Fields
DROP TRIGGER IF EXISTS log_custom_fields_activity ON custom_fields;
CREATE TRIGGER log_custom_fields_activity
    AFTER INSERT OR UPDATE OR DELETE ON custom_fields
    FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();

DROP TRIGGER IF EXISTS log_custom_field_definitions_activity ON custom_field_definitions;
CREATE TRIGGER log_custom_field_definitions_activity
    AFTER INSERT OR UPDATE OR DELETE ON custom_field_definitions
    FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();

-- Settings: Customer Types
DROP TRIGGER IF EXISTS log_customer_types_activity ON customer_types;
CREATE TRIGGER log_customer_types_activity
    AFTER INSERT OR UPDATE OR DELETE ON customer_types
    FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();

-- Settings: Pricing
DROP TRIGGER IF EXISTS log_pricing_schedules_activity ON pricing_schedules;
CREATE TRIGGER log_pricing_schedules_activity
    AFTER INSERT OR UPDATE OR DELETE ON pricing_schedules
    FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();

DROP TRIGGER IF EXISTS log_pricing_rates_activity ON pricing_rates;
CREATE TRIGGER log_pricing_rates_activity
    AFTER INSERT OR UPDATE OR DELETE ON pricing_rates
    FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();

DROP TRIGGER IF EXISTS log_pricing_variations_activity ON pricing_variations;
CREATE TRIGGER log_pricing_variations_activity
    AFTER INSERT OR UPDATE OR DELETE ON pricing_variations
    FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();


-- Users / Profiles (Assuming 'users' table in public for profiles, not auth.users)
-- Check valid table generic triggers if needed. 
-- For now, sticking to the core business entities.
