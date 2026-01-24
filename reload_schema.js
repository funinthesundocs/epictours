const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres" // Using the port I saw in previous commands
});

async function reload() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // 1. Create table if not exists (Idempotent fix)
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            label TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'select', 'quantity', 'checkbox', 'transport', 'header', 'date')),
            description TEXT,
            is_internal BOOLEAN DEFAULT false,
            options JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        -- Enable RLS
        ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
        
        -- Policies (Drop first to avoid errors)
        DROP POLICY IF EXISTS "Allow public access" ON public.custom_field_definitions;
        CREATE POLICY "Allow public access" ON public.custom_field_definitions FOR ALL TO public USING (true) WITH CHECK (true);
        
        -- Grants
        GRANT ALL ON public.custom_field_definitions TO anon;
        GRANT ALL ON public.custom_field_definitions TO authenticated;
        GRANT ALL ON public.custom_field_definitions TO service_role;

        -- Migration: Add settings column
        ALTER TABLE public.custom_field_definitions ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
        
        -- FIX: Apply missing Booking Columns manually here to ensure they exist
        ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS option_values JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'no_payment';
        ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'credit_card';
        ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0.00;
        ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0.00;
        ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promo_code TEXT;
        ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;
        `;

        await client.query(createTableSQL);
        console.log("Table Setup/Verified.");

        // 2. Notify Pgrst to reload schema
        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log("Sent NOTIFY pgrst, 'reload schema'");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

reload();
