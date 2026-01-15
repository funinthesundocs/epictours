const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
    console.log("🔍 Starting Diagnostics...");

    // 1. Check .env.local
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error("❌ FATAL: .env.local file NOT found.");
        process.exit(1);
    }
    console.log("✅ .env.local found.");

    // 2. Load Env Vars manually (to avoid dotenv dep if missing)
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
            env[key] = value;
        }
    });

    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error("❌ FATAL: Missing Supabase credentials in .env.local");
        console.log("URL:", url ? "Present" : "Missing");
        console.log("KEY:", key ? "Present" : "Missing");
        process.exit(1);
    }
    console.log("✅ Credentials loaded.");

    // 3. Test Connection
    try {
        const supabase = createClient(url, key);
        // Try to fetch 1 row from 'users' or 'profiles' (assuming public access or service role not needed for anon check typically fails if RLS blocks, but connection works)
        // Better to check something public or just see if it throws a network error.
        // We will try 'experiences' as it was recently worked on.
        const { data, error } = await supabase.from('experiences').select('count', { count: 'exact', head: true });

        if (error) {
            console.error("⚠️ Connection established, but query error (RLS?):", error.message);
        } else {
            console.log("✅ Supabase Connection: HEALTHY (Experiences Table reachable)");
        }
    } catch (err) {
        console.error("❌ Supabase Connection FAILED:", err.message);
        process.exit(1);
    }
}

testConnection();
