/**
 * Render handler — assembles final video from scene assets.
 * Downloads scene assets from Supabase, runs ffmpeg assembly, uploads final MP4.
 *
 * Worker context: relative imports only, no @/ aliases.
 * Creates own Supabase admin client (supabase-admin.ts uses @/ alias — cannot import).
 */

import { createClient } from '@supabase/supabase-js';
import { mkdirSync, rmSync, writeFileSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../../lib/logger';
import { assembleVideo, AssemblyScene } from '../../lib/remix/assembler';

const log = createLogger('render-handler');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const BUCKET = 'epic-assets';

export interface RenderJobData {
  jobId: string;
  projectId: string;
  orgId: string;
}

async function downloadAsset(storagePath: string, localPath: string): Promise<boolean> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) {
    log.warn({ storagePath, error: error?.message }, 'Failed to download asset');
    return false;
  }
  writeFileSync(localPath, Buffer.from(await data.arrayBuffer()));
  return true;
}

export async function handleRender(data: RenderJobData): Promise<void> {
  const { jobId, projectId, orgId } = data;
  const tmpDir = `/tmp/render/${projectId}`;
  const startTime = Date.now();

  mkdirSync(join(tmpDir, 'assets'), { recursive: true });

  try {
    await supabase
      .from('remix_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString(), progress: 5 })
      .eq('id', jobId);

    // 1. Load selected script
    const { data: script, error: scriptError } = await supabase
      .from('remix_scripts')
      .select('id, source_id, total_duration_seconds')
      .eq('project_id', projectId)
      .eq('is_selected', true)
      .single();

    if (scriptError || !script) {
      throw new Error(`No selected script — cannot render: ${scriptError?.message}`);
    }

    // 2. Load scenes ordered by scene_number
    const { data: scenes, error: scenesError } = await supabase
      .from('remix_scenes')
      .select('*')
      .eq('script_id', script.id)
      .order('scene_number');

    if (scenesError || !scenes || scenes.length === 0) {
      throw new Error(`No scenes found: ${scenesError?.message}`);
    }

    await supabase.from('remix_jobs').update({ progress: 10 }).eq('id', jobId);
    await supabase.from('remix_projects').update({ status: 'assembling' }).eq('id', projectId);

    // 3. Download scene assets to /tmp
    const assemblyScenes: AssemblyScene[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const pct = Math.round(10 + (i / scenes.length) * 30);
      await supabase.from('remix_jobs').update({ progress: pct }).eq('id', jobId);

      const sceneTmpDir = join(
        tmpDir,
        'assets',
        `scene_${String(scene.scene_number).padStart(3, '0')}`,
      );
      mkdirSync(sceneTmpDir, { recursive: true });

      let avatarVideoLocalPath: string | undefined;
      let brollVideoLocalPath: string | undefined;
      let audioLocalPath: string | undefined;

      // Avatar video: highest priority
      if (scene.avatar_video_path && scene.avatar_status === 'complete') {
        const localPath = join(sceneTmpDir, 'avatar.mp4');
        if (await downloadAsset(scene.avatar_video_path, localPath)) {
          avatarVideoLocalPath = localPath;
        }
      }

      // B-roll: fallback if no avatar
      if (!avatarVideoLocalPath && scene.broll_video_path && scene.broll_status === 'complete') {
        const localPath = join(sceneTmpDir, 'broll.mp4');
        if (await downloadAsset(scene.broll_video_path, localPath)) {
          brollVideoLocalPath = localPath;
        }
      }

      // Dialogue audio
      if (scene.audio_file_path && scene.audio_status === 'complete') {
        const ext = scene.audio_file_path.endsWith('.aac') ? 'aac' : 'mp3';
        const localPath = join(sceneTmpDir, `audio.${ext}`);
        if (await downloadAsset(scene.audio_file_path, localPath)) {
          audioLocalPath = localPath;
        }
      }

      assemblyScenes.push({
        sceneNumber: scene.scene_number,
        avatarVideoLocalPath,
        brollVideoLocalPath,
        audioLocalPath,
        onScreenText: scene.on_screen_text || undefined,
        durationSeconds: scene.duration_seconds,
      });
    }

    // 4. Run ffmpeg assembly
    const outputPath = join(tmpDir, 'final.mp4');
    const assemblyTmpDir = join(tmpDir, 'assembly');

    const result = await assembleVideo({
      scenes: assemblyScenes,
      outputPath,
      tmpDir: assemblyTmpDir,
      onProgress: async (pct, message) => {
        // Map assembly 0-100 → job 40-90
        const jobPct = Math.round(40 + pct * 0.5);
        await supabase.from('remix_jobs').update({ progress: jobPct }).eq('id', jobId);
        log.info({ projectId, pct, message }, 'Assembly progress');
      },
    });

    // 5. Upload final MP4 to Supabase storage
    await supabase.from('remix_jobs').update({ progress: 92 }).eq('id', jobId);

    const videoBuffer = readFileSync(outputPath);
    const fileSizeBytes = videoBuffer.length;
    const storagePath = `remix/${orgId}/${projectId}/rendered/final.mp4`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, videoBuffer, { contentType: 'video/mp4', upsert: true });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const renderTimeSec = Math.round((Date.now() - startTime) / 1000);

    // 6. Create remix_rendered_videos record
    const { error: videoError } = await supabase.from('remix_rendered_videos').insert({
      project_id: projectId,
      source_id: script.source_id,
      script_id: script.id,
      file_path: storagePath,
      duration_seconds: result.durationSeconds || script.total_duration_seconds || null,
      resolution: '1080p',
      file_size_bytes: fileSizeBytes,
      render_time_seconds: renderTimeSec,
    });

    if (videoError) {
      log.warn({ projectId, error: videoError.message }, 'Failed to create rendered_video record');
    }

    // 7. Mark project complete + job complete
    await supabase.from('remix_projects').update({ status: 'complete' }).eq('id', projectId);
    await supabase
      .from('remix_jobs')
      .update({
        status: 'complete',
        progress: 100,
        completed_at: new Date().toISOString(),
        result: {
          storagePath,
          fileSizeBytes,
          durationSeconds: result.durationSeconds,
          sceneCount: result.sceneCount,
        },
      })
      .eq('id', jobId);

    log.info(
      { projectId, jobId, storagePath, sceneCount: result.sceneCount },
      'Render complete',
    );
  } catch (error: any) {
    log.error({ projectId, jobId, error: error.message }, 'Render failed');
    await supabase
      .from('remix_jobs')
      .update({
        status: 'error',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    await supabase.from('remix_projects').update({ status: 'error' }).eq('id', projectId);
    throw error;
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}
