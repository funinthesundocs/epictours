/**
 * Cost estimation for Remix pipeline stages.
 * Prices are approximate and may change — update rates here.
 */

interface CostBreakdown {
  geminiTitle: number;
  geminiScript: number;
  falThumbnails: number;
  elevenLabsAudio: number;
  heygenAvatar: number;
  runwayBroll: number;
  total: number;
}

interface EstimateInput {
  transcriptWordCount: number;
  sceneCount: number;
  avgSceneDurationSeconds: number;
  thumbnailCount?: number;
  titleVariationCount?: number;
}

// Approximate per-unit costs (USD)
const RATES = {
  // Gemini 2.0 Flash — ~$0.10/1M input tokens, ~$0.30/1M output
  geminiInputPerToken: 0.0000001,
  geminiOutputPerToken: 0.0000003,

  // fal.ai FLUX — ~$0.025 per image
  falPerImage: 0.025,

  // ElevenLabs — ~$0.30 per 1000 characters
  elevenLabsPerChar: 0.0003,

  // HeyGen — ~$0.033 per second (based on $2/min)
  heygenPerSecond: 0.033,

  // Runway ML Gen-3 — ~$0.05 per second
  runwayPerSecond: 0.05,
};

export function estimateCost(input: EstimateInput): CostBreakdown {
  const {
    transcriptWordCount,
    sceneCount,
    avgSceneDurationSeconds,
    thumbnailCount = 3,
    titleVariationCount = 8,
  } = input;

  // Approximate token counts (1 word ≈ 1.3 tokens)
  const inputTokens = Math.ceil(transcriptWordCount * 1.3);

  // Title remix: input transcript + output 8 titles (~200 tokens)
  const geminiTitle = (inputTokens * RATES.geminiInputPerToken) + (200 * titleVariationCount * RATES.geminiOutputPerToken);

  // Script remix: input transcript + output scenes (~500 tokens per scene)
  const geminiScript = (inputTokens * RATES.geminiInputPerToken) + (500 * sceneCount * RATES.geminiOutputPerToken);

  // Thumbnails: 3 images via fal.ai
  const falThumbnails = thumbnailCount * RATES.falPerImage;

  // Audio: average ~15 words per second, ~5 chars per word
  const totalAudioChars = sceneCount * avgSceneDurationSeconds * 15 * 5;
  const elevenLabsAudio = totalAudioChars * RATES.elevenLabsPerChar;

  // Avatar: total scene duration
  const totalAvatarSeconds = sceneCount * avgSceneDurationSeconds;
  const heygenAvatar = totalAvatarSeconds * RATES.heygenPerSecond;

  // B-roll: one clip per scene, typically 4 seconds
  const totalBrollSeconds = sceneCount * 4;
  const runwayBroll = totalBrollSeconds * RATES.runwayPerSecond;

  const total = geminiTitle + geminiScript + falThumbnails + elevenLabsAudio + heygenAvatar + runwayBroll;

  return {
    geminiTitle: round(geminiTitle),
    geminiScript: round(geminiScript),
    falThumbnails: round(falThumbnails),
    elevenLabsAudio: round(elevenLabsAudio),
    heygenAvatar: round(heygenAvatar),
    runwayBroll: round(runwayBroll),
    total: round(total),
  };
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Quick estimate from just a word count */
export function quickEstimate(wordCount: number): { min: number; max: number } {
  // Assume 6-12 scenes, 20-30 seconds each
  const low = estimateCost({ transcriptWordCount: wordCount, sceneCount: 6, avgSceneDurationSeconds: 20 });
  const high = estimateCost({ transcriptWordCount: wordCount, sceneCount: 12, avgSceneDurationSeconds: 30 });
  return { min: low.total, max: high.total };
}
