import { GoogleGenerativeAI } from '@google/generative-ai';

const TITLE_STYLES = [
  'curiosity_gap',
  'direct_value',
  'contrarian',
  'listicle',
  'question',
  'emotional_hook',
  'tutorial',
  'story_driven',
] as const;

export type TitleStyle = typeof TITLE_STYLES[number];

export interface TitleVariation {
  style: TitleStyle;
  title: string;
  reasoning: string;
}

export interface TitleRemixResult {
  variations: TitleVariation[];
  tokensUsed: number;
}

/**
 * Generate 8 title variations using Gemini 2.0 Flash.
 * Uses JSON mode for reliable structured output.
 */
export async function remixTitles(
  originalTitle: string,
  transcript: string,
  description?: string,
): Promise<TitleRemixResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY is not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.8,
      responseMimeType: 'application/json',
    },
  });

  const transcriptSnippet = transcript.slice(0, 3000);

  const prompt = `You are an expert YouTube title strategist. Given the original title and transcript of a video, generate 8 alternative title variations, one for each style category.

Original Title: "${originalTitle}"
${description ? `Description: "${description}"` : ''}
Transcript (first 3000 chars): "${transcriptSnippet}"

Generate exactly 8 titles, one for each style:

1. **curiosity_gap** — Create intrigue with an information gap ("I Tried X and This Happened")
2. **direct_value** — State the clear benefit ("How to Get X in Y Days")
3. **contrarian** — Challenge conventional wisdom ("Why Everything You Know About X is Wrong")
4. **listicle** — Use numbers ("7 Secrets to X That Nobody Talks About")
5. **question** — Ask a compelling question ("Is X Really Worth It?")
6. **emotional_hook** — Trigger emotion ("The Heartbreaking Truth About X")
7. **tutorial** — Clear how-to ("Complete Guide to X (Step by Step)")
8. **story_driven** — Personal narrative ("How I Went From X to Y in Z")

Rules:
- Each title should be under 70 characters
- Titles should be compelling and click-worthy but NOT clickbait
- Each title should be meaningfully different from the others
- Stay faithful to the actual content of the video

Return a JSON array with exactly 8 objects:
[
  { "style": "curiosity_gap", "title": "...", "reasoning": "Brief explanation of why this title works" },
  { "style": "direct_value", "title": "...", "reasoning": "..." },
  ...
]`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  let variations: TitleVariation[];
  try {
    const parsed = JSON.parse(text);
    variations = Array.isArray(parsed) ? parsed : parsed.variations || parsed.titles || [];
  } catch {
    throw new Error('Failed to parse Gemini title response as JSON');
  }

  // Validate and ensure all 8 styles are present
  const validVariations = variations
    .filter((v: any) => v.style && v.title && TITLE_STYLES.includes(v.style))
    .map((v: any) => ({
      style: v.style as TitleStyle,
      title: String(v.title).slice(0, 100),
      reasoning: String(v.reasoning || '').slice(0, 300),
    }));

  const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

  return { variations: validVariations, tokensUsed };
}
