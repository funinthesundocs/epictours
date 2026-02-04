// Debug schedule_stops lookup
// Run with: npx tsx scripts/debug-pickup-time.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ORG_ID = '6065c460-ce9c-418a-8071-6367f8a20f35';

async function main() {
    console.log('🔍 Debugging pickup time resolution...\n');

    // 1. Get a sample availability with transportation_route_id
    const { data: avail } = await supabase
        .from('availabilities')
        .select('id, transportation_route_id, experience_id')
        .eq('organization_id', ORG_ID)
        .not('transportation_route_id', 'is', null)
        .limit(1)
        .single();

    if (!avail) {
        console.log('❌ No availability with transportation_route_id found');
        return;
    }

    console.log('📋 Sample Availability:');
    console.log(`   ID: ${avail.id}`);
    console.log(`   transportation_route_id: ${avail.transportation_route_id}`);

    // 2. Check what table transportation_route_id refers to
    const { data: routeData } = await supabase
        .from('route_schedules')
        .select('id, name')
        .eq('id', avail.transportation_route_id);

    console.log('\n📋 Route Schedule lookup:');
    console.log(`   Found: ${routeData?.length || 0} records`);
    if (routeData?.[0]) {
        console.log(`   Name: ${routeData[0].name}`);
    }

    // 3. Check schedule_stops with this ID
    const { data: stops, error: stopsErr } = await supabase
        .from('schedule_stops')
        .select('*')
        .eq('schedule_id', avail.transportation_route_id);

    console.log('\n📋 Schedule Stops query (schedule_id = transportation_route_id):');
    if (stopsErr) {
        console.log(`   ❌ Error: ${stopsErr.message}`);
    } else {
        console.log(`   Found: ${stops?.length || 0} stops`);
        stops?.slice(0, 5).forEach((s, i) => {
            console.log(`   ${i + 1}. pickup_point_id: ${s.pickup_point_id}, time: ${s.pickup_time}`);
        });
    }

    // 4. Check if schedule_stops uses a different ID column
    console.log('\n📋 Checking schedule_stops table structure...');
    const { data: allStops } = await supabase
        .from('schedule_stops')
        .select('*')
        .limit(5);

    if (allStops?.[0]) {
        console.log('   Columns:', Object.keys(allStops[0]).join(', '));
        console.log('   Sample row:', allStops[0]);
    }

    // 5. Get a hotel and its pickup_point_id
    const { data: hotel } = await supabase
        .from('hotels')
        .select('id, name, pickup_point_id')
        .eq('organization_id', ORG_ID)
        .not('pickup_point_id', 'is', null)
        .limit(1)
        .single();

    if (hotel) {
        console.log('\n📋 Sample Hotel:');
        console.log(`   Name: ${hotel.name}`);
        console.log(`   pickup_point_id: ${hotel.pickup_point_id}`);

        // Check if there's a stop for this pickup point
        const matchingStop = stops?.find(s => s.pickup_point_id === hotel.pickup_point_id);
        console.log(`   Matching stop: ${matchingStop ? `${matchingStop.pickup_time}` : 'NOT FOUND'}`);
    }
}

main().catch(console.error);
