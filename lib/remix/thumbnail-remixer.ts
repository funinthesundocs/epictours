import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fal from '@fal-ai/serverless-client';

export interface ThumbnailAnalysis {
  composition: string;
  dominantColors: string[];
  textOverlay: string;
  style: string;
  mood: string;
}

export interface ThumbnailVariation {
  prompt: string;
  imageUrl: string;
  index: number;
}

export interface ThumbnailRemixResult {
  analysis: ThumbnailAnalysis;
  variations: ThumbnailVariation[];
  tokensUsed: number;
}

/**
 * Analyze original thumbnail with Gemini Vision, then generate 3 thumbnails via fal.ai FLUX.
 * Workflow:
 * 1. Analyze original thumbnail with Gemini Vision (base64 inline)
 * 2. Generate image prompts from analysis + title context
 * 3. Generate 3 thumbnails at 1280x720 via fal.ai FLUX
 */
export async function remixThumbnails(
  originalThumbnailBase64: string,
  originalTitle: string,
  remixedTitle: string,
  customPromptModifier?: string,
): Promise<ThumbnailRemixResult> {
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!geminiKey) throw new Error('GOOGLE_GEMINI_API_KEY is not set');

  const falKey = process.env.FAL_KEY;
  if (!falKey) throw new Error('FAL_KEY is not set');

  fal.config({ credentials: falKey });

  // Step 1: Analyze original thumbnail with Gemini Vision
  const genAI = new GoogleGenerativeAI(geminiKey);
  const visionModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
    },
  });

  const analysisPrompt = `Analyze this YouTube thumbnail image and return a JSON object with:
{
  "composition": "Description of layout, subject placement, and visual hierarchy",
  "dominantColors": ["color1", "color2", "color3"],
  "textOverlay": "Description of any text overlays, fonts, and positioning",
  "style": "Overall style (e.g., cinematic, minimalist, bold, collage)",
  "mood": "Emotional tone (e.g., exciting, mysterious, professional, fun)"
}

Be specific and detailed. This analysis will be used to generate new thumbnail variations.`;

  const analysisResult = await visionModel.generateContent([
    analysisPrompt,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: originalThumbnailBase64,
      },
    },
  ]);

  let analysis: ThumbnailAnalysis;
  try {
    analysis = JSON.parse(analysisResult.response.text());
  } catch {
    analysis = {
      composition: 'Standard YouTube thumbnail',
      dominantColors: ['#1a1a2e', '#16213e', '#0f3460'],
      textOverlay: 'Bold title text',
      style: 'modern',
      mood: 'engaging',
    };
  }

  const analysisTokens = analysisResult.response.usageMetadata?.totalTokenCount || 0;

  // Step 2: Generate 3 thumbnail prompts with Gemini
  const promptModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.8,
      responseMimeType: 'application/json',
    },
  });

  const promptGeneration = `You are an expert YouTube thumbnail designer. Based on the analysis of the original thumbnail and the new title, generate 3 different thumbnail image prompts.

Original Title: "${originalTitle}"
New Title: "${remixedTitle}"
${customPromptModifier ? `Custom modifier: "${customPromptModifier}"` : ''}

Original Thumbnail Analysis:
- Composition: ${analysis.composition}
- Dominant Colors: ${analysis.dominantColors.join(', ')}
- Text Overlay: ${analysis.textOverlay}
- Style: ${analysis.style}
- Mood: ${analysis.mood}

Generate 3 different thumbnail prompts. Each should be a different creative interpretation:
1. **Style-matched** — Similar style to the original but with the new title's theme
2. **Bold alternative** — A bolder, more eye-catching design approach
3. **Cinematic** — A cinematic/dramatic interpretation of the title's theme

Rules:
- Each prompt should be 50-120 words
- Include specific visual elements, colors, lighting, composition
- Do NOT include any text/words in the image (text will be overlaid separately)
- Focus on creating visually striking thumbnails that work at small sizes
- Keep the subject matter relevant to the video content

Return a JSON array:
[
  { "prompt": "Full image generation prompt here..." },
  { "prompt": "Full image generation prompt here..." },
  { "prompt": "Full image generation prompt here..." }
]`;

  const promptResult = await promptModel.generateContent(promptGeneration);
  const promptTokens = promptResult.response.usageMetadata?.totalTokenCount || 0;

  let prompts: { prompt: string }[];
  try {
    const parsed = JSON.parse(promptResult.response.text());
    prompts = Array.isArray(parsed) ? parsed : parsed.prompts || parsed.variations || [];
  } catch {
    throw new Error('Failed to parse thumbnail prompts from Gemini');
  }

  if (prompts.length === 0) throw new Error('No thumbnail prompts generated');

  // Step 3: Generate 3 images via fal.ai FLUX
  const variations: ThumbnailVariation[] = [];

  for (let i = 0; i < Math.min(prompts.length, 3); i++) {
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: prompts[i].prompt,
        image_size: { width: 1280, height: 720 },
        num_images: 1,
        num_inference_steps: 28,
        guidance_scale: 3.5,
      },
    }) as any;

    if (result?.images?.[0]?.url) {
      variations.push({
        prompt: prompts[i].prompt,
        imageUrl: result.images[0].url,
        index: i,
      });
    }
  }

  return {
    analysis,
    variations,
    tokensUsed: analysisTokens + promptTokens,
  };
}
