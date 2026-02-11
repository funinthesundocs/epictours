import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function duplicateCheckInStatuses() {
    console.log('🔄 Duplicating check-in statuses to all organizations...\n');

    // Get all organizations except Default Tenant
    const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .neq('slug', 'default')
        .eq('status', 'active');

    if (!orgs || orgs.length === 0) {
        console.error('❌ No organizations found');
        return;
    }

    // Get Default Tenant check-in statuses
    const { data: defaultOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'default')
        .single();

    if (!defaultOrg) {
        console.error('❌ Could not find Default Tenant');
        return;
    }

    const { data: statuses } = await supabase
        .from('check_in_statuses')
        .select('status, color, notes')
        .eq('organization_id', defaultOrg.id)
        .order('created_at');

    if (!statuses || statuses.length === 0) {
        console.log('ℹ️  No statuses to duplicate');
        return;
    }

    console.log(`Found ${statuses.length} statuses from Default Tenant:\n`);
    statuses.forEach((s, i) => console.log(`  ${i + 1}. ${s.status}`));
    console.log('');

    // Duplicate to each organization
    for (const org of orgs) {
        console.log(`\n📦 Duplicating to: ${org.name}`);

        // Check if org already has statuses
        const { data: existing } = await supabase
            .from('check_in_statuses')
            .select('id')
            .eq('organization_id', org.id);

        if (existing && existing.length > 0) {
            console.log(`  ⏭️  Already has ${existing.length} statuses, skipping`);
            continue;
        }

        // Insert all statuses
        const records = statuses.map(s => ({
            ...s,
            organization_id: org.id
        }));

        const { error } = await supabase
            .from('check_in_statuses')
            .insert(records);

        if (error) {
            console.error(`  ❌ Failed:`, error.message);
        } else {
            console.log(`  ✅ Created ${statuses.length} statuses`);
        }
    }

    console.log('\n✨ Duplication complete!');
}

duplicateCheckInStatuses().catch(console.error);
