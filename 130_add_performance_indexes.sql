-- 130_add_performance_indexes.sql
-- Adds indexes for improved query performance across the application

-- ============================================
-- ACTIVITY LOGS (High-traffic lookup table)
-- ============================================

-- Index for date-based queries (most common: "recent activity")
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
    ON activity_logs(created_at DESC);

-- Index for filtering by table name
CREATE INDEX IF NOT EXISTS idx_activity_logs_table_name 
    ON activity_logs(table_name);

-- Composite index for common query pattern: filter by table + sort by date
CREATE INDEX IF NOT EXISTS idx_activity_logs_table_date 
    ON activity_logs(table_name, created_at DESC);


-- ============================================
-- BOOKINGS (Core business table)
-- Note: idx_bookings_availability_id and idx_bookings_customer_id already exist
-- ============================================

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status 
    ON bookings(status);

-- Created date for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_bookings_created_at 
    ON bookings(created_at DESC);


-- ============================================
-- AVAILABILITIES (Calendar-heavy queries)
-- ============================================

-- Date-based queries
CREATE INDEX IF NOT EXISTS idx_availabilities_date 
    ON availabilities(start_time);

-- Experience filtering
CREATE INDEX IF NOT EXISTS idx_availabilities_experience_id 
    ON availabilities(experience_id);

-- Composite: Experience + Date (common calendar query)
CREATE INDEX IF NOT EXISTS idx_availabilities_exp_date 
    ON availabilities(experience_id, start_time);


-- ============================================
-- CUSTOMERS (CRM lookups)
-- ============================================

-- Name search
CREATE INDEX IF NOT EXISTS idx_customers_name 
    ON customers(name);

-- Email lookup
CREATE INDEX IF NOT EXISTS idx_customers_email 
    ON customers(email);


-- ============================================
-- VENDORS (Supplier lookups)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_vendors_name 
    ON vendors(name);


-- ============================================
-- STAFF (Operations features)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_staff_name 
    ON staff(name);

CREATE INDEX IF NOT EXISTS idx_staff_role_id 
    ON staff(role_id);


-- Add helpful comments
COMMENT ON INDEX idx_activity_logs_created_at IS 'Optimizes recent activity queries';
COMMENT ON INDEX idx_availabilities_exp_date IS 'Optimizes availability calendar lookups';
