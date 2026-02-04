// FINAL FIX: Populate all booking custom fields correctly
// Run with: npx tsx scripts/final-fix-bookings.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ORG_ID = '6065c460-ce9c-418a-8071-6367f8a20f35';

// FIELD IDS (from custom_field_definitions)
const FIELD_IDS = {
    BOOKING_SOURCE: '4d568272-3810-4bf5-b21c-98ab11a241dd',  // select
    AGENT: '5a0493a6-c45b-4f5e-9350-f8990b4438a2',           // select
    VOUCHER: '7c4b113f-f777-477c-a5d6-9367252bb0e6',         // text
    PICKUP: '34c69c82-92e7-4252-bf27-e5e18e18058d',          // smart_pickup (hotel id)
    NOTES: 'b6b45f09-9b83-4e34-9514-01edf7acee14',           // textarea
};

// OPTIONS (actual values from the select fields)
const BOOKING_SOURCES = [
    'Google Ad', 'Google Maps Listing', 'Facebook Ad',
    'Cross Sale', 'Tripadvisor / Viator', 'Walk-In', 'Phone Call'
];

const AGENTS = ['Christhel', 'Matt', 'Denis', 'Nebz', 'Davis'];

const BOOKING_NOTES = [
    'Guest requested window seat on bus.',
    'Celebrating anniversary - please acknowledge!',
    'Guest has mobility concerns, may need assistance.',
    'Repeat customer - VIP treatment.',
    'First time visitors from mainland.',
    'Large family group - keep together please.',
    'Requests lots of photos at scenic stops.',
    'Dietary restriction: vegetarian lunch.',
    'Birthday celebration for guest of honor.',
    'Honeymoon couple - romantic experience preferred.',
    'Senior citizens - pace the walking portions.',
    'Kids ages 8 and 10 - keep activities engaging.',
    'Guest speaks limited English - Spanish preferred.',
    'Request for front seats due to motion sickness.',
    'Photography enthusiasts - extra time at viewpoints.'
];

const VOUCHER_PREFIXES = ['VIA', 'EXP', 'GYG', 'TA', 'DIR'];

async function main() {
    console.log('🔧 FINAL FIX: Populating all booking custom fields...\n');

    // Get hotels for pickup field
    const { data: hotels } = await supabase
        .from('hotels')
        .select('id, name')
        .eq('organization_id', ORG_ID);

    console.log(`📋 Found ${hotels?.length || 0} hotels for pickup`);

    // Get customer types for pax_breakdown
    const { data: customerTypes } = await supabase
        .from('customer_types')
        .select('id, name')
        .eq('organization_id', ORG_ID);

    console.log('📋 Customer types:', customerTypes?.map(t => t.name).join(', '));
    const adultsTypeId = customerTypes?.find(t => t.name === 'Adults')?.id || customerTypes?.[0]?.id;

    // Get all ACI test bookings
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, pax_count')
        .eq('organization_id', ORG_ID)
        .ilike('confirmation_number', 'ACI-%');

    if (error || !bookings) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`📋 Found ${bookings.length} ACI bookings to update\n`);

    let updated = 0;

    for (let i = 0; i < bookings.length; i++) {
        const booking = bookings[i];
        const hotel = hotels?.[(i) % (hotels?.length || 1)];

        // Build option_values with CORRECT field IDs
        const optionValues: Record<string, any> = {
            [FIELD_IDS.BOOKING_SOURCE]: BOOKING_SOURCES[i % BOOKING_SOURCES.length],
            [FIELD_IDS.AGENT]: AGENTS[i % AGENTS.length],
            [FIELD_IDS.VOUCHER]: `${VOUCHER_PREFIXES[i % VOUCHER_PREFIXES.length]}-${String(100000 + i).slice(1)}`,
            [FIELD_IDS.PICKUP]: hotel?.id || '', // smart_pickup expects hotel ID
            [FIELD_IDS.NOTES]: BOOKING_NOTES[i % BOOKING_NOTES.length],
        };

        // Fix pax_breakdown to correct format
        const paxBreakdown = adultsTypeId
            ? { [adultsTypeId]: booking.pax_count || 2 }
            : { default: booking.pax_count || 2 };

        const { error: updateErr } = await supabase
            .from('bookings')
            .update({
                option_values: optionValues,
                pax_breakdown: paxBreakdown,
                notes: BOOKING_NOTES[i % BOOKING_NOTES.length],
                status: 'confirmed'
            })
            .eq('id', booking.id);

        if (!updateErr) updated++;

        if ((i + 1) % 100 === 0) {
            console.log(`   Progress: ${i + 1}/${bookings.length}`);
        }
    }

    console.log(`\n✅ COMPLETE! Updated ${updated}/${bookings.length} bookings`);

    // Show sample
    const sampleHotel = hotels?.[0];
    console.log('\n📊 Sample option_values structure:');
    console.log({
        [FIELD_IDS.BOOKING_SOURCE]: BOOKING_SOURCES[0],
        [FIELD_IDS.AGENT]: AGENTS[0],
        [FIELD_IDS.VOUCHER]: 'VIA-00001',
        [FIELD_IDS.PICKUP]: sampleHotel?.id || 'hotel_uuid',
        [FIELD_IDS.NOTES]: BOOKING_NOTES[0]
    });
}

main().catch(console.error);
