
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkStatuses() {
    console.log("Checking check_in_statuses table...");
    const { data, error } = await supabase.from('check_in_statuses').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${data.length} statuses:`);
        console.log(JSON.stringify(data, null, 2));
    }
}

checkStatuses();
