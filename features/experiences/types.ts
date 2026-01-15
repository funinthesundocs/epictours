import { z } from "zod";
import { Database } from "@/types/supabase_gen";

// 1. The "Truth" comes from the Database
export type Experience = Database['public']['Tables']['experiences']['Row'] & { short_code?: string | null };
export type NewExperience = Database['public']['Tables']['experiences']['Insert'] & { short_code?: string | null };

// 2. The Form Schema is for UI Validation Only
export const ExperienceSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2, "Name is required"),
    short_code: z.string().max(4, "Max 4 chars").optional().nullable(),
    slogan: z.string().optional().nullable(),
    event_type: z.string().default("Tour"),

    // Coercion: Handle "12" -> 12 automatically
    start_time: z.string().optional().nullable(),
    end_time: z.string().optional().nullable(),

    min_age: z.coerce.number().optional().nullable(),
    max_age: z.coerce.number().optional().nullable(),
    min_group_size: z.coerce.number().optional().nullable(),
    max_group_size: z.coerce.number().optional().nullable(),

    description: z.string().optional().nullable(),
    what_to_bring: z.string().optional().nullable(), // Form uses String (TextArea), DB uses Array

    checkin_details: z.string().optional().nullable(),
    transport_details: z.string().optional().nullable(),
    cancellation_policy: z.string().optional().nullable(),
    restrictions: z.string().optional().nullable(),
    disclaimer: z.string().optional().nullable(),
    waiver_link: z.string().optional().nullable(),

    is_active: z.boolean().default(true)
});

export type ExperienceFormData = z.infer<typeof ExperienceSchema>;
