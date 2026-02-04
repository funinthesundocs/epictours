// Debug script to view custom fields
// Run with: npx tsx scripts/debug-custom-fields.ts

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
    console.log('🔍 Querying custom_fields table...\n');

    const { data: fields, error } = await supabase
        .from('custom_fields')
        .select('*')
        .in('id', FIELD_IDS);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!fields || fields.length === 0) {
        console.log('No custom fields found with those IDs.');

        // List all custom fields
        const { data: allFields } = await supabase
            .from('custom_fields')
            .select('id, name, type')
            .eq('organization_id', ORG_ID);

        console.log('\nAll custom fields in org:');
        allFields?.forEach(f => console.log(`  ${f.name} (${f.type}) => ${f.id}`));
        return;
    }

    console.log('📋 Custom Fields:');
    fields.forEach((field, i) => {
        console.log(`\n${i + 1}. "${field.name}" (${field.type})`);
        console.log(`   ID: ${field.id}`);
        console.log(`   Required: ${field.required || false}`);
        if (field.options) {
            console.log(`   Options: ${JSON.stringify(field.options)}`);
        }
    });

    // Create mapping for fix script
    console.log('\n\n📊 FIELD MAPPING FOR FIX SCRIPT:');
    fields.forEach(field => {
        const name = (field.name || '').toLowerCase();
        let sampleValue = 'N/A';

        if (name.includes('source')) sampleValue = 'Direct Website';
        else if (name.includes('agent')) sampleValue = 'agent_uuid_here';
        else if (name.includes('voucher')) sampleValue = 'VIA-001000';
        else if (name.includes('pickup') || name.includes('hotel')) sampleValue = 'hotel_uuid_here';
        else if (name.includes('note')) sampleValue = 'Sample booking note';

        console.log(`'${field.id}': '${sampleValue}', // ${field.name}`);
    });
}

main().catch(console.error);
