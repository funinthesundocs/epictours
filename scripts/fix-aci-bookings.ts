// Fix booking data for Aloha Circle Island
// Run with: npx tsx scripts/fix-aci-bookings.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ORG_ID = '6065c460-ce9c-418a-8071-6367f8a20f35'; // Aloha Circle Island

const BOOKING_NOTES = [
    'Guest requested window seat.', 'Anniversary trip.', 'Mobility assistance needed.',
    'VIP - repeat customer.', 'First time in Hawaii.', 'Large family group.',
    'Wants extra photo stops.', 'Vegetarian lunch.', 'Birthday for Sarah.',
    'Honeymoon couple.', 'Senior guests.', 'Kids 8 and 10.', 'Spanish speaker.',
    'Front seats - motion sickness.', 'Photography enthusiasts.'
];

async function main() {
    console.log('🔧 Fixing Aloha Circle Island booking data...\n');

    // 1. Get customer types for pax_breakdown
    const { data: customerTypes } = await supabase
        .from('customer_types')
        .select('id, name')
        .eq('organization_id', ORG_ID);

    console.log('📋 Customer types:', customerTypes?.map(t => `${t.name} (${t.id})`));

    const defaultTypeId = customerTypes?.[0]?.id;
    if (!defaultTypeId) {
        console.error('❌ No customer types found');
        return;
    }

    // 2. Get booking option schedules to find field IDs
    const { data: schedules } = await supabase
        .from('booking_option_schedules')
        .select('id, name, config_retail')
        .eq('organization_id', ORG_ID);

    console.log('📋 Booking option schedules:', schedules?.map(s => s.name));

    // Parse config to get field IDs
    let fieldMap: Record<string, { id: string; type: string; label: string; options?: any[] }> = {};

    if (schedules && schedules.length > 0) {
        const config = schedules[0].config_retail;
        if (config && Array.isArray(config)) {
            config.forEach((field: any) => {
                const id = field.id || field.field_id;
                if (id) {
                    const label = (field.label || '').toLowerCase();
                    fieldMap[label] = {
                        id,
                        type: field.type || 'text',
                        label: field.label,
                        options: field.options
                    };
                }
            });
        }
    }

    console.log('📋 Field map:', Object.keys(fieldMap).map(k => `${k} => ${fieldMap[k].id}`));

    // 3. Get hotels for pickup
    const { data: hotels } = await supabase
        .from('hotels')
        .select('id, name')
        .eq('organization_id', ORG_ID);

    console.log(`📋 Hotels: ${hotels?.length || 0} available`);

    // 4. Get all ACI test bookings
    const { data: bookings, error: bkErr } = await supabase
        .from('bookings')
        .select('id, pax_count')
        .eq('organization_id', ORG_ID)
        .ilike('confirmation_number', 'ACI-%');

    if (bkErr || !bookings) {
        console.error('❌ Error:', bkErr);
        return;
    }

    console.log(`\n✅ Found ${bookings.length} ACI bookings to fix\n`);

    // 5. Update each booking
    let updated = 0;

    for (let i = 0; i < bookings.length; i++) {
        const booking = bookings[i];

        // Fix pax_breakdown: {customer_type_id: count}
        const paxBreakdown = { [defaultTypeId]: booking.pax_count || 2 };

        // Build option_values with actual field IDs
        const optionValues: Record<string, any> = {};

        // Match by common label patterns
        Object.entries(fieldMap).forEach(([label, field]) => {
            if (label.includes('source')) {
                const sources = ['Direct Website', 'Phone Call', 'Walk-In', 'Expedia', 'Viator'];
                optionValues[field.id] = sources[i % sources.length];
            } else if (label.includes('agent')) {
                optionValues[field.id] = 'Direct';
            } else if (label.includes('voucher')) {
                optionValues[field.id] = `VIA-${String(1000 + i).padStart(6, '0')}`;
            } else if (label.includes('pickup') || label.includes('hotel')) {
                const hotel = hotels?.[(i) % (hotels?.length || 1)];
                optionValues[field.id] = hotel?.id || 'Self Drive';
            } else if (label.includes('note')) {
                optionValues[field.id] = BOOKING_NOTES[i % BOOKING_NOTES.length];
            } else if (field.type === 'select' && field.options?.length) {
                const validOpts = field.options.filter((o: any) => o.value);
                if (validOpts.length) {
                    optionValues[field.id] = validOpts[i % validOpts.length].value;
                }
            }
        });

        const { error } = await supabase
            .from('bookings')
            .update({
                pax_breakdown: paxBreakdown,
                option_values: optionValues,
                notes: BOOKING_NOTES[i % BOOKING_NOTES.length],
                status: 'confirmed'
            })
            .eq('id', booking.id);

        if (!error) updated++;

        if ((i + 1) % 100 === 0) console.log(`   Progress: ${i + 1}/${bookings.length}`);
    }

    console.log(`\n✅ Updated ${updated}/${bookings.length} bookings`);

    // Show sample
    console.log('\n📊 Sample pax_breakdown:', { [defaultTypeId]: 3 });
    console.log('📊 Sample option_values:', Object.fromEntries(
        Object.entries(fieldMap).slice(0, 3).map(([_, f]) => [f.id, 'sample_value'])
    ));
}

main().catch(console.error);
