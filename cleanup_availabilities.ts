
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gtzpspdtdnkjoblbvzxo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0enBzcGR0ZG5ram9ibGJ2enhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODkyNjAsImV4cCI6MjA4MzY2NTI2MH0.Ij1j3rYjAheln4mvHMrZR6Mrki5B8wqsfNkgMgaWDkE";
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log("Starting cleanup of filler availabilities...");

    // 1. Get all availabilities
    const { data: availabilities, error: err1 } = await supabase
        .from('availabilities')
        .select('id, start_date, experience_id');

    if (err1) {
        console.error("Error fetching availabilities:", err1);
        return;
    }

    console.log(`Total availabilities: ${availabilities?.length}`);

    // 2. Get all experiences to map IDs
    const { data: experiences, error: err2 } = await supabase
        .from('experiences')
        .select('id, short_code');

    if (err2) {
        console.error("Error fetching experiences:", err2);
        return;
    }

    const expMap = Object.fromEntries(experiences?.map(e => [e.id, e.short_code]) || []);

    // 3. Identify items to delete
    const toDelete = availabilities?.filter(a => {
        // Condition 1: Missing experience_id
        if (!a.experience_id) return true;
        // Condition 2: Experience does not exist in map
        const code = expMap[a.experience_id];
        if (!code) return true;
        // Condition 3: Experience code is explicitly 'EXP' (if that's how fillers are marked)
        if (code === 'EXP') return true;

        return false;
    });

    console.log(`Found ${toDelete?.length} filler items to delete.`);

    if (toDelete && toDelete.length > 0) {
        const ids = toDelete.map(a => a.id);

        // 4. Delete them
        const { error: deleteError } = await supabase
            .from('availabilities')
            .delete()
            .in('id', ids);

        if (deleteError) {
            console.error("Error deleting items:", deleteError);
        } else {
            console.log(`Successfully deleted ${ids.length} items.`);
        }
    } else {
        console.log("No items to delete.");
    }
}

cleanup();
