import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function copyStatusesToAlohaCircleIsland() {
    console.log('🔄 Copying check-in statuses to Aloha Circle Island...\n');

    // Get Default Tenant org ID
    const { data: defaultOrg } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', 'default')
        .single();

    if (!defaultOrg) {
        console.error('❌ Could not find Default Tenant');
        return;
    }

    console.log(`📋 Source: ${defaultOrg.name}\n`);

    // Get Aloha Circle Island org ID
    const { data: targetOrg } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', 'aloha-circle-island')
        .single();

    if (!targetOrg) {
        console.error('❌ Could not find Aloha Circle Island');
        return;
    }

    console.log(`🎯 Target: ${targetOrg.name}\n`);

    // Get check-in statuses from Default Tenant
    const { data: statuses } = await supabase
        .from('check_in_statuses')
        .select('status, color, notes')
        .eq('organization_id', defaultOrg.id)
        .order('created_at');

    if (!statuses || statuses.length === 0) {
        console.log('ℹ️  No statuses found in Default Tenant');
        return;
    }

    console.log(`Found ${statuses.length} statuses to copy:\n`);
    statuses.forEach((s, i) => console.log(`  ${i + 1}. ${s.status} (${s.color})`));
    console.log('');

    // Check if Aloha Circle Island already has statuses
    const { data: existing } = await supabase
        .from('check_in_statuses')
        .select('id, status')
        .eq('organization_id', targetOrg.id);

    if (existing && existing.length > 0) {
        console.log(`⚠️  Aloha Circle Island already has ${existing.length} statuses:`);
        existing.forEach((s, i) => console.log(`  ${i + 1}. ${s.status}`));
        console.log('\n❌ Skipping copy to avoid duplicates\n');
        return;
    }

    // Copy statuses to Aloha Circle Island
    const records = statuses.map(s => ({
        ...s,
        organization_id: targetOrg.id
    }));

    const { error } = await supabase
        .from('check_in_statuses')
        .insert(records);

    if (error) {
        console.error('❌ Failed to copy statuses:', error.message);
    } else {
        console.log(`✅ Successfully copied ${statuses.length} statuses to ${targetOrg.name}`);
    }

    console.log('\n✨ Migration complete!');
}

copyStatusesToAlohaCircleIsland().catch(console.error);
