const { createClient } = require('@supabase/supabase-js');

// Load env vars manually since we are running via node directly
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split(/\r?\n/).forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) {
            process.env[key.trim()] = val.trim().replace(/^['"]|['"]$/g, '');
        }
    });
} catch (e) {
    console.log("Could not load .env.local, checking process env");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Attempting insert...");
    const payload = {
        name: "test_field_" + Date.now(),
        label: "Test Field",
        type: "text",
        description: "Debug description",
        is_internal: false,
        options: []
    };

    const { data, error } = await supabase
        .from("custom_field_definitions")
        .insert([payload])
        .select();

    if (error) {
        console.error("INSERT FAILED:");
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log("INSERT SUCCESS:");
        console.log(data);
    }
}

testInsert();
