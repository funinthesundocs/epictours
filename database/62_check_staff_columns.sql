-- 62_check_staff_columns.sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'staff';
