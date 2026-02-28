/**
 * Remotion entry point — registers compositions.
 * Used with: npx remotion render remotion/index.ts RemixComposition
 */

import { registerRoot } from 'remotion';
import { RemixComposition } from './composition';

// Re-export for use in worker
export { RemixComposition } from './composition';
export type { RemixScene, RemixCompositionProps } from './composition';

export const COMPOSITION_ID = 'RemixComposition';
export const COMPOSITION_FPS = 30;
export const COMPOSITION_WIDTH = 1920;
export const COMPOSITION_HEIGHT = 1080;
