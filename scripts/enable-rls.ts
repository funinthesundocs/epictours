import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function runMigration() {
    console.log('🚀 Starting RLS enablement migration...\n');

    const tables = [
        'availability_assignments',
        'organization_subscriptions',
        'organization_users'
    ];

    // Enable RLS on each table using raw SQL
    for (const table of tables) {
        try {
            const { error } = await supabase.rpc('exec', {
                sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
            });

            if (error) {
                console.error(`❌ Error enabling RLS on ${table}:`, error.message);
            } else {
                console.log(`✅ Enabled RLS on ${table}`);
            }
        } catch (err: any) {
            console.error(`❌ Exception on ${table}:`, err.message);
        }
    }

    console.log('\n✨ Migration complete!');
}

runMigration().catch(console.error);
