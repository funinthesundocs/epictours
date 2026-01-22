-- Check if custom_fields table exists and show its columns
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'custom_fields';
