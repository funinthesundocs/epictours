import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fixOrphanedRecords() {
    console.log('🔍 Checking for orphaned records...\n');

    // Get Aloha Circle Island org ID
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', 'aloha-circle-island')
        .single();

    if (orgError || !org) {
        console.error('❌ Could not find Aloha Circle Island organization');
        return;
    }

    console.log(`✅ Found organization: ${org.name} (${org.id})\n`);

    // Check each table for records with NULL organization_id
    const tables = [
        'check_in_statuses',
        'booking_option_schedules',
        'customer_types'
    ];

    for (const table of tables) {
        console.log(`📋 Checking ${table}...`);

        // Count records with NULL organization_id
        const { data: nullRecords, error } = await supabase
            .from(table as any)
            .select('id')
            .is('organization_id', null);

        if (error) {
            console.error(`  ❌ Error querying ${table}:`, error.message);
            continue;
        }

        if (!nullRecords || nullRecords.length === 0) {
            console.log(`  ✅ No orphaned records\n`);
            continue;
        }

        console.log(`  🔧 Found ${nullRecords.length} orphaned records`);

        // Update them to belong to Aloha Circle Island
        const { error: updateError } = await supabase
            .from(table as any)
            .update({ organization_id: org.id })
            .is('organization_id', null);

        if (updateError) {
            console.error(`  ❌ Failed to update ${table}:`, updateError.message);
        } else {
            console.log(`  ✅ Updated ${nullRecords.length} records to ${org.name}\n`);
        }
    }

    console.log('✨ Migration complete!');
}

fixOrphanedRecords().catch(console.error);
