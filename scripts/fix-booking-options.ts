// Fix script: Properly populate option_values with correct field IDs
// Run with: npx tsx scripts/fix-booking-options.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data pools
const BOOKING_NOTES = [
    'Guest requested window seat on bus.',
    'Celebrating anniversary, please acknowledge.',
    'Guest has mobility concerns, may need assistance.',
    'Repeat customer - VIP treatment.',
    'First time visitors from mainland.',
    'Large family group, keep together please.',
    'Requests lots of photos at scenic stops.',
    'Dietary restriction: vegetarian lunch.',
    'Birthday celebration for Sarah.',
    'Honeymoon couple.',
    'Senior citizens, pace walking portions.',
    'Kids ages 8 and 10.',
    'Limited English, Spanish preferred.',
    'Request front seats - motion sickness.',
    'Photography enthusiasts.',
];

const VOUCHER_PREFIXES = ['VIA', 'EXP', 'GYG', 'DIR', 'PHN'];

async function main() {
    console.log('🔧 Phase 2: Fixing option_values with correct field IDs...\n');

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
    console.log(`✅ Organization: ${org.id}`);

    // 2. Get the experience - debug first
    const { data: allExps } = await supabase
        .from('experiences')
        .select('id, name, booking_option_schedule_id')
        .eq('organization_id', org.id);

    console.log(`📋 Available experiences:`, allExps?.map(e => e.name));

    const experience = allExps?.find(e => e.name.toLowerCase().includes('circle island'));

    if (!experience) {
        console.error('❌ Experience "Circle Island" not found');
        return;
    }
    console.log(`✅ Experience: ${experience.name}`);
    console.log(`   Default Option Schedule ID: ${experience.booking_option_schedule_id || 'None'}`);

    // 3. Get booking option schedules for this experience
    const { data: schedules, error: schError } = await supabase
        .from('booking_option_schedules')
        .select('id, name, config_retail, config_online, config_special, config_custom')
        .eq('experience_id', experience.id);

    if (schError) {
        console.error('❌ Error fetching option schedules:', schError);
        return;
    }

    console.log(`✅ Found ${schedules?.length || 0} booking option schedules`);

    // Parse the retail config to find field IDs
    let bookingOptions: any[] = [];
    if (schedules && schedules.length > 0) {
        const mainSchedule = schedules[0];
        console.log(`   Using schedule: ${mainSchedule.name}`);

        // Try retail config first
        if (mainSchedule.config_retail) {
            const config = typeof mainSchedule.config_retail === 'string'
                ? JSON.parse(mainSchedule.config_retail)
                : mainSchedule.config_retail;
            if (Array.isArray(config)) {
                bookingOptions = config;
            }
        }
    }

    console.log(`✅ Found ${bookingOptions.length} booking options in config`);

    if (bookingOptions.length > 0) {
        console.log('\n📋 Option fields:');
        bookingOptions.forEach((opt, i) => {
            console.log(`   ${i + 1}. ${opt.label || opt.name} (ID: ${opt.id || opt.field_id || 'N/A'}, Type: ${opt.type})`);
        });
    }

    // 4. Get hotels for pickup field
    const { data: hotels } = await supabase
        .from('hotels')
        .select('id, name')
        .eq('organization_id', org.id);

    console.log(`\n✅ Found ${hotels?.length || 0} hotels`);

    // 5. Get agents
    const { data: agents } = await supabase
        .from('users')
        .select('id, name')
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .limit(10);

    console.log(`✅ Found ${agents?.length || 0} agents`);

    // 6. Get all test bookings
    const { data: bookings, error: bkError } = await supabase
        .from('bookings')
        .select('id, confirmation_number')
        .eq('organization_id', org.id)
        .ilike('confirmation_number', 'ACI-%');

    if (bkError || !bookings) {
        console.error('❌ Error fetching bookings:', bkError);
        return;
    }

    console.log(`\n✅ Found ${bookings.length} test bookings to update`);

    // Build option values keyed by actual option IDs
    const buildOptionValues = (index: number) => {
        const values: Record<string, any> = {};

        bookingOptions.forEach((opt, optIdx) => {
            const optId = opt.id || opt.field_id;
            if (!optId) return;

            const type = opt.type || 'text';
            const label = (opt.label || '').toLowerCase();

            // Match by label keywords to determine appropriate value
            if (label.includes('source') || label.includes('booking source')) {
                const sources = ['Direct Website', 'Phone Call', 'Walk-In', 'Expedia', 'Viator', 'GetYourGuide'];
                values[optId] = sources[(index + optIdx) % sources.length];
            } else if (label.includes('agent')) {
                const agent = agents?.[(index + optIdx) % (agents?.length || 1)];
                values[optId] = agent?.id || agent?.name || 'Direct Booking';
            } else if (label.includes('voucher')) {
                values[optId] = `${VOUCHER_PREFIXES[index % VOUCHER_PREFIXES.length]}-${String(1000 + index).padStart(6, '0')}`;
            } else if (label.includes('pickup') || label.includes('hotel')) {
                const hotel = hotels?.[(index + optIdx) % (hotels?.length || 1)];
                values[optId] = hotel?.id || 'Self Drive';
            } else if (label.includes('note') || type === 'textarea') {
                values[optId] = BOOKING_NOTES[index % BOOKING_NOTES.length];
            } else if (type === 'select' && opt.options && Array.isArray(opt.options)) {
                // Pick a random option from select
                const validOptions = opt.options.filter((o: any) => o.value);
                if (validOptions.length > 0) {
                    values[optId] = validOptions[(index + optIdx) % validOptions.length].value;
                }
            } else if (type === 'text') {
                values[optId] = 'N/A';
            } else if (type === 'number') {
                values[optId] = 0;
            } else if (type === 'checkbox') {
                // For checkbox, if single select, pick first option
                if (opt.options && Array.isArray(opt.options)) {
                    const validOptions = opt.options.filter((o: any) => o.value);
                    if (validOptions.length > 0) {
                        values[optId] = validOptions[0].value;
                    }
                }
            }
        });

        return values;
    };

    // 7. Update all bookings
    console.log('\n📝 Updating bookings with correctly-keyed option_values...');
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < bookings.length; i++) {
        const booking = bookings[i];
        const optionValues = buildOptionValues(i);
        const voucherNum = `${VOUCHER_PREFIXES[i % VOUCHER_PREFIXES.length]}-${String(1000 + i).padStart(6, '0')}`;

        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                option_values: optionValues,
                voucher_numbers: voucherNum,
                notes: BOOKING_NOTES[i % BOOKING_NOTES.length],
                status: 'confirmed'
            })
            .eq('id', booking.id);

        if (updateError) {
            console.error(`Error updating ${booking.confirmation_number}:`, updateError.message);
            errors++;
        } else {
            updated++;
        }

        if ((i + 1) % 100 === 0) {
            console.log(`   Progress: ${i + 1}/${bookings.length}`);
        }
    }

    console.log(`\n✅ COMPLETE!`);
    console.log(`   📋 Updated: ${updated}`);
    console.log(`   ❌ Errors: ${errors}`);

    // Show sample of what was set
    if (bookingOptions.length > 0) {
        console.log('\n📊 Sample option_values structure:');
        console.log(JSON.stringify(buildOptionValues(0), null, 2));
    }
}

main().catch(console.error);
