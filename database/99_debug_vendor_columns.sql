-- 99_debug_vendor_columns.sql
-- Check the columns of the vendors table to ensure 'id' exists.

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'vendors';
