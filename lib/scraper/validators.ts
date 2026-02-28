import { z } from 'zod';

export const ScrapeRequestSchema = z.object({
  url: z.string().url({ message: 'Must be a valid URL' }),
  collectionId: z.string().uuid().optional(),
  config: z.object({
    depth: z.number().int().min(0).max(3).default(0),
    maxPages: z.number().int().min(1).max(50).default(1),
    includeImages: z.boolean().default(true),
    includeVideos: z.boolean().default(true),
    includeFiles: z.boolean().default(true),
    includeSource: z.boolean().default(true),
    includeMetadata: z.boolean().default(true),
    renderJs: z.boolean().default(false),
  }).optional(),
});

export type ScrapeRequest = z.infer<typeof ScrapeRequestSchema>;

export const BatchScrapeRequestSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(25),
  collectionId: z.string().uuid().optional(),
  config: ScrapeRequestSchema.shape.config,
});

export type BatchScrapeRequest = z.infer<typeof BatchScrapeRequestSchema>;

export const UpdateItemSchema = z.object({
  tags: z.array(z.string().max(50)).max(20).optional(),
  notes: z.string().max(5000).optional(),
  collectionId: z.string().uuid().nullable().optional(),
  isStarred: z.boolean().optional(),
});

export type UpdateItem = z.infer<typeof UpdateItemSchema>;

export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type CreateCollection = z.infer<typeof CreateCollectionSchema>;

export const LibrarySearchSchema = z.object({
  query: z.string().min(1).max(500),
  sourceType: z.string().optional(),
  contentType: z.string().optional(),
  collectionId: z.string().uuid().optional(),
  isStarred: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type LibrarySearch = z.infer<typeof LibrarySearchSchema>;
