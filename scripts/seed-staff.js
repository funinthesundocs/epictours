
const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Try Service Role Key first, then Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

console.log('Using Key:', supabaseKey === process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key (Bypass RLS)' : 'Anon Key (RLS Restricted)');

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seed() {
    console.log('Seeding Staff...');

    // 1. Get Organization
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'aloha-circle-island') // Or 'default'
        .single();

    if (orgError) {
        console.error('Error finding org:', orgError);
        return;
    }
    const orgId = org.id;
    console.log(`Target Organization: ${orgId}`);

    // 2. Get Users
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, name');

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    const adminUser = users.find(u => u.email === 'funinthesundocs');
    const denisUser = users.find(u => u.email === 'denis@crodesign.com');

    // 3. Get Positions
    const { data: positions, error: posError } = await supabase
        .from('staff_positions')
        .select('id, name');

    if (posError) {
        console.error('Error fetching positions:', posError);
        return;
    }

    // Find IDs - adjust names if needed based on check-data output
    const superAdminPos = positions.find(p => p.name === 'Super Admin');
    const adminPos = positions.find(p => p.name === 'Admin');

    // 4. Insert Members
    const membersToInsert = [];

    if (adminUser && superAdminPos) {
        membersToInsert.push({
            organization_id: orgId,
            user_id: adminUser.id,
            primary_position_id: superAdminPos.id,
            status: 'active',
            is_organization_owner: true
        });
    }

    if (denisUser && adminPos) {
        membersToInsert.push({
            organization_id: orgId,
            user_id: denisUser.id,
            primary_position_id: adminPos.id,
            status: 'active',
            is_organization_owner: false
        });
    }

    if (membersToInsert.length > 0) {
        const { data: inserted, error: insertError } = await supabase
            .from('organization_users')
            .upsert(membersToInsert, { onConflict: 'organization_id, user_id' })
            .select();

        if (insertError) {
            console.error('Error inserting members:', insertError);
        } else {
            console.log('Successfully seeded members:', inserted.length);
            console.table(inserted);
        }
    } else {
        console.log('No members to insert (users or positions missing).');
    }
}

seed();
