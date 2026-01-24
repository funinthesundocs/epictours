const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
});

async function debugCustomFields() {
    try {
        await client.connect();
        console.log("Connected. Fetching custom fields and sample booking...");

        // 1. Fetch Custom Field Definitions
        const fieldsRes = await client.query(`
            SELECT id, label, options FROM custom_field_definitions
        `);
        console.log("\n--- Custom Field Definitions ---");
        fieldsRes.rows.forEach(f => {
            console.log(`Field: ${f.label} (${f.id})`);
            console.log("Options:", JSON.stringify(f.options, null, 2));
        });

        // 2. Fetch a recent booking with option_values
        const bookingRes = await client.query(`
            SELECT id, customer_id, option_values FROM bookings 
            WHERE option_values IS NOT NULL AND option_values != '{}'::jsonb 
            LIMIT 1
        `);

        console.log("\n--- Sample Booking Option Values ---");
        bookingRes.rows.forEach(b => {
            console.log(`Booking ID: ${b.id}`);
            console.log("Option Values:", JSON.stringify(b.option_values, null, 2));
        });

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

debugCustomFields();
