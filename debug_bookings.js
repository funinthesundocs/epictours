const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
});

async function checkBookings() {
    try {
        await client.connect();
        console.log("Connected. Checking bookings...");

        const res = await client.query(`
            SELECT b.id, b.status, b.pax_count, c.name as customer, a.start_date
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            JOIN availabilities a ON b.availability_id = a.id
            ORDER BY b.created_at DESC
            LIMIT 5;
        `);

        if (res.rows.length === 0) {
            console.log("No bookings found in the database.");
        } else {
            console.log("Most recent bookings:");
            console.table(res.rows);
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

checkBookings();
