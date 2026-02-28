import * as cheerio from 'cheerio';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { ScrapeResult, ScrapeOptions, AssetResult, MetadataResult } from './types';

/**
 * Social media scraping engine.
 * Strategy: oEmbed → OG tags → raw fetch fallback.
 * Supports: Twitter/X, Instagram, TikTok, Facebook, LinkedIn.
 * Graceful: returns partial results on failure, never throws.
 */
export async function scrape(url: string, options: ScrapeOptions): Promise<ScrapeResult> {
  const { config, onProgress, tmpDir } = options;

  const result: ScrapeResult = {
    contentType: 'social_post',
    assets: [],
    metadata: [],
  };

  try {
    const parsedUrl = new URL(url);
    result.sourceDomain = parsedUrl.hostname.replace('www.', '');

    await onProgress(5);

    // 1. Try oEmbed
    const oembedData = await tryOembed(url);
    if (oembedData) {
      result.title = oembedData.title || undefined;
      result.bodyHtml = oembedData.html || undefined;
      if (oembedData.author_name) {
        result.metadata.push({ key: 'author', value: oembedData.author_name, category: 'author' });
      }
      if (oembedData.author_url) {
        result.metadata.push({ key: 'author_url', value: oembedData.author_url, category: 'author' });
      }
      if (oembedData.provider_name) {
        result.metadata.push({ key: 'provider', value: oembedData.provider_name, category: 'platform' });
      }
      if (oembedData.thumbnail_url) {
        const thumbAsset = await downloadImage(oembedData.thumbnail_url, 'oembed-thumb', tmpDir);
        if (thumbAsset) result.assets.push(thumbAsset);
      }
      result.metadata.push({ key: 'oembed', valueJson: oembedData, category: 'platform' });
    }
    await onProgress(25);

    // 2. Fetch page for OG tags + text extraction
    const html = await fetchPage(url);
    if (html) {
      const $ = cheerio.load(html);

      // OG metadata
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const ogDesc = $('meta[property="og:description"]').attr('content');
      const ogImage = $('meta[property="og:image"]').attr('content');
      const ogType = $('meta[property="og:type"]').attr('content');
      const ogSiteName = $('meta[property="og:site_name"]').attr('content');

      if (!result.title && ogTitle) result.title = ogTitle;
      if (ogDesc) {
        result.description = ogDesc;
        result.bodyText = ogDesc;
        result.wordCount = ogDesc.split(/\s+/).filter(Boolean).length;
      }

      // Twitter card metadata
      const twitterTitle = $('meta[name="twitter:title"]').attr('content');
      const twitterDesc = $('meta[name="twitter:description"]').attr('content');
      const twitterImage = $('meta[name="twitter:image"]').attr('content');
      const twitterCreator = $('meta[name="twitter:creator"]').attr('content');

      if (!result.title && twitterTitle) result.title = twitterTitle;
      if (!result.bodyText && twitterDesc) {
        result.bodyText = twitterDesc;
        result.wordCount = twitterDesc.split(/\s+/).filter(Boolean).length;
      }

      // Store all social meta
      if (ogTitle) result.metadata.push({ key: 'og:title', value: ogTitle, category: 'social' });
      if (ogDesc) result.metadata.push({ key: 'og:description', value: ogDesc, category: 'social' });
      if (ogType) result.metadata.push({ key: 'og:type', value: ogType, category: 'social' });
      if (ogSiteName) result.metadata.push({ key: 'og:site_name', value: ogSiteName, category: 'social' });
      if (twitterCreator) result.metadata.push({ key: 'twitter:creator', value: twitterCreator, category: 'social' });

      // Download OG image
      const imageUrl = ogImage || twitterImage;
      if (imageUrl && config.includeImages) {
        const imgAsset = await downloadImage(imageUrl, 'og-image', tmpDir);
        if (imgAsset) result.assets.push(imgAsset);
      }

      // Store raw source
      if (config.includeSource) {
        result.rawSource = html;
      }

      // Extract additional metadata
      if (config.includeMetadata) {
        $('meta[name], meta[property]').each((_, el) => {
          const name = $(el).attr('name') || $(el).attr('property') || '';
          const content = $(el).attr('content');
          if (!name || !content) return;
          // Skip ones we already extracted
          if (name.startsWith('og:') || name.startsWith('twitter:')) return;
          result.metadata.push({ key: name, value: content, category: 'general' });
        });
      }

      // Extract links from page
      const links: { url: string; text: string; rel?: string }[] = [];
      const seen = new Set<string>();
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
        try {
          const resolved = new URL(href, url).href;
          if (seen.has(resolved)) return;
          seen.add(resolved);
          links.push({ url: resolved, text: $(el).text().trim() || resolved });
        } catch { /* skip */ }
      });
      if (links.length > 0) result.linksJson = links.slice(0, 100);

      // JSON-LD structured data
      const jsonLd: any[] = [];
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          jsonLd.push(JSON.parse($(el).text()));
        } catch { /* skip */ }
      });
      if (jsonLd.length > 0) {
        result.structuredDataJson = { jsonLd };
      }
    }
    await onProgress(70);

    // 3. Platform-specific post text extraction
    if (html) {
      const postText = extractPostText(html, result.sourceDomain || '');
      if (postText && (!result.bodyText || postText.length > result.bodyText.length)) {
        result.bodyText = postText;
        result.wordCount = postText.split(/\s+/).filter(Boolean).length;
      }
    }

    await onProgress(95);
  } catch (error: any) {
    result.metadata.push({ key: 'scrape_error', value: error.message, category: 'technical' });
  }

  return result;
}

