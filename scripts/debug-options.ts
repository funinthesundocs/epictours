// Debug script to view booking option schedule config
// Run with: npx tsx scripts/debug-options.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ORG_ID = '6065c460-ce9c-418a-8071-6367f8a20f35';

async function main() {
    console.log('🔍 Debugging booking option schedule config...\n');

    // Get the "Aloha Circle Island" booking option schedule
    const { data: schedules, error } = await supabase
        .from('booking_option_schedules')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('name', 'Aloha Circle Island');

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!schedules || schedules.length === 0) {
        console.log('No schedule found with name "Aloha Circle Island"');

        // List all schedules
        const { data: allSchedules } = await supabase
            .from('booking_option_schedules')
            .select('id, name')
            .eq('organization_id', ORG_ID);

        console.log('Available schedules:', allSchedules?.map(s => s.name));
        return;
    }

    const schedule = schedules[0];
    console.log('📋 Schedule:', schedule.name);
    console.log('   ID:', schedule.id);

    console.log('\n📊 config_retail:');
    console.log(JSON.stringify(schedule.config_retail, null, 2));

    console.log('\n📊 config_online:');
    console.log(JSON.stringify(schedule.config_online, null, 2));

    // Extract field IDs
    console.log('\n🔑 Field IDs from config_retail:');
    if (schedule.config_retail && Array.isArray(schedule.config_retail)) {
        schedule.config_retail.forEach((field: any, i: number) => {
            console.log(`   ${i + 1}. "${field.label}" => ID: ${field.id || field.field_id} (type: ${field.type})`);
            if (field.options) {
                console.log(`      Options: ${JSON.stringify(field.options.slice(0, 3))}...`);
            }
        });
    }
}

main().catch(console.error);
