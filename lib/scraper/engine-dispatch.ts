import type { SourceType } from './detector';
import type { ScrapeEngineFn } from './engines/types';

/**
 * Dynamically imports the appropriate scraping engine based on source type.
 * Returns a module with a `scrape` function matching ScrapeEngineFn.
 */
export async function getEngine(sourceType: SourceType): Promise<{ scrape: ScrapeEngineFn }> {
  switch (sourceType) {
    case 'youtube':
      return import('./engines/youtube-engine');

    case 'twitter':
    case 'instagram':
    case 'tiktok':
    case 'facebook':
    case 'linkedin':
      return import('./engines/social-engine');

    case 'github':
      return import('./engines/github-engine');

    case 'pdf':
    case 'google_doc':
    case 'google_drive':
      return import('./engines/document-engine');

    default:
      return import('./engines/web-engine');
  }
}
