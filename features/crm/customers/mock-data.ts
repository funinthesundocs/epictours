import { Customer } from "./types";

export const mockCustomers: Customer[] = Array.from({ length: 50 }).map((_, i) => ({
    id: `cust_${i + 1}`,
    name: [
        "Alice Johnson", "David Smith", "Elena Rodriguez", "Michael Chen", "Sarah Williams",
        "James Brown", "Emily Davis", "Robert Wilson", "Jessica Garcia", "William Miller"
    ][i % 10],
    email: `customer${i + 1}@example.com`,
    phone: `+1 (555) 000-${(i + 1000).toString().slice(1)}`,
    status: ["active", "lead", "inactive", "archived"][i % 4] as any,
    total_value: Math.floor(Math.random() * 10000),
    last_active: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    tags: [["VIP"], ["New"], ["Corporate"], ["Referral"], []][i % 5],
    avatar_url: `https://i.pravatar.cc/150?u=${i}`,
    preferences: {
        dietary: [],
        marketing_consent: { email: true, sms: false, whatsapp: false },
        preferred_messaging_app: ["WhatsApp", "Telegram", "WeChat"][i % 3] as any,
    },
    metadata: {
        hotel: ["Hilton", "Sheraton", "Ritz"][i % 3],
        source: ["Google Ad", "Facebook", "Word of Mouth"][i % 3] as any
    }
}));
