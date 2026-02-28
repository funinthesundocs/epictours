export interface ScrapeResult {
  title?: string;
  description?: string;
  bodyText?: string;
  bodyHtml?: string;
  rawSource?: string;
  contentType: 'page' | 'article' | 'video' | 'image' | 'document' | 'repository' | 'social_post' | 'feed' | 'file' | 'audio' | 'table_data';
  tablesJson?: any[];
  linksJson?: { url: string; text: string; rel?: string }[];
  headingsJson?: { level: number; text: string }[];
  structuredDataJson?: any;
  sourceDomain?: string;
  publishedAt?: string;
  wordCount?: number;
  assets: AssetResult[];
  metadata: MetadataResult[];
}

export interface AssetResult {
  assetType: 'image' | 'video' | 'audio' | 'document' | 'file' | 'thumbnail' | 'avatar' | 'screenshot';
  originalUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  localPath?: string;
  width?: number;
  height?: number;
  altText?: string;
  durationSeconds?: number;
  transcript?: string;
  metadata?: Record<string, any>;
}

export interface MetadataResult {
  key: string;
  value?: string;
  valueJson?: any;
  category: 'general' | 'seo' | 'social' | 'technical' | 'author' | 'media' | 'engagement' | 'platform';
}

export interface ScrapeConfig {
  depth: number;
  maxPages: number;
  includeImages: boolean;
  includeVideos: boolean;
  includeFiles: boolean;
  includeSource: boolean;
  includeMetadata: boolean;
  renderJs: boolean;
}

export interface ScrapeOptions {
  config: ScrapeConfig;
  onProgress: (percent: number) => Promise<void>;
  tmpDir: string;
}

/** Every engine exports a `scrape` function with this signature */
export type ScrapeEngineFn = (url: string, options: ScrapeOptions) => Promise<ScrapeResult>;
