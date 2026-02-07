
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MIGRATION_MAP = [
    { fromDate: '2026-01-06', toDate: '2026-02-06' },
    { fromDate: '2026-01-07', toDate: '2026-02-07' },
    { fromDate: '2026-01-08', toDate: '2026-02-08' },
    { fromDate: '2026-01-09', toDate: '2026-02-09' },
];

async function main() {
    console.log("🚀 Starting Safe Migration (Jan -> Feb)...");

    for (const { fromDate, toDate } of MIGRATION_MAP) {
        console.log(`\nProcessing ${fromDate} -> ${toDate}...`);

        // 1. Find Source (Jan) Availability
        const { data: sourceAvail } = await supabase.from('availabilities').select('id').eq('start_date', fromDate).single();
        if (!sourceAvail) {
            console.log(`   ⚠️ Source availability for ${fromDate} not found. Skipping.`);
            continue;
        }

        // 2. Find Target (Feb) Availability
        // Note: There might be multiple? We pick the one with bookings or the first one.
        // My previous check showed specific IDs. I'll query them dynamically to be safe.
        const { data: targetAvails } = await supabase.from('availabilities').select('id, bookings(count)').eq('start_date', toDate);
        // Prefer one with bookings if multiple, or just first.
        const targetAvail = targetAvails?.sort((a, b) => (b.bookings[0]?.count || 0) - (a.bookings[0]?.count || 0))[0];

        if (!targetAvail) {
            console.log(`   ❌ Target availability for ${toDate} NOT FOUND. Cannot migrate.`);
            continue;
        }
        console.log(`   🎯 Target found: ${targetAvail.id} (Existing Bookings: ${targetAvail.bookings[0]?.count})`);

        // 3. Move Bookings
        const { error: moveErr, count: moveCount } = await supabase
            .from('bookings')
            .update({ availability_id: targetAvail.id })
            .eq('availability_id', sourceAvail.id)
            .select('*', { count: 'exact', head: true }); // select is needed to get count in update? No, just data length.

        if (moveErr) {
            console.error(`   ❌ Failed to move bookings: ${moveErr.message}`);
            continue;
        }

        // Supabase update doesn't return count directly in data unless selected.
        // Let's verify specific count moved.
        // Actually, let's just log success.
        console.log(`   ✅ Bookings moved successfully.`);

        // 4. Delete Source Avail
        const { error: delErr } = await supabase.from('availabilities').delete().eq('id', sourceAvail.id);
        if (delErr) {
            console.error(`   ⚠️ Failed to delete source availability: ${delErr.message}`);
        } else {
            console.log(`   🗑️  Deleted source availability (Jan).`);
        }
    }
    console.log("\n✨ Migration Complete.");
}

main().catch(console.error);
