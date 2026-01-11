import { z } from "zod";

export const CustomerStatusSchema = z.enum(["active", "lead", "inactive", "archived"]);
export type CustomerStatus = z.infer<typeof CustomerStatusSchema>;

export const CustomerSchema = z.object({
  id: z.string().uuid().optional(), // Optional for creation
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  status: z.enum(["active", "lead", "inactive", "archived"]).default("lead"),
  total_value: z.number().default(0),
  last_active: z.string().optional(), // ISO Date
  tags: z.array(z.string()).default([]),
  avatar_url: z.string().optional().nullable(),

  // JSONB Fields (Flexible Data)
  preferences: z.object({
    dietary: z.array(z.string()).default([]), // e.g., ["Vegan", "Gluten-Free"]
    accessibility: z.string().optional(),

    emergency_contact: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional()
    }).optional(),
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
    ]).optional(),
    notes: z.string().optional()
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
    ]).optional(),
    campaign: z.string().optional(),
    hotel: z.string().optional() // Current Hotel / Accommodation
  }).default({})
});

export type Customer = z.infer<typeof CustomerSchema>;
