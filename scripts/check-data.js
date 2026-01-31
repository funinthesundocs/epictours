
const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Checking Organizations...');
    const { data: orgs, error: orgError } = await supabase.from('organizations').select('*');
    if (orgError) console.error('Error fetching orgs:', orgError);
    console.table(orgs);

    console.log('\nChecking Users...');
    const { data: users, error: userError } = await supabase.from('users').select('id, name, email');
    if (userError) console.error('Error fetching users:', userError);
    console.table(users);

    console.log('\nChecking Staff Positions...');
    const { data: positions, error: posError } = await supabase.from('staff_positions').select('*');
    if (posError) console.error('Error fetching positions:', posError);
    console.table(positions);

    console.log('\nChecking Organization Members...');
    const { data: members, error: memberError } = await supabase.from('organization_users').select('*, user:users(name, email)');
    if (memberError) console.error('Error fetching members:', memberError);
    console.table(members);
}

checkData();
