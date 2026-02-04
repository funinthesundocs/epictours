// Seed script: Query inventory and generate test bookings
// Run with: npx ts-node scripts/seed-test-bookings.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Name pools for realistic data
const FIRST_NAMES = [
    'Michael', 'Sarah', 'David', 'Jennifer', 'Robert', 'Amanda', 'Christopher', 'Jessica',
    'Daniel', 'Michelle', 'James', 'Stephanie', 'Andrew', 'Nicole', 'Matthew', 'Ashley',
    'Joshua', 'Elizabeth', 'Ryan', 'Megan', 'Brandon', 'Lauren', 'Kevin', 'Heather',
    'Justin', 'Rachel', 'Brian', 'Amber', 'Steven', 'Brittany', 'Eric', 'Danielle',
    'Thomas', 'Christina', 'William', 'Samantha', 'Jason', 'Melissa', 'Mark', 'Rebecca',
    'Timothy', 'Kimberly', 'Jeffrey', 'Laura', 'Scott', 'Emily', 'Anthony', 'Angela',
    'Benjamin', 'Tiffany'
];

const LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
    'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
    'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
    'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
    'Carter', 'Roberts'
];

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'hotmail.com'];

// Generate unique phone number
function generatePhone(index: number): string {
    const areaCode = 808; // Hawaii
    const prefix = 200 + Math.floor(index / 100);
    const line = 1000 + (index % 1000);
    return `+1-${areaCode}-${prefix}-${String(line).padStart(4, '0')}`;
}

// Generate unique email
function generateEmail(first: string, last: string, index: number): string {
    const domain = EMAIL_DOMAINS[index % EMAIL_DOMAINS.length];
    const suffix = index > 50 ? index : '';
    return `${first.toLowerCase()}.${last.toLowerCase()}${suffix}@${domain}`;
}

// Generate confirmation number
function generateConfirmation(index: number): string {
    return `ACI-${String(index + 1000).padStart(6, '0')}`;
}

