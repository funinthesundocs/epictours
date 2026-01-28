import { z } from "zod";

// Status is now just a string (Flexible)
export const CustomerStatusSchema = z.string();
export type CustomerStatus = z.infer<typeof CustomerStatusSchema>;

export const CustomerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  status: z.string().default("Lead"),
  total_value: z.number().default(0),
  last_active: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  avatar_url: z.string().optional().nullable(),

  // JSONB Fields (Flexible Data)
  preferences: z.object({
    dietary: z.array(z.string()).default([]),
    accessibility: z.string().optional().nullable(),

    emergency_contact: z.object({
      name: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      relationship: z.string().optional().nullable()
    }).optional().nullable(),
    marketing_consent: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(false),
      whatsapp: z.boolean().default(false)
    }).default({}),
    preferred_messaging_app: z.enum([
      "WhatsApp",
      "FB Messenger",
      "Signal",
      "Telegram",
      "Viber",
      "Line",
      "WeChat"
    ]).optional().nullable(),
    notes: z.string().optional().nullable()
  }).default({}),

  // Technical Metadata
  metadata: z.object({
    source: z.enum([
      "Google Ad",
      "Google Map",
      "AI Search",
      "Facebook",
      "YouTube",
      "Instagram",
      "Word of Mouth",
      "Repeat Customer",
      "Email Offer",
      "Other"
    ]).optional().nullable(),
    campaign: z.string().optional().nullable(),
    hotel: z.string().optional().nullable()
  }).default({})
});

export type Customer = z.infer<typeof CustomerSchema>;
