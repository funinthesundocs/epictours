/**
 * Video assembly orchestrator.
 * Pure logic — takes local file paths, outputs a local MP4.
 * No Supabase, no network calls.
 *
 * Assembly flow per scene:
 *   1. Pick video: avatarVideoPath (priority) → brollVideoPath → null
 *   2. Normalize each clip to 1920x1080 30fps H.264 with dialogue audio
 *   3. Concatenate all normalized clips
 *
 * Called by the render worker handler (which handles file downloads/uploads).
 */

import { mkdirSync } from 'fs';
import { join } from 'path';
import { normalizeClip, concatClips } from './ffmpeg-utils';

export interface AssemblyScene {
  sceneNumber: number;
  avatarVideoLocalPath?: string;
  brollVideoLocalPath?: string;
  audioLocalPath?: string;
  onScreenText?: string;
  durationSeconds: number;
}

export interface AssemblyOptions {
  scenes: AssemblyScene[];
  outputPath: string;
  tmpDir: string;
  onProgress?: (pct: number, message: string) => void;
}

export interface AssemblyResult {
  outputPath: string;
  sceneCount: number;
  durationSeconds: number;
}

/**
 * Assemble a final MP4 from scene assets.
 *
 * @param options - Assembly configuration
 * @returns Path to the assembled video and metadata
 */
export async function assembleVideo(options: AssemblyOptions): Promise<AssemblyResult> {
  const { scenes, outputPath, tmpDir, onProgress } = options;

  mkdirSync(tmpDir, { recursive: true });
  const normalizedDir = join(tmpDir, 'normalized');
  mkdirSync(normalizedDir, { recursive: true });

  const scenesWithVideo = scenes.filter(
    (s) => s.avatarVideoLocalPath || s.brollVideoLocalPath,
  );

  if (scenesWithVideo.length === 0) {
    throw new Error('No scenes have video assets — cannot assemble');
  }

  const normalizedPaths: string[] = [];
  let totalDuration = 0;

  // Phase 1: Normalize each scene clip
  for (let i = 0; i < scenesWithVideo.length; i++) {
    const scene = scenesWithVideo[i];
    const pct = Math.round((i / scenesWithVideo.length) * 70);
    onProgress?.(pct, `Normalizing scene ${scene.sceneNumber}/${scenesWithVideo.length}...`);

    const videoPath = scene.avatarVideoLocalPath || scene.brollVideoLocalPath;
    if (!videoPath) continue;

    const normalizedPath = join(normalizedDir, `scene_${String(scene.sceneNumber).padStart(3, '0')}.mp4`);

    await normalizeClip(videoPath, normalizedPath, {
      audioPath: scene.audioLocalPath,
      onScreenText: scene.onScreenText,
    });

    normalizedPaths.push(normalizedPath);
    totalDuration += scene.durationSeconds;
  }

  if (normalizedPaths.length === 0) {
    throw new Error('No clips were normalized — assembly failed');
  }

  onProgress?.(75, 'Concatenating scenes...');

  // Phase 2: Concatenate all normalized clips
  if (normalizedPaths.length === 1) {
    // Single scene — just copy
    const { copyFileSync } = require('fs');
    copyFileSync(normalizedPaths[0], outputPath);
  } else {
    const concatListPath = join(tmpDir, 'concat_list.txt');
    await concatClips(normalizedPaths, concatListPath, outputPath);
  }

  onProgress?.(100, 'Assembly complete');

  return {
    outputPath,
    sceneCount: normalizedPaths.length,
    durationSeconds: totalDuration,
  };
}
