/**
 * Runway Gen-3 Alpha Turbo — B-roll video generation via fal.ai.
 * Uses FAL_KEY (fal.ai wraps Runway Gen-3 with full API coverage).
 */

import * as fal from '@fal-ai/serverless-client';
import { uploadRemixAsset, remixStoragePath, getRemixSignedUrl } from './storage';

export interface RunwayResult {
  storagePath: string;
  signedUrl: string;
  durationSeconds: number;
}

/**
 * Generate a B-roll video clip from a text description using Runway Gen-3 Turbo.
 * Stores result in Supabase and returns a signed URL.
 */
export async function generateRunwayBroll(
  description: string,
  orgId: string,
  projectId: string,
  sceneId: string,
  durationSeconds: number = 5,
): Promise<RunwayResult> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) throw new Error('FAL_KEY is not set');

  fal.config({ credentials: falKey });

  // Runway Gen-3 Alpha Turbo via fal.ai
  const result = await fal.subscribe('fal-ai/runway-gen3/turbo/image-to-video', {
    input: {
      prompt: description,
      duration: durationSeconds <= 5 ? 5 : 10,
      ratio: '1280:720',
    },
  }) as any;

  const videoUrl = result?.video?.url || result?.url;
  if (!videoUrl) throw new Error('Runway returned no video URL');

  // Download and store in Supabase
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) throw new Error(`Failed to download Runway video: ${videoRes.status}`);
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

  const storagePath = remixStoragePath(orgId, projectId, 'broll', `scene_${sceneId}_runway.mp4`);
  await uploadRemixAsset(storagePath, videoBuffer, 'video/mp4');
  const signedUrl = await getRemixSignedUrl(storagePath);

  return {
    storagePath,
    signedUrl,
    durationSeconds: durationSeconds <= 5 ? 5 : 10,
  };
}
