/**
 * FFmpeg utility functions for video normalization and assembly.
 * Pure utility — no Supabase or external API calls.
 * All paths are absolute local filesystem paths (use /tmp in worker).
 *
 * Requires FFMPEG_PATH env var on Windows, or ffmpeg on system PATH.
 */

import ffmpeg from 'fluent-ffmpeg';
import { existsSync } from 'fs';
import { join } from 'path';

// Configure ffmpeg path (required on Windows)
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

export interface VideoInfo {
  width: number;
  height: number;
  duration: number; // seconds
  fps: number;
  hasAudio: boolean;
}

/** Probe a video file and return basic metadata. */
export function probeVideo(inputPath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, data) => {
      if (err) return reject(new Error(`ffprobe failed: ${err.message}`));

      const videoStream = data.streams.find((s) => s.codec_type === 'video');
      const audioStream = data.streams.find((s) => s.codec_type === 'audio');

      if (!videoStream) return reject(new Error('No video stream found'));

      const [num, den] = (videoStream.r_frame_rate || '30/1').split('/').map(Number);
      const fps = den ? num / den : 30;

      resolve({
        width: videoStream.width || 1920,
        height: videoStream.height || 1080,
        duration: parseFloat(String(data.format.duration || 0)),
        fps,
        hasAudio: !!audioStream,
      });
    });
  });
}

/**
 * Normalize a video clip to 1920x1080 H.264 30fps.
 * If audioPath is provided, replaces the video's audio track.
 * If on_screen_text is provided, adds a text overlay.
 */
export function normalizeClip(
  videoPath: string,
  outputPath: string,
  options?: {
    audioPath?: string;
    onScreenText?: string;
    targetWidth?: number;
    targetHeight?: number;
    fps?: number;
  },
): Promise<void> {
  const {
    audioPath,
    onScreenText,
    targetWidth = 1920,
    targetHeight = 1080,
    fps = 30,
  } = options || {};

  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(videoPath);

    if (audioPath && existsSync(audioPath)) {
      cmd = cmd.input(audioPath);
    }

    // Video filters: scale to target resolution, maintain aspect with padding
    const vf = [
      `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease`,
      `pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:black`,
    ];

    if (onScreenText) {
      const escapedText = onScreenText.replace(/[\\:]/g, (c) => `\\${c}`).replace(/'/g, "\\'");
      vf.push(
        `drawtext=text='${escapedText}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-120:box=1:boxcolor=black@0.7:boxborderw=12:font=sans-serif`,
      );
    }

    cmd
      .outputOptions([
        '-vf', vf.join(','),
        '-r', String(fps),
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        ...(audioPath ? ['-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest'] : ['-an']),
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`normalizeClip failed: ${err.message}`)))
      .run();
  });
}

/**
 * Concatenate a list of normalized video clips into a single output file.
 * All inputs MUST have matching resolution, fps, and codec (use normalizeClip first).
 *
 * @param clipPaths - Ordered list of absolute paths to normalized clips
 * @param concatListPath - Path to write the temporary concat list file
 * @param outputPath - Path for the final concatenated video
 */
export function concatClips(
  clipPaths: string[],
  concatListPath: string,
  outputPath: string,
): Promise<void> {
  const { writeFileSync } = require('fs');
  const concatContent = clipPaths.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n');
  writeFileSync(concatListPath, concatContent, 'utf8');

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions(['-c', 'copy'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`concatClips failed: ${err.message}`)))
      .run();
  });
}

/**
 * Convert an audio file (MP3) to AAC for use in video.
 */
export function convertAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(['-c:a', 'aac', '-b:a', '192k'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`convertAudio failed: ${err.message}`)))
      .run();
  });
}
