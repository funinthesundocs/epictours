// Query custom_field_definitions table
// Run with: npx tsx scripts/query-cfd.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ORG_ID = '6065c460-ce9c-418a-8071-6367f8a20f35';

// Field IDs from booking option schedule config
const FIELD_IDS = [
    '4d568272-3810-4bf5-b21c-98ab11a241dd',
    '5a0493a6-c45b-4f5e-9350-f8990b4438a2',
    '7c4b113f-f777-477c-a5d6-9367252bb0e6',
    '34c69c82-92e7-4252-bf27-e5e18e18058d',
    'b6b45f09-9b83-4e34-9514-01edf7acee14',
    'cdf0c871-7d9b-449f-8959-a57101ffe017'
];

async function main() {
    console.log('🔍 Querying custom_field_definitions table...\n');

    // Query all custom field definitions for this org
    const { data: allDefs, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('organization_id', ORG_ID);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${allDefs?.length || 0} custom field definitions:\n`);

    allDefs?.forEach((field, i) => {
        console.log(`${i + 1}. "${field.label}" (${field.type})`);
        console.log(`   ID: ${field.id}`);
        if (field.options) {
            const opts = typeof field.options === 'string' ? JSON.parse(field.options) : field.options;
            if (Array.isArray(opts)) {
                console.log(`   Options: ${opts.slice(0, 5).map((o: any) => o.label || o.value || o).join(', ')}...`);
            } else {
                console.log(`   Options: ${JSON.stringify(opts)}`);
            }
        }
    });

    // Check which of our field_ids match
    console.log('\n📊 MATCHING FIELD IDS FROM CONFIG:');
    FIELD_IDS.forEach(fieldId => {
        const match = allDefs?.find(f => f.id === fieldId);
        if (match) {
            console.log(`✅ ${fieldId} => "${match.label}" (${match.type})`);
        } else {
            console.log(`❌ ${fieldId} => NOT FOUND`);
        }
    });
}

main().catch(console.error);
