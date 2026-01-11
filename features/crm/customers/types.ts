import { z } from "zod";

export const CustomerStatusSchema = z.enum(["active", "lead", "inactive", "archived"]);
export type CustomerStatus = z.infer<typeof CustomerStatusSchema>;

export const CustomerSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    status: CustomerStatusSchema,
    total_value: z.number(), // Lifetime value in USD
    last_active: z.string().datetime(),
    tags: z.array(z.string()),
    avatar_url: z.string().optional()
});

export type Customer = z.infer<typeof CustomerSchema>;
