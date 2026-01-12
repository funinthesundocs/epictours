const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../database/10_seed_250_customers.sql');

const HOTELS = [
    "Hilton Hawaiian Village", "Sheraton Waikiki", "The Royal Hawaiian", "Moana Surfrider",
    "Halekulani", "Ritz-Carlton Residences", "Marriott Resort", "Hyatt Regency",
    "Prince Waikiki", "Four Seasons", "Alohilani Resort", "The Kahala", "Outrigger Reef",
    "Laylow", "Turtle Bay", "Espacio", "Surfjack", "Hale Koa", "Aulani", "Trump International"
];

const SOURCES = [
    "Google Ad", "Google Map", "Instagram", "Facebook", "Concierge",
    "Website", "Referral", "Repeat Customer", "TripAdvisor", "Blog Post"
];

const APPS = ["WhatsApp", "SMS", "Email", "iMessage", "Telegram", "WeChat", "Signal"];

const STATUSES = ["active", "lead", "inactive"];

const TAGS_POOL = ["vip", "family", "honeymoon", "corporate", "adventure", "golf", "wedding", "senior", "local", "repeat"];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone() {
    return `+1 (808) 555-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

const customers = [];

for (let i = 1; i <= 250; i++) {
    const firstName = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Sarah", "Jessica", "Lisa", "Jennifer", "Mary", "Patricia", "Linda", "Barbara", "Elizabeth", "Susan"][Math.floor(Math.random() * 20)];
    const lastName = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"][Math.floor(Math.random() * 20)];

    const name = `${firstName} ${lastName} ${i}`; // Append index to ensure uniqueness if names collide
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const phone = generatePhone();
    const status = Math.random() > 0.3 ? "active" : (Math.random() > 0.5 ? "lead" : "inactive");

    // "AP" Column - now a text placeholder
    const totalValue = "-";

    // JSONB Fields
    const hotel = getRandomItem(HOTELS);
    const source = getRandomItem(SOURCES);
    const app = getRandomItem(APPS);
    const tag = getRandomItem(TAGS_POOL);

    // Construct SQL Value
    const preferences = JSON.stringify({
        preferred_messaging_app: app,
        marketing_consent: { email: true, sms: false },
        dietary: []
    });

    const metadata = JSON.stringify({
        hotel: hotel,
        source: source
    });

    const tags = `{${tag}}`;

    // totalValue is now a string literal in SQL
    customers.push(`('${name}', '${email}', '${phone}', '${status}', '${tags}', '${totalValue}', '${preferences}', '${metadata}')`);
}

const sqlContent = `-- Generated 250 Customers via Script
-- Run this in Supabase SQL Editor

INSERT INTO "public"."customers" ("name", "email", "phone", "status", "tags", "total_value", "preferences", "metadata") VALUES
${customers.join(',\n')};
`;

fs.writeFileSync(OUTPUT_FILE, sqlContent);
console.log(`Generated ${customers.length} customers to ${OUTPUT_FILE}`);
