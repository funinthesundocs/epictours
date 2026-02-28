export type SourceType =
  | 'youtube' | 'twitter' | 'instagram' | 'tiktok' | 'facebook'
  | 'linkedin' | 'github' | 'google_doc' | 'google_drive'
  | 'pdf' | 'markdown' | 'rss' | 'article' | 'website' | 'unknown';

const PATTERNS: [RegExp, SourceType][] = [
  [/(?:youtube\.com\/(?:watch|shorts|live)|youtu\.be\/)/i, 'youtube'],
  [/(?:twitter\.com|x\.com)\//i, 'twitter'],
  [/instagram\.com\//i, 'instagram'],
  [/tiktok\.com\//i, 'tiktok'],
  [/facebook\.com\//i, 'facebook'],
  [/linkedin\.com\//i, 'linkedin'],
  [/github\.com\/[\w-]+\/[\w.-]+/i, 'github'],
  [/docs\.google\.com\/document/i, 'google_doc'],
  [/drive\.google\.com\//i, 'google_drive'],
  [/\.pdf(\?|$)/i, 'pdf'],
  [/\.md(\?|$)/i, 'markdown'],
  [/\/feed\/?$|\/rss\/?$|\.rss(\?|$)|\.atom(\?|$)/i, 'rss'],
];

export function detectSourceType(url: string): SourceType {
  for (const [pattern, type] of PATTERNS) {
    if (pattern.test(url)) return type;
  }
  return 'website';
}
