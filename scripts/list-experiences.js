const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function listExperiences() {
    const { data, error } = await supabase.from('experiences').select('name');
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

listExperiences();
