import { z } from "zod";

export const ExperienceSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Name is required"),
    slogan: z.string().optional(),
    event_type: z.string().default("Tour"),

    // Timing
    start_time: z.string().optional(),
    end_time: z.string().optional(),

    // Description & Details
    description: z.string().optional(),

    // Capacity
    min_group_size: z.number().optional().nullable(),
    max_group_size: z.number().optional().nullable(),

    // Age Limits
    min_age: z.number().optional().nullable(),
    max_age: z.number().optional().nullable(),

    // Lists (Arrays)
    what_to_bring: z.array(z.string()).default([]),

    // Logistics
    checkin_details: z.string().optional(),
    transport_details: z.string().optional(),

    // Policies
    cancellation_policy: z.string().optional(),
    restrictions: z.string().optional(),
    disclaimer: z.string().optional(),
    waiver_link: z.string().optional(),

    is_active: z.boolean().default(true)
});

export type Experience = z.infer<typeof ExperienceSchema>;
