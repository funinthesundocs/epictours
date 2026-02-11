import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function addMissingModules() {
    console.log('🚀 Adding missing module subscriptions...\n');

    // Get all active organizations
    const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('status', 'active');

    if (orgError) {
        console.error('❌ Error fetching organizations:', orgError);
        return;
    }

    console.log(`Found ${orgs?.length} active organizations\n`);

    // Get module IDs for communications and visibility
    const { data: modules, error: moduleError } = await supabase
        .from('modules')
        .select('id, code, name')
        .in('code', ['communications', 'visibility']);

    if (moduleError) {
        console.error('❌ Error fetching modules:', moduleError);
        return;
    }

    if (!modules || modules.length === 0) {
        console.error('❌ Communications and Visibility modules not found in database!');
        return;
    }

    console.log('📦 Modules to add:');
    modules.forEach(m => console.log(`  - ${m.name} (${m.code})`));
    console.log('');

    // For each organization, add missing module subscriptions
    for (const org of orgs || []) {
        console.log(`\n📦 Processing: ${org.name}`);

        // Check existing subscriptions
        const { data: existingSubs } = await supabase
            .from('organization_subscriptions')
            .select('module_code')
            .eq('organization_id', org.id);

        const existingCodes = new Set((existingSubs || []).map(s => s.module_code));

        // Add missing modules
        for (const module of modules) {
            if (existingCodes.has(module.code)) {
                console.log(`  ⏭️  ${module.name} - already subscribed`);
                continue;
            }

            const { error: insertError } = await supabase
                .from('organization_subscriptions')
                .insert({
                    organization_id: org.id,
                    module_id: module.id,
                    status: 'active',
                    created_at: new Date().toISOString(),
                });

            if (insertError) {
                console.error(`  ❌ Failed to add ${module.name}:`, insertError.message);
            } else {
                console.log(`  ✅ Added ${module.name}`);
            }
        }
    }

    console.log('\n✨ Module subscription update complete!');
}

addMissingModules().catch(console.error);
