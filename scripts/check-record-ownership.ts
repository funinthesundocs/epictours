import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkRecordOwnership() {
    console.log('🔍 Checking record ownership...\n');

    // Get all organizations
    const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .order('name');

    if (!orgs) {
        console.error('❌ Could not fetch organizations');
        return;
    }

    console.log(`Found ${orgs.length} organizations:\n`);
    orgs.forEach(org => console.log(`  - ${org.name} (${org.slug})`));
    console.log('');

    // Check check_in_statuses
    console.log('\n📋 CHECK_IN_STATUSES');
    console.log('='.repeat(60));
    const { data: statuses } = await supabase
        .from('check_in_statuses')
        .select('id, organization_id, status')
        .order('created_at');

    if (statuses && statuses.length > 0) {
        const byOrg: Record<string, any[]> = {};
        statuses.forEach(s => {
            const orgId = s.organization_id || 'NULL';
            if (!byOrg[orgId]) byOrg[orgId] = [];
            byOrg[orgId].push(s);
        });

        for (const orgId in byOrg) {
            const org = orgs.find(o => o.id === orgId);
            console.log(`\n  🏢 ${org?.name || 'NULL'}: ${byOrg[orgId].length} records`);
            byOrg[orgId].forEach((s, i) => console.log(`     ${i + 1}. ${s.status}`));
        }
    } else {
        console.log('  📭 No records');
    }

    // Check booking_option_schedules
    console.log('\n\n📋 BOOKING_OPTION_SCHEDULES');
    console.log('='.repeat(60));
    const { data: options } = await supabase
        .from('booking_option_schedules')
        .select('id, organization_id, name')
        .order('created_at');

    if (options && options.length > 0) {
        const byOrg: Record<string, any[]> = {};
        options.forEach(o => {
            const orgId = o.organization_id || 'NULL';
            if (!byOrg[orgId]) byOrg[orgId] = [];
            byOrg[orgId].push(o);
        });

        for (const orgId in byOrg) {
            const org = orgs.find(o => o.id === orgId);
            console.log(`\n  🏢 ${org?.name || 'NULL'}: ${byOrg[orgId].length} records`);
            byOrg[orgId].forEach((o, i) => console.log(`     ${i + 1}. ${o.name}`));
        }
    } else {
        console.log('  📭 No records');
    }

    // Check customer_types
    console.log('\n\n📋 CUSTOMER_TYPES');
    console.log('='.repeat(60));
    const { data: types } = await supabase
        .from('customer_types')
        .select('id, organization_id, name')
        .order('created_at');

    if (types && types.length > 0) {
        const byOrg: Record<string, any[]> = {};
        types.forEach(t => {
            const orgId = t.organization_id || 'NULL';
            if (!byOrg[orgId]) byOrg[orgId] = [];
            byOrg[orgId].push(t);
        });

        for (const orgId in byOrg) {
            const org = orgs.find(o => o.id === orgId);
            console.log(`\n  🏢 ${org?.name || 'NULL'}: ${byOrg[orgId].length} records`);
            byOrg[orgId].forEach((t, i) => console.log(`     ${i + 1}. ${t.name}`));
        }
    } else {
        console.log('  📭 No records');
    }

    console.log('\n\n✨ Check complete!');
}

checkRecordOwnership().catch(console.error);
