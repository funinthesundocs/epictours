import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase_gen'

/**
 * Admin Supabase client that bypasses RLS using service role key.
 * Use this for server-side operations that need to access data across organizations.
 * 
 * IMPORTANT: Only use this for internal operations where the calling code
 * has already verified authorization. Never expose this client to user actions
 * without proper permission checks.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// If service role key is available, use it; otherwise fall back to anon key
// This allows the app to work in dev without service key, but may have RLS issues
const effectiveKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseAdmin = createClient<Database>(supabaseUrl, effectiveKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Flag to check if we're using service role
export const isUsingServiceRole = !!supabaseServiceKey
