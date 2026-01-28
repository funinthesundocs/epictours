-- 129_optimize_activity_log_storage.sql
-- Optimizes activity log storage by only storing changed fields for UPDATE operations

-- Update the trigger function to only store changed values
CREATE OR REPLACE FUNCTION log_activity_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    record_identifier TEXT;
    old_json JSONB;
    new_json JSONB;
    changed_old JSONB := '{}'::JSONB;
    changed_new JSONB := '{}'::JSONB;
    key TEXT;
BEGIN
    -- Try to get current user ID from Supabase auth context
    current_user_id := auth.uid();
    
    -- Determine record ID (assumes 'id' column exists)
    IF (TG_OP = 'DELETE') THEN
        record_identifier := OLD.id::TEXT;
    ELSE
        record_identifier := NEW.id::TEXT;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        -- For INSERT: Store only essential fields (name/label + id) to reduce size
        new_json := row_to_json(NEW)::JSONB;
        INSERT INTO public.activity_logs (user_id, action, table_name, record_id, new_data)
        VALUES (
            current_user_id, 
            TG_OP, 
            TG_TABLE_NAME, 
            record_identifier, 
            jsonb_build_object(
                'id', new_json->>'id',
                'name', COALESCE(new_json->>'name', new_json->>'label', new_json->>'title', null)
            )
        );
        RETURN NEW;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Only log if actual data changed
        IF NEW IS DISTINCT FROM OLD THEN
            old_json := row_to_json(OLD)::JSONB;
            new_json := row_to_json(NEW)::JSONB;
            
            -- Build objects containing only the changed fields
            FOR key IN SELECT jsonb_object_keys(new_json)
            LOOP
                -- Skip metadata fields that change frequently but aren't meaningful
                IF key NOT IN ('updated_at', 'created_at') THEN
                    IF (old_json->key IS DISTINCT FROM new_json->key) THEN
                        changed_old := changed_old || jsonb_build_object(key, old_json->key);
                        changed_new := changed_new || jsonb_build_object(key, new_json->key);
                    END IF;
                END IF;
            END LOOP;
            
            -- Only insert if there are actual changes (beyond timestamps)
            IF changed_new != '{}'::JSONB THEN
                -- Always include identifier fields for context
                changed_new := changed_new || jsonb_build_object(
                    'id', new_json->>'id',
                    'name', COALESCE(new_json->>'name', new_json->>'label', new_json->>'title', null)
                );
                
                INSERT INTO public.activity_logs (user_id, action, table_name, record_id, old_data, new_data)
                VALUES (current_user_id, TG_OP, TG_TABLE_NAME, record_identifier, changed_old, changed_new);
            END IF;
        END IF;
        RETURN NEW;
        
    ELSIF (TG_OP = 'DELETE') THEN
        -- For DELETE: Store only essential fields for reference
        old_json := row_to_json(OLD)::JSONB;
        INSERT INTO public.activity_logs (user_id, action, table_name, record_id, old_data)
        VALUES (
            current_user_id, 
            TG_OP, 
            TG_TABLE_NAME, 
            record_identifier, 
            jsonb_build_object(
                'id', old_json->>'id',
                'name', COALESCE(old_json->>'name', old_json->>'label', old_json->>'title', null)
            )
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comment
COMMENT ON FUNCTION log_activity_trigger() IS 'Optimized activity logging - stores only changed fields for UPDATEs, essential fields for INSERT/DELETE';
