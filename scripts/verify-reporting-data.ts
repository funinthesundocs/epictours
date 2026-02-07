
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
    console.log("Checking Bookings for Jan 6-9, 2026...");

    // Check Availabilities first
    const { data: avails } = await supabase
        .from('availabilities')
        .select('id, start_date, bookings(count)')
        .in('start_date', ['2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09']);

    console.log("Availabilities found:", avails?.length);
    avails?.forEach(a => {
        console.log(`Date: ${a.start_date} | ID: ${a.id} | Bookings: ${a.bookings[0]?.count}`);
    });

    const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 1000 * 60 * 60).toISOString()); // Created in last hour

    console.log("Total Bookings created in last hour:", count);
}
check();
