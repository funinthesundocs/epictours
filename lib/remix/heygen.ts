/**
 * HeyGen avatar video generation.
 *
 * SECURITY CRITICAL: Audio must be uploaded to HeyGen Asset API first.
 * NEVER pass audio_url directly — always use audio_asset_id.
 *
 * Flow:
 *   1. Download audio from Supabase signed URL
 *   2. Upload to HeyGen Asset API → get asset_id
 *   3. Generate video with audio_asset_id (not audio_url)
 *   4. Poll status or receive webhook for completion
 *   5. Download completed video and store in Supabase
 */

import { uploadRemixAsset, remixStoragePath, getRemixSignedUrl } from './storage';

const HEYGEN_API = 'https://api.heygen.com';
const HEYGEN_UPLOAD = 'https://upload.heygen.com';

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url?: string;
  preview_video_url?: string;
}

export interface HeyGenJobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  error?: string;
}

export interface GenerateAvatarResult {
  videoId: string; // HeyGen video_id for polling
}

export async function listAvatars(): Promise<HeyGenAvatar[]> {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error('HEYGEN_API_KEY is not set');

  const res = await fetch(`${HEYGEN_API}/v2/avatars`, {
    headers: { 'X-Api-Key': key },
  });

  if (!res.ok) throw new Error(`HeyGen avatars failed: ${res.status}`);
  const data = await res.json();
  return data.data?.avatars || [];
}

/**
 * Upload audio file to HeyGen Asset API.
 * Returns the asset_id to use in video generation.
 */
async function uploadAudioToHeyGen(audioBuffer: Buffer, filename: string): Promise<string> {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error('HEYGEN_API_KEY is not set');

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mpeg' });
  formData.append('file', blob, filename);
  formData.append('type', 'audio');

  const res = await fetch(`${HEYGEN_UPLOAD}/v1/asset`, {
    method: 'POST',
    headers: { 'X-Api-Key': key },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HeyGen audio upload failed: ${res.status} — ${errText}`);
  }

  const data = await res.json();
  const assetId = data.data?.asset_id || data.asset_id;
  if (!assetId) throw new Error('HeyGen audio upload returned no asset_id');
  return assetId;
}

/**
 * Generate an avatar video for a scene.
 *
 * @param audioSignedUrl - Supabase signed URL for the scene's audio file
 * @param avatarId - HeyGen avatar ID
 * @param background - { type: 'color'|'image'|'transparent', value?: '#rrggbb' }
 * @param aspectRatio - '16:9' | '9:16'
 * @returns { videoId } — HeyGen video_id for status polling
 */
export async function generateAvatarVideo(
  audioSignedUrl: string,
  avatarId: string,
  background: { type: 'color' | 'image' | 'transparent'; value?: string },
  aspectRatio: '16:9' | '9:16' = '16:9',
): Promise<GenerateAvatarResult> {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error('HEYGEN_API_KEY is not set');

  // Step 1: Download audio from Supabase
  const audioRes = await fetch(audioSignedUrl);
  if (!audioRes.ok) throw new Error(`Failed to fetch audio for HeyGen: ${audioRes.status}`);
  const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

  // Step 2: Upload audio to HeyGen — get asset_id (NEVER use audio_url)
  const audioAssetId = await uploadAudioToHeyGen(audioBuffer, `scene_audio_${Date.now()}.mp3`);

  // Step 3: Submit video generation
  const dimension = aspectRatio === '16:9'
    ? { width: 1280, height: 720 }
    : { width: 720, height: 1280 };

  const bgPayload: Record<string, any> = { type: background.type };
  if (background.type === 'color') bgPayload.value = background.value || '#0A0A0B';
  if (background.type === 'image') bgPayload.url = background.value;

  const res = await fetch(`${HEYGEN_API}/v2/video/generate`, {
    method: 'POST',
    headers: {
      'X-Api-Key': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: avatarId,
            avatar_style: 'normal',
          },
          voice: {
            type: 'audio',
            audio_asset_id: audioAssetId, // CRITICAL: asset_id, never audio_url
          },
          background: bgPayload,
        },
      ],
      dimension,
      aspect_ratio: aspectRatio,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HeyGen video generation failed: ${res.status} — ${errText}`);
  }

  const data = await res.json();
  const videoId = data.data?.video_id || data.video_id;
  if (!videoId) throw new Error('HeyGen video generation returned no video_id');

  return { videoId };
}

/** Poll HeyGen for video status. */
export async function getVideoStatus(videoId: string): Promise<HeyGenJobStatus> {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error('HEYGEN_API_KEY is not set');

  const res = await fetch(`${HEYGEN_API}/v1/video_status.get?video_id=${videoId}`, {
    headers: { 'X-Api-Key': key },
  });

  if (!res.ok) throw new Error(`HeyGen status check failed: ${res.status}`);
  const data = await res.json();

  const status = data.data?.status;
  if (status === 'completed') {
    return { status: 'completed', video_url: data.data.video_url };
  }
  if (status === 'failed') {
    return { status: 'failed', error: data.data.error || 'Unknown HeyGen error' };
  }
  if (status === 'processing') return { status: 'processing' };
  return { status: 'pending' };
}

/**
 * Download a completed HeyGen video and store it in Supabase.
 * Call this after polling confirms status === 'completed'.
 */
export async function downloadAndStoreVideo(
  videoUrl: string,
  orgId: string,
  projectId: string,
  sceneId: string,
): Promise<{ storagePath: string; signedUrl: string }> {
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) throw new Error(`Failed to download HeyGen video: ${videoRes.status}`);
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

  const storagePath = remixStoragePath(orgId, projectId, 'avatar', `scene_${sceneId}.mp4`);
  await uploadRemixAsset(storagePath, videoBuffer, 'video/mp4');
  const signedUrl = await getRemixSignedUrl(storagePath);

  return { storagePath, signedUrl };
}
