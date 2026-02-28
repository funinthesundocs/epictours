import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ScriptScene {
  sceneNumber: number;
  dialogue: string;
  brollDescription: string;
  onScreenText?: string;
  durationSeconds: number;
}

export interface ScriptRemixResult {
  fullScript: string;
  scenes: ScriptScene[];
  totalDurationSeconds: number;
  tokensUsed: number;
}

const TONE_DESCRIPTIONS: Record<string, string> = {
  professional: 'Polished, authoritative, and informative with clear delivery',
  casual: 'Conversational, relaxed, and relatable like talking to a friend',
  energetic: 'High energy, enthusiastic, and fast-paced with excitement',
  educational: 'Clear explanations, step-by-step, with helpful examples',
  storytelling: 'Narrative-driven, engaging with a compelling arc and personal touch',
};

/**
 * Rewrite a transcript into a scene-based script using Gemini 2.0 Flash.
 * Each scene has dialogue (15-45s), B-roll description, optional on-screen text.
 * Temperature 0.6 — more faithful to source than title generation.
 */
export async function remixScript(
  transcript: string,
  title: string,
  description?: string,
  tone: string = 'professional',
): Promise<ScriptRemixResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY is not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.6,
      responseMimeType: 'application/json',
    },
  });

  const toneDesc = TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS.professional;

  const prompt = `You are an expert video scriptwriter. Rewrite the following transcript into a scene-based script for a new video.

Title: "${title}"
${description ? `Description: "${description}"` : ''}
Tone: ${tone} — ${toneDesc}

Original Transcript:
"""
${transcript.slice(0, 8000)}
"""

Rewrite this as a scene-based script following these rules:

1. Each scene should be 15-45 seconds of spoken dialogue
2. Estimate duration at ~2.5 words per second
3. Include a B-roll description for each scene (visual content to show during/between talking)
4. Include optional on-screen text for key points, stats, or calls to action
5. Maintain the core information and message of the original
6. Adapt the tone and style to match "${tone}"
7. Create a natural flow with intro, body, and conclusion
8. Aim for 6-12 scenes total depending on content length
9. Each scene's dialogue should be speakable (no stage directions, just the words to be said)

Return a JSON object:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "dialogue": "The exact words to be spoken in this scene...",
      "brollDescription": "Description of B-roll visuals to show (e.g., 'aerial drone shot of city skyline at sunset')",
      "onScreenText": "Key Point: Important stat or text" | null,
      "durationSeconds": 25
    }
  ]
}

Important:
- Every scene MUST have dialogue and brollDescription
- durationSeconds should be calculated from word count (words / 2.5)
- The total script should cover the same content as the original transcript
- B-roll descriptions should be vivid and specific enough to generate AI video from`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  let parsed: { scenes: ScriptScene[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Failed to parse script response from Gemini as JSON');
  }

  const scenes = (parsed.scenes || [])
    .filter((s: any) => s.dialogue && s.brollDescription)
    .map((s: any, i: number) => ({
      sceneNumber: s.sceneNumber || i + 1,
      dialogue: String(s.dialogue),
      brollDescription: String(s.brollDescription),
      onScreenText: s.onScreenText ? String(s.onScreenText) : undefined,
      durationSeconds: Number(s.durationSeconds) || Math.round(String(s.dialogue).split(/\s+/).length / 2.5),
    }));

  const totalDurationSeconds = scenes.reduce((sum, s) => sum + s.durationSeconds, 0);

  // Build full script text (all dialogue concatenated)
  const fullScript = scenes.map((s) => s.dialogue).join('\n\n');

  const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

  return {
    fullScript,
    scenes,
    totalDurationSeconds,
    tokensUsed,
  };
}
