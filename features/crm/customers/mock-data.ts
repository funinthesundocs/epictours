import { Customer } from "./types";

export const mockCustomers: Customer[] = Array.from({ length: 50 }).map((_, i) => ({
    id: `cust_${i + 1}`,
    name: [
        "Alice Johnson", "David Smith", "Elena Rodriguez", "Michael Chen", "Sarah Williams",
        "James Wilson", "Patricia Brown", "Robert Miller", "Jennifer Davis", "William Garcia"
    ][i % 10] + (i > 9 ? ` ${i}` : ""),
    email: `user${i}@example.com`,
    status: (["active", "active", "lead", "inactive", "archived"][i % 5]) as any,
    total_value: Math.floor(Math.random() * 5000) + 100,
    last_active: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
    tags: i % 2 === 0 ? ["VIP", "2024"] : ["New"],
}));
