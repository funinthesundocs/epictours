import { uploadRemixAsset, remixStoragePath, getRemixSignedUrl } from './storage';

const ELEVEN_BASE = 'https://api.elevenlabs.io';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

export interface GenerateAudioResult {
  storagePath: string;
  signedUrl: string;
  durationEstimate: number;
  charCount: number;
}

export async function listVoices(): Promise<ElevenLabsVoice[]> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY is not set');

  const res = await fetch(`${ELEVEN_BASE}/v1/voices`, {
    headers: { 'xi-api-key': key },
  });

  if (!res.ok) throw new Error(`ElevenLabs voices failed: ${res.status}`);
  const data = await res.json();
  return data.voices || [];
}

export async function generateAudio(
  text: string,
  voiceId: string,
  orgId: string,
  projectId: string,
  sceneId: string,
  voiceSettings?: { stability?: number; similarity_boost?: number; style?: number },
): Promise<GenerateAudioResult> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY is not set');

  const res = await fetch(`${ELEVEN_BASE}/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: voiceSettings?.stability ?? 0.5,
        similarity_boost: voiceSettings?.similarity_boost ?? 0.75,
        style: voiceSettings?.style ?? 0.5,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs TTS failed: ${res.status} — ${errText}`);
  }

  const audioBuffer = Buffer.from(await res.arrayBuffer());
  const storagePath = remixStoragePath(orgId, projectId, 'audio', `scene_${sceneId}.mp3`);

  await uploadRemixAsset(storagePath, audioBuffer, 'audio/mpeg');
  const signedUrl = await getRemixSignedUrl(storagePath);

  const wordCount = text.split(/\s+/).length;
  const durationEstimate = Math.round(wordCount / 2.5);

  return {
    storagePath,
    signedUrl,
    durationEstimate,
    charCount: text.length,
  };
}

/** Preview voice — returns raw audio buffer (not stored, short clip). */
export async function previewVoice(
  text: string,
  voiceId: string,
  voiceSettings?: { stability?: number; similarity_boost?: number; style?: number },
): Promise<Buffer> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY is not set');

  const res = await fetch(`${ELEVEN_BASE}/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text.slice(0, 500),
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: voiceSettings?.stability ?? 0.5,
        similarity_boost: voiceSettings?.similarity_boost ?? 0.75,
        style: voiceSettings?.style ?? 0.5,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs preview failed: ${res.status} — ${errText}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
