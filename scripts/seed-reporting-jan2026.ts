// Seed reporting data for Jan 6-9, 2026
// Run with: npx tsx scripts/seed-reporting-jan2026.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Simple Random Data Generators
const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com'];

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const generateName = () => `${getRandom(FIRST_NAMES)} ${getRandom(LAST_NAMES)}`;
const generateEmail = (name: string) => `${name.replace(' ', '.').toLowerCase()}${Math.floor(Math.random() * 100)}@${getRandom(DOMAINS)}`;
const generatePhone = () => `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
const generateNumeric = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ORG_ID = '6065c460-ce9c-418a-8071-6367f8a20f35';
const TARGET_DATES = ['2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09'];
const BOOKINGS_PER_DAY = 10;

// FIELD IDS (from previous alignment)
const FIELD_IDS = {
    BOOKING_SOURCE: '4d568272-3810-4bf5-b21c-98ab11a241dd',  // select
    AGENT: '5a0493a6-c45b-4f5e-9350-f8990b4438a2',           // select
    VOUCHER: '7c4b113f-f777-477c-a5d6-9367252bb0e6',         // text
    PICKUP: '34c69c82-92e7-4252-bf27-e5e18e18058d',          // smart_pickup (hotel id)
    NOTES: 'b6b45f09-9b83-4e34-9514-01edf7acee14',           // textarea
};

const BOOKING_SOURCES = ['Google Ad', 'Google Maps Listing', 'Facebook Ad', 'Cross Sale', 'Tripadvisor / Viator', 'Walk-In'];
const AGENTS = ['Christhel', 'Matt', 'Denis', 'Nebz', 'Davis'];
const VOUCHER_PREFIXES = ['VIA', 'EXP', 'GYG', 'TA', 'DIR'];
const NOTES_POOL = [
    'Vegetarian meal requested.', 'Anniversary.', 'Mobility assistance.',
    'First time in Hawaii.', 'Late pickup requested.', 'Honeymooners.',
    'Family reunion.', 'Allergic to peanuts.', 'Window seat preferred.', 'Extra water needed.'
];

async function main() {
    console.log('🚀 Seeding Reporting Data (Jan 6-9, 2026)...\n');

    // 1. Get Reference Data
    // Hotels
    const { data: hotels } = await supabase.from('hotels').select('id, name').eq('organization_id', ORG_ID);
    if (!hotels?.length) throw new Error('No hotels found');

    // Customer Types
    const { data: customerTypes } = await supabase.from('customer_types').select('id, name').eq('organization_id', ORG_ID);
    const adultsId = customerTypes?.find(t => t.name.toLowerCase().includes('adult'))?.id;
    const childrenId = customerTypes?.find(t => t.name.toLowerCase().includes('child'))?.id;

    if (!adultsId) throw new Error('Adult customer type not found');

    // Experience
    console.log('   Fetching experience...');
    const { data: exp, error: expErr } = await supabase.from('experiences')
        .select('id, name')
        .eq('organization_id', ORG_ID)
        .ilike('name', '%Circle Island%')
        .limit(1)
        .single();

    if (expErr) {
        console.error('❌ Experience fetch error:', expErr);
        throw new Error('Experience fetch failed');
    }
    if (!exp) throw new Error('Experience not found');
    console.log(`   Found experience: ${exp.name} (${exp.id})`);

    // Template Availability
    console.log('   Fetching template availability...');
    const { data: templateAvail, error: tmplErr } = await supabase
        .from('availabilities')
        .select('*')
        .eq('experience_id', exp.id)
        .not('pricing_schedule_id', 'is', null)
        .limit(1);

    if (tmplErr) {
        console.error('❌ Template fetch error:', tmplErr);
        throw new Error('Template fetch failed');
    }
    if (!templateAvail || templateAvail.length === 0) throw new Error('No template availability found');

    const template = templateAvail[0];
    console.log(`✅ Using template availability: ${template.id} (Price Sched: ${template.pricing_schedule_id})`);

    // 2. Loop through Dates
    for (const date of TARGET_DATES) {
        console.log(`\n📅 Processing ${date}...`);

        // A. Ensure Availability Exists
        let { data: avail } = await supabase
            .from('availabilities')
            .select('id')
            .eq('experience_id', exp.id)
            .eq('start_date', date)
            .single();

        if (!avail) {
            console.log(`   Creating availability for ${date}...`);
            const { data: newAvail, error: createErr } = await supabase
                .from('availabilities')
                .insert({
                    organization_id: ORG_ID,
                    experience_id: exp.id,
                    start_date: date,
                    start_time: '07:00:00',
                    max_capacity: 50,
                    online_booking_status: 'open',
                    pricing_schedule_id: template.pricing_schedule_id,
                    booking_option_schedule_id: template.booking_option_schedule_id,
                    transportation_route_id: template.transportation_route_id
                })
                .select()
                .single();

            if (createErr) throw new Error(`Failed to create avail: ${createErr.message}`);
            avail = newAvail;
        }

        // B. Create Bookings
        let successCount = 0;
        for (let i = 0; i < BOOKINGS_PER_DAY; i++) {
            // Create Customer
            const fullName = generateName();
            const email = generateEmail(fullName);

            const { data: user, error: userErr } = await supabase
                .from('users')
                .insert({
                    name: fullName,
                    email: email,
                    phone_number: generatePhone()
                })
                .select()
                .single();

            if (userErr) {
                console.error(`   Failed to create user: ${userErr.message}`);
                continue;
            }

            // Create Customer Profile
            const { data: customer, error: custErr } = await supabase
                .from('customers')
                .insert({
                    organization_id: ORG_ID,
                    user_id: user.id
                })
                .select()
                .single();

            if (custErr) {
                console.error(`   Failed to create customer: ${custErr.message}`);
                continue;
            }

            // Booking Details
            const paxCount = Math.random() > 0.5 ? 2 : 3;
            const isAdultOnly = Math.random() > 0.3;

            const paxBreakdown: any = {};
            if (isAdultOnly) {
                paxBreakdown[adultsId] = paxCount;
            } else {
                paxBreakdown[adultsId] = paxCount - 1;
                if (childrenId) paxBreakdown[childrenId] = 1;
                else paxBreakdown[adultsId] = paxCount;
            }

            const hotel = hotels[Math.floor(Math.random() * hotels.length)];
            const optionValues = {
                [FIELD_IDS.BOOKING_SOURCE]: BOOKING_SOURCES[Math.floor(Math.random() * BOOKING_SOURCES.length)],
                [FIELD_IDS.AGENT]: AGENTS[Math.floor(Math.random() * AGENTS.length)],
                [FIELD_IDS.VOUCHER]: `${VOUCHER_PREFIXES[Math.floor(Math.random() * VOUCHER_PREFIXES.length)]}-${generateNumeric(6)}`,
                [FIELD_IDS.PICKUP]: hotel.id,
                [FIELD_IDS.NOTES]: NOTES_POOL[Math.floor(Math.random() * NOTES_POOL.length)]
            };

            // Insert Booking
            const { error: bkErr } = await supabase
                .from('bookings')
                .insert({
                    organization_id: ORG_ID,
                    customer_id: customer.id,
                    availability_id: avail.id,
                    status: 'confirmed',
                    pax_count: paxCount,
                    pax_breakdown: paxBreakdown,
                    option_values: optionValues,
                    notes: optionValues[FIELD_IDS.NOTES],
                    confirmation_number: `ACI-${generateNumeric(6)}`
                });

            if (bkErr) {
                console.error(`   Failed booking: ${bkErr.message}`);
            } else {
                successCount++;
            }
        }
        console.log(`   ✅ Created ${successCount} bookings for ${date}`);
    }

    console.log('\n✨ Reporting Data Generation Complete!');
}

main().catch(console.error);
