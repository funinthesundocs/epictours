import { z } from 'zod';

export const CreateRemixProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  scraperItemIds: z.array(z.string().uuid()).min(1).max(10),
  settings: z.object({
    aspect_ratio: z.enum(['16:9', '9:16']).default('16:9'),
    voice_id: z.string().nullable().default(null),
    avatar_id: z.string().nullable().default(null),
  }).optional(),
});

export type CreateRemixProject = z.infer<typeof CreateRemixProjectSchema>;

export const UpdateRemixProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  settings: z.object({
    aspect_ratio: z.enum(['16:9', '9:16']).optional(),
    voice_id: z.string().nullable().optional(),
    avatar_id: z.string().nullable().optional(),
    voice_settings: z.object({
      stability: z.number().min(0).max(1).optional(),
      similarity_boost: z.number().min(0).max(1).optional(),
      style: z.number().min(0).max(1).optional(),
    }).optional(),
  }).optional(),
});

export type UpdateRemixProject = z.infer<typeof UpdateRemixProjectSchema>;

export const RemixTitleRequestSchema = z.object({
  sourceId: z.string().uuid(),
});

export type RemixTitleRequest = z.infer<typeof RemixTitleRequestSchema>;

export const RemixThumbnailRequestSchema = z.object({
  sourceId: z.string().uuid(),
  customPromptModifier: z.string().max(500).optional(),
});

export type RemixThumbnailRequest = z.infer<typeof RemixThumbnailRequestSchema>;

export const RemixScriptRequestSchema = z.object({
  sourceId: z.string().uuid(),
  selectedTitleId: z.string().uuid().optional(),
  tone: z.enum(['professional', 'casual', 'energetic', 'educational', 'storytelling']).optional(),
});

export type RemixScriptRequest = z.infer<typeof RemixScriptRequestSchema>;

export const GenerateAudioRequestSchema = z.object({
  sceneId: z.string().uuid(),
  voiceId: z.string().min(1),
  voiceSettings: z.object({
    stability: z.number().min(0).max(1).default(0.5),
    similarity_boost: z.number().min(0).max(1).default(0.75),
    style: z.number().min(0).max(1).default(0.5),
  }).optional(),
});

export type GenerateAudioRequest = z.infer<typeof GenerateAudioRequestSchema>;

export const GenerateAvatarRequestSchema = z.object({
  sceneId: z.string().uuid(),
  avatarId: z.string().min(1),
  background: z.object({
    type: z.enum(['color', 'image', 'transparent']),
    value: z.string().optional(),
  }).default({ type: 'color', value: '#0A0A0B' }),
  aspectRatio: z.enum(['16:9', '9:16']).default('16:9'),
});

export type GenerateAvatarRequest = z.infer<typeof GenerateAvatarRequestSchema>;

export const GenerateBRollRequestSchema = z.object({
  sceneId: z.string().uuid(),
  provider: z.enum(['runway', 'kling', 'auto']).default('auto'),
  durationSeconds: z.number().int().min(2).max(8).default(4),
});

export type GenerateBRollRequest = z.infer<typeof GenerateBRollRequestSchema>;

export const RenderRequestSchema = z.object({
  projectId: z.string().uuid(),
  sourceId: z.string().uuid(),
  scriptId: z.string().uuid(),
  includeIntro: z.boolean().default(true),
  includeOutro: z.boolean().default(true),
});

export type RenderRequest = z.infer<typeof RenderRequestSchema>;

export const CancelJobSchema = z.object({
  jobId: z.string().uuid(),
});

export type CancelJob = z.infer<typeof CancelJobSchema>;