/** oEmbed endpoints by platform */
const OEMBED_ENDPOINTS: Record<string, string> = {
  'twitter.com': 'https://publish.twitter.com/oembed',
  'x.com': 'https://publish.twitter.com/oembed',
  'instagram.com': 'https://api.instagram.com/oembed',
  'tiktok.com': 'https://www.tiktok.com/oembed',
  'facebook.com': 'https://www.facebook.com/plugins/post/oembed.json',
};

async function tryOembed(url: string): Promise<any | null> {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const endpoint = OEMBED_ENDPOINTS[hostname];
    if (!endpoint) return null;

    const oembedUrl = `${endpoint}?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EpicScraper/1.0)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractPostText(html: string, domain: string): string | null {
  try {
    const $ = cheerio.load(html);

    // Twitter/X — look for tweet text in common selectors
    if (domain.includes('twitter') || domain.includes('x.com')) {
      const tweetText = $('[data-testid="tweetText"]').text().trim()
        || $('article p').text().trim();
      if (tweetText) return tweetText;
    }

    // Instagram — caption
    if (domain.includes('instagram')) {
      const caption = $('meta[property="og:description"]').attr('content');
      if (caption) return caption;
    }

    // TikTok — description
    if (domain.includes('tiktok')) {
      const desc = $('meta[name="description"]').attr('content')
        || $('[data-e2e="browse-video-desc"]').text().trim();
      if (desc) return desc;
    }

    // Facebook — post text
    if (domain.includes('facebook')) {
      const postText = $('meta[property="og:description"]').attr('content');
      if (postText) return postText;
    }

    // LinkedIn — post text
    if (domain.includes('linkedin')) {
      const postText = $('meta[property="og:description"]').attr('content');
      if (postText) return postText;
    }

    return null;
  } catch {
    return null;
  }
}

async function downloadImage(imageUrl: string, prefix: string, tmpDir: string): Promise<AssetResult | null> {
  try {
    const imgDir = join(tmpDir, 'images');
    mkdirSync(imgDir, { recursive: true });

    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EpicScraper/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 500) return null;

    const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
    const fileName = `${prefix}${ext}`;
    const localPath = join(imgDir, fileName);
    writeFileSync(localPath, buffer);

    return {
      assetType: 'image',
      originalUrl: imageUrl,
      fileName,
      mimeType: contentType,
      fileSizeBytes: buffer.length,
      localPath,
    };
  } catch {
    return null;
  }
}
