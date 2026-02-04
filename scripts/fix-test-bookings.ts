// Fix script: Update all test bookings with complete data
// Run with: npx tsx scripts/fix-test-bookings.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample notes for bookings
const BOOKING_NOTES = [
    'Guest requested window seat on bus.',
    'Celebrating anniversary, please acknowledge.',
    'Guest has mobility concerns, may need assistance.',
    'Repeat customer - VIP treatment.',
    'First time visitors from mainland.',
    'Large family group, keep together please.',
    'Wants lots of photos at scenic stops.',
    'Dietary restriction: vegetarian lunch option.',
    'Birthday celebration - guest of honor is Sarah.',
    'Honeymoon couple, romantic experience preferred.',
    'Senior citizens, pace the walking portions.',
    'Kids ages 8 and 10, keep activities engaging.',
    'Guest speaks limited English, Spanish preferred.',
    'Request for front seats due to motion sickness.',
    'Photography enthusiasts, extra time at viewpoints.',
];

const BOOKING_SOURCES = ['Direct Website', 'Phone Call', 'Walk-In', 'Expedia', 'Viator', 'GetYourGuide', 'TripAdvisor'];
const VOUCHER_PREFIXES = ['VIA', 'EXP', 'GYG', 'DIR', 'PHN'];

async function main() {
    console.log('🔧 Starting test booking data fix...\n');

    // 1. Get organization
    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'aloha-circle-island')
        .single();

    if (!org) {
        console.error('❌ Organization not found');
        return;
    }
    const orgId = org.id;
    console.log(`✅ Organization: ${orgId}`);

    // 2. Get hotels for pickup
    const { data: hotels } = await supabase
        .from('hotels')
        .select('id, name')
        .eq('organization_id', orgId);

    console.log(`✅ Found ${hotels?.length || 0} hotels`);

    // 3. Get agents (users with agent role or just staff users)
    const { data: agents } = await supabase
        .from('users')
        .select('id, name')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .limit(10);

    console.log(`✅ Found ${agents?.length || 0} potential agents`);

    // 4. Get all test bookings (those with ACI- confirmation pattern)
    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, pax_count, confirmation_number, notes, option_values')
        .eq('organization_id', orgId)
        .ilike('confirmation_number', 'ACI-%');

    if (bookingsError) {
        console.error('❌ Error fetching bookings:', bookingsError);
        return;
    }

    console.log(`✅ Found ${bookings?.length || 0} test bookings to update\n`);

    if (!bookings || bookings.length === 0) {
        console.log('No bookings to update.');
        return;
    }

    // 5. Update each booking with complete option_values
    console.log('📝 Updating bookings with complete data...');
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < bookings.length; i++) {
        const booking = bookings[i];

        // Pick random values for this booking
        const hotel = hotels?.[i % (hotels?.length || 1)];
        const agent = agents?.[i % (agents?.length || 1)];
        const source = BOOKING_SOURCES[i % BOOKING_SOURCES.length];
        const note = BOOKING_NOTES[i % BOOKING_NOTES.length];
        const voucherPrefix = VOUCHER_PREFIXES[i % VOUCHER_PREFIXES.length];
        const voucherNum = `${voucherPrefix}-${String(1000 + i).padStart(6, '0')}`;

        // Build complete option_values
        const optionValues = {
            booking_source: source,
            agent_id: agent?.id || null,
            agent_name: agent?.name || 'Direct Booking',
            hotel_id: hotel?.id || null,
            hotel_name: hotel?.name || 'Self Drive',
            pickup_hotel_id: hotel?.id || null,
            voucher_number: voucherNum,
            special_requests: note,
            dietary_restrictions: ['None', 'Vegetarian', 'Gluten-Free', 'Vegan'][i % 4]
        };

        // Update the booking
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                option_values: optionValues,
                voucher_numbers: voucherNum,
                notes: note,
                status: 'confirmed' // Ensure status is set for list view
            })
            .eq('id', booking.id);

        if (updateError) {
            console.error(`Error updating booking ${booking.id}:`, updateError.message);
            errors++;
        } else {
            updated++;
        }

        // Progress indicator every 100
        if ((i + 1) % 100 === 0) {
            console.log(`   Progress: ${i + 1}/${bookings.length}`);
        }
    }

    console.log(`\n✅ COMPLETE!`);
    console.log(`   📋 Updated: ${updated}`);
    console.log(`   ❌ Errors: ${errors}`);

    // 6. Now fix customer data - ensure customers have name/email/phone directly
    console.log('\n👤 Checking customer data structure...');

    // Check if customers table has proper columns
    const { data: sampleCustomer } = await supabase
        .from('customers')
        .select('id, name, email, phone')
        .limit(1);

    if (sampleCustomer === null) {
        console.log('⚠️  Customer table may not have name/email/phone columns directly.');
        console.log('   The list view query expects customers(name, email, phone) but data is on users table.');
        console.log('   You may need to update the query to join through users.');
    } else {
        console.log('✅ Customer table structure looks OK.');
    }
}

main().catch(console.error);
