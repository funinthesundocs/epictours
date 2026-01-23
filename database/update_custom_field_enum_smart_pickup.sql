-- Update custom_field_definitions to allow 'smart_pickup' and 'number' types

-- 1. Drop the existing constraint
ALTER TABLE public.custom_field_definitions 
DROP CONSTRAINT IF EXISTS custom_field_definitions_type_check;

-- 2. Add the updated constraint including 'smart_pickup' and 'number'
ALTER TABLE public.custom_field_definitions 
ADD CONSTRAINT custom_field_definitions_type_check 
CHECK (type IN (
    'text', 
    'textarea', 
    'select', 
    'quantity', 
    'checkbox', 
    'transport', 
    'header', 
    'date', 
    'number',
    'smart_pickup'
));
