
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Fetching availabilities...");
    const { data: availabilities, error: err1 } = await supabase
        .from('availabilities')
        .select('id, start_date, experience_id, duration_type, max_capacity');

    if (err1) {
        console.error("Error fetching availabilities:", err1);
        return;
    }

    console.log(`Found ${availabilities?.length} availabilities.`);

    console.log("Fetching experiences...");
    const { data: experiences, error: err2 } = await supabase
        .from('experiences')
        .select('id, name, short_code');

    if (err2) {
        console.error("Error fetching experiences:", err2);
        return;
    }
    console.log(`Found ${experiences?.length} experiences.`);

    const expMap = Object.fromEntries(experiences?.map(e => [e.id, e]) || []);

    const fillers = availabilities?.filter(a => {
        const exp = expMap[a.experience_id];
        return !exp || exp.short_code === 'EXP';
    });

    console.log("Potential FILLER items (Missing experience or EXP code):");
    fillers?.forEach(f => {
        const exp = expMap[f.experience_id];
        console.log(`ID: ${f.id}, Date: ${f.start_date}, ExpID: ${f.experience_id}, Code: ${exp?.short_code || 'N/A'}`);
    });

    const valid = availabilities?.filter(a => {
        const exp = expMap[a.experience_id];
        return exp && exp.short_code !== 'EXP';
    });

    console.log("\nRequests that would be VALID:");
    valid?.forEach(f => {
        const exp = expMap[f.experience_id];
        console.log(`ID: ${f.id}, Date: ${f.start_date}, Code: ${exp?.short_code} (${exp?.name})`);
    });
}

inspect();
