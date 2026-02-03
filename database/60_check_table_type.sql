-- 60_check_table_type.sql
-- Check if 'vendors' is a BASE TABLE or a VIEW

SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'vendors';
