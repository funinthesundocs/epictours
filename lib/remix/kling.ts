/**
 * Kling AI — B-roll video generation via fal.ai.
 * Uses FAL_KEY (fal.ai wraps Kling with text-to-video support).
 */

import * as fal from '@fal-ai/serverless-client';
import { uploadRemixAsset, remixStoragePath, getRemixSignedUrl } from './storage';

export interface KlingResult {
  storagePath: string;
  signedUrl: string;
  durationSeconds: number;
}

/**
 * Generate a B-roll video clip from a text description using Kling.
 * Stores result in Supabase and returns a signed URL.
 */
export async function generateKlingBroll(
  description: string,
  orgId: string,
  projectId: string,
  sceneId: string,
  durationSeconds: number = 5,
): Promise<KlingResult> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) throw new Error('FAL_KEY is not set');

  fal.config({ credentials: falKey });

  // Kling text-to-video via fal.ai
  const result = await fal.subscribe('fal-ai/kling-video/v1.6/standard/text-to-video', {
    input: {
      prompt: description,
      duration: durationSeconds <= 5 ? '5' : '10',
      aspect_ratio: '16:9',
      negative_prompt: 'blur, distortion, watermark, text, low quality',
    },
  }) as any;

  const videoUrl = result?.video?.url || result?.videos?.[0]?.url;
  if (!videoUrl) throw new Error('Kling returned no video URL');

  // Download and store in Supabase
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) throw new Error(`Failed to download Kling video: ${videoRes.status}`);
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

  const storagePath = remixStoragePath(orgId, projectId, 'broll', `scene_${sceneId}_kling.mp4`);
  await uploadRemixAsset(storagePath, videoBuffer, 'video/mp4');
  const signedUrl = await getRemixSignedUrl(storagePath);

  return {
    storagePath,
    signedUrl,
    durationSeconds: durationSeconds <= 5 ? 5 : 10,
  };
}
