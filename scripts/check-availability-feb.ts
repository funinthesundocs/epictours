
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
    const dates = ['2026-02-06', '2026-02-07', '2026-02-08', '2026-02-09'];
    console.log("Checking for Existing Availabilities (Feb 6-9, 2026)...");

    const { data: avails } = await supabase
        .from('availabilities')
        .select('id, start_date, bookings(count)')
        .in('start_date', dates);

    if (avails && avails.length > 0) {
        console.log(`⚠️  FOUND ${avails.length} existing availabilities in Feb!`);
        avails.forEach(a => console.log(`   - ${a.start_date}: ${a.bookings?.[0]?.count || 0} bookings (ID: ${a.id})`));
    } else {
        console.log("✅ No existing availabilities found for Feb 6-9. Safe to perform Date Shift.");
    }
}
check();
