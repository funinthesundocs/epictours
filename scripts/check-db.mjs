import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://gtzpspdtdnkjoblbvzxo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0enBzcGR0ZG5ram9ibGJ2enhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODkyNjAsImV4cCI6MjA4MzY2NTI2MH0.Ij1j3rYjAheln4mvHMrZR6Mrki5B8wqsfNkgMgaWDkE'
);

async function check() {
    console.log("\n=== Checking check_in_statuses table ===\n");

    const { data, error } = await supabase
        .from('check_in_statuses')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.log("ERROR:", error.message);
        console.log("\nThe table may not exist yet. Please run the SQL migration:");
        console.log("File: sql/check_in_statuses_migration.sql");
    } else {
        console.log("Table exists! Found", data.length, "statuses:\n");
        data.forEach(s => {
            console.log(`  - ${s.status} (${s.color})`);
        });
    }

    console.log("\n=== Checking bookings.check_in_status_id column ===\n");

    const { data: bookings, error: bError } = await supabase
        .from('bookings')
        .select('id, check_in_status_id')
        .limit(3);

    if (bError) {
        console.log("ERROR:", bError.message);
        if (bError.message.includes('check_in_status_id')) {
            console.log("\nThe column may not exist yet. Please run the SQL migration.");
        }
    } else {
        console.log("Column exists! Sample bookings:");
        bookings.forEach(b => {
            console.log(`  - ${b.id.slice(0, 8)}... : ${b.check_in_status_id || 'null'}`);
        });
    }

    console.log("\n=== Done ===\n");
}

check();
