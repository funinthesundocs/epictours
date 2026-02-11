import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkModules() {
    console.log('📋 Checking module subscriptions...\n');

    // Get all organizations
    const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug');

    if (orgError) {
        console.error('Error fetching organizations:', orgError);
        return;
    }

    console.log(`Found ${orgs?.length} organizations\n`);

    // For each org, check subscriptions
    for (const org of orgs || []) {
        console.log(`\n📦 Organization: ${org.name} (${org.slug})`);

        const { data: subs, error: subError } = await supabase
            .from('organization_subscriptions')
            .select('module_code, status')
            .eq('organization_id', org.id);

        if (subError) {
            console.error(`Error fetching subscriptions for ${org.name}:`, subError);
            continue;
        }

        if (!subs || subs.length === 0) {
            console.log('  ❌ No module subscriptions found!');
        } else {
            console.log(`  ✅ Subscribed modules:`);
            subs.forEach(sub => {
                console.log(`    - ${sub.module_code} (${sub.status})`);
            });
        }
    }

    console.log('\n✨ Check complete!');
}

checkModules().catch(console.error);
