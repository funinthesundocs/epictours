
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
    const { count } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).like('confirmation_number', 'ACI-%');
    console.log('Total ACI Bookings:', count);
}
check();
