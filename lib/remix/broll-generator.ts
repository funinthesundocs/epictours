/**
 * B-roll generation orchestrator.
 * Picks the right provider: runway, kling, or auto (prefers kling).
 */

import { generateKlingBroll, type KlingResult } from './kling';
import { generateRunwayBroll, type RunwayResult } from './runway';

export type BrollProvider = 'runway' | 'kling' | 'auto';

export interface BrollResult {
  storagePath: string;
  signedUrl: string;
  durationSeconds: number;
  providerUsed: 'runway' | 'kling';
}

/**
 * Generate a B-roll video clip for a scene.
 *
 * - 'kling': Kling text-to-video via fal.ai (preferred for text-only)
 * - 'runway': Runway Gen-3 Turbo via fal.ai
 * - 'auto': Try kling first, fall back to runway on error
 */
export async function generateBroll(
  description: string,
  orgId: string,
  projectId: string,
  sceneId: string,
  provider: BrollProvider = 'auto',
  durationSeconds: number = 5,
): Promise<BrollResult> {
  if (provider === 'kling') {
    const res = await generateKlingBroll(description, orgId, projectId, sceneId, durationSeconds);
    return { ...res, providerUsed: 'kling' };
  }

  if (provider === 'runway') {
    const res = await generateRunwayBroll(description, orgId, projectId, sceneId, durationSeconds);
    return { ...res, providerUsed: 'runway' };
  }

  // auto: try kling first, fall back to runway
  try {
    const res = await generateKlingBroll(description, orgId, projectId, sceneId, durationSeconds);
    return { ...res, providerUsed: 'kling' };
  } catch {
    const res = await generateRunwayBroll(description, orgId, projectId, sceneId, durationSeconds);
    return { ...res, providerUsed: 'runway' };
  }
}