async function main() {
    console.log('🚀 Starting test booking generation...\n');

    // 1. Get organization
    const { data: orgs } = await supabase
        .from('organizations')
        .select('id, slug')
        .eq('slug', 'aloha-circle-island')
        .single();

    if (!orgs) {
        console.error('❌ Organization not found');
        return;
    }
    const orgId = orgs.id;
    console.log(`✅ Organization: ${orgs.slug} (${orgId})`);

    // 2. Get experience - specifically "Aloha Circle Island"
    const { data: experiences } = await supabase
        .from('experiences')
        .select('id, name')
        .eq('organization_id', orgId)
        .ilike('name', '%Circle Island%')
        .limit(1);

    const expId = experiences?.[0]?.id;
    if (!expId) {
        // Fallback: list all experiences to help debug
        const { data: allExp } = await supabase.from('experiences').select('id, name').eq('organization_id', orgId);
        console.log('Available experiences:', allExp?.map(e => e.name));
        console.error('❌ Aloha Circle Island experience not found');
        return;
    }
    console.log(`✅ Experience: ${experiences[0].name}`);

    // 3. Get availabilities (Feb 1 - Dec 31, 2026)
    // First, let's see what dates exist
    const { data: debugAvail } = await supabase
        .from('availabilities')
        .select('id, start_date, max_capacity')
        .eq('experience_id', expId)
        .order('start_date')
        .limit(10);

    console.log('🔍 Debug - Sample availabilities:', debugAvail?.map(a => a.start_date));

    const { data: availabilities, error: availError } = await supabase
        .from('availabilities')
        .select('id, start_date, max_capacity')
        .eq('experience_id', expId)
        .gte('start_date', '2026-02-01')
        .lte('start_date', '2026-12-31')
        .order('start_date');

    if (availError || !availabilities) {
        console.error('❌ Error fetching availabilities:', availError);
        return;
    }

    console.log(`✅ Found ${availabilities.length} availability slots`);

    // 4. Calculate capacity
    const totalCapacity = availabilities.reduce((sum, a) => sum + (a.max_capacity || 0), 0);
    const targetBookings = Math.floor(totalCapacity * 0.35); // 35% fill
    console.log(`📊 Total capacity: ${totalCapacity}, Target bookings (35%): ${targetBookings} pax\n`);

    // 5. Get hotels for custom field answers
    const { data: hotels } = await supabase
        .from('hotels')
        .select('id, name')
        .eq('organization_id', orgId)
        .limit(10);

    // 6. Generate users and customers
    console.log('👤 Creating test users and customers...');
    const usedNames = new Set<string>();
    const customers: { id: string; userId: string; name: string }[] = [];

    let customerCount = 0;
    const maxCustomers = Math.min(150, Math.ceil(targetBookings / 4)); // Avg 4 pax per booking

    for (let i = 0; i < maxCustomers; i++) {
        // Generate unique name
        let firstName: string, lastName: string, fullName: string;
        do {
            firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
            lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
            fullName = `${firstName} ${lastName}`;
        } while (usedNames.has(fullName));
        usedNames.add(fullName);

        const email = generateEmail(firstName, lastName, i);
        const phone = generatePhone(i);

        // Create user
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert({
                name: fullName,
                email: email,
                phone_number: phone,
                organization_id: orgId,
                is_active: true
            })
            .select('id')
            .single();

        if (userError) {
            console.error(`Error creating user ${fullName}:`, userError.message);
            continue;
        }

        // Create customer linked to user
        const { data: customer, error: custError } = await supabase
            .from('customers')
            .insert({
                user_id: user.id,
                organization_id: orgId,
                status: 'active'
            })
            .select('id')
            .single();

        if (custError) {
            console.error(`Error creating customer for ${fullName}:`, custError.message);
            continue;
        }

        customers.push({ id: customer.id, userId: user.id, name: fullName });
        customerCount++;
    }
    console.log(`✅ Created ${customerCount} customers\n`);

    // 7. Create bookings
    console.log('📅 Creating bookings...');
    let totalPaxBooked = 0;
    let bookingCount = 0;
    let paymentCash = 0;

    for (const avail of availabilities) {
        if (totalPaxBooked >= targetBookings) break;

        const capacity = avail.max_capacity || 20;
        const targetForSlot = Math.floor(capacity * 0.35);
        let slotPax = 0;

        while (slotPax < targetForSlot && totalPaxBooked < targetBookings) {
            // Random group size 2-10
            const paxCount = Math.min(
                2 + Math.floor(Math.random() * 9), // 2-10
                targetForSlot - slotPax,
                targetBookings - totalPaxBooked
            );

            // Pick random customer
            const customer = customers[Math.floor(Math.random() * customers.length)];

            // Build pax breakdown with guest names
            const paxBreakdown: any[] = [];
            for (let p = 0; p < paxCount; p++) {
                const guestFirst = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
                const guestLast = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
                paxBreakdown.push({
                    name: p === 0 ? customer.name : `${guestFirst} ${guestLast}`,
                    type: 'adult'
                });
            }

            // Payment - 50% cash paid, 50% no payment
            const isCashPaid = bookingCount % 2 === 0;
            const totalAmount = paxCount * 159; // Example rate

            // Hotel selection for option_values
            const selectedHotel = hotels?.[Math.floor(Math.random() * (hotels?.length || 1))];

            const { error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    availability_id: avail.id,
                    customer_id: customer.id,
                    pax_count: paxCount,
                    pax_breakdown: paxBreakdown,
                    total_amount: totalAmount,
                    amount_paid: isCashPaid ? totalAmount : 0,
                    payment_status: isCashPaid ? 'paid' : 'pending',
                    payment_method: isCashPaid ? 'cash' : null,
                    confirmation_number: generateConfirmation(bookingCount),
                    option_values: {
                        hotel_id: selectedHotel?.id || null,
                        hotel_name: selectedHotel?.name || 'Self Drive',
                        special_requests: '',
                        dietary_restrictions: 'None'
                    },
                    organization_id: orgId
                });

            if (bookingError) {
                console.error(`Error creating booking:`, bookingError.message);
                continue;
            }

            slotPax += paxCount;
            totalPaxBooked += paxCount;
            bookingCount++;
            if (isCashPaid) paymentCash++;
        }
    }

    console.log(`\n✅ COMPLETE!`);
    console.log(`   📋 Bookings created: ${bookingCount}`);
    console.log(`   👥 Total pax: ${totalPaxBooked}`);
    console.log(`   💵 Cash paid: ${paymentCash}`);
    console.log(`   ⏳ No payment: ${bookingCount - paymentCash}`);
}

main().catch(console.error);
