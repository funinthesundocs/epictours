import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
const { JSDOM } = require('jsdom') as any;
import { mkdirSync, writeFileSync, statSync } from 'fs';
import { join, extname } from 'path';
import type { ScrapeResult, ScrapeOptions, AssetResult, MetadataResult } from './types';

/**
 * Universal web scraping engine.
 * Uses cheerio for HTML parsing and @mozilla/readability for article extraction.
 * Graceful: returns partial results on failure, never throws.
 */
export async function scrape(url: string, options: ScrapeOptions): Promise<ScrapeResult> {
  const { config, onProgress, tmpDir } = options;

  const result: ScrapeResult = {
    contentType: 'page',
    assets: [],
    metadata: [],
  };

  try {
    await onProgress(5);

    // 1. Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EpicScraper/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      result.metadata.push({ key: 'http_status', value: String(response.status), category: 'technical' });
      return result;
    }

    const html = await response.text();
    await onProgress(15);

    // Parse URL for domain
    const parsedUrl = new URL(url);
    result.sourceDomain = parsedUrl.hostname.replace('www.', '');

    // Store raw source if requested
    if (config.includeSource) {
      result.rawSource = html;
    }

    // 2. Parse with cheerio
    const $ = cheerio.load(html);
    await onProgress(20);

    // 3. Extract basic content
    result.title = extractTitle($);
    result.description = extractDescription($);
    await onProgress(25);

    // 4. Try article extraction with Readability
    try {
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      if (article) {
        result.bodyText = article.textContent?.trim() || undefined;
        result.bodyHtml = config.includeSource ? article.content ?? undefined : undefined;
        result.contentType = 'article';
        if (article.publishedTime) {
          result.publishedAt = article.publishedTime;
        }
        result.metadata.push(
          { key: 'author', value: article.byline || undefined, category: 'author' },
          { key: 'excerpt', value: article.excerpt || undefined, category: 'general' },
          { key: 'site_name', value: article.siteName || undefined, category: 'general' },
        );
      }
    } catch {
      // Readability failed — fall back to cheerio text extraction
    }

    // If Readability didn't get body text, extract from cheerio
    if (!result.bodyText) {
      // Remove script/style/nav/footer/header tags for cleaner text
      $('script, style, nav, footer, header, aside, [role="navigation"]').remove();
      result.bodyText = $('body').text().replace(/\s+/g, ' ').trim() || undefined;
      result.bodyHtml = config.includeSource ? $('body').html() || undefined : undefined;
    }

    // Word count
    if (result.bodyText) {
      result.wordCount = result.bodyText.split(/\s+/).filter(Boolean).length;
    }
    await onProgress(35);

    // 5. Extract headings
    result.headingsJson = extractHeadings($);
    await onProgress(40);

    // 6. Extract links
    result.linksJson = extractLinks($, parsedUrl);
    await onProgress(45);

    // 7. Extract tables
    result.tablesJson = extractTables($);
    await onProgress(50);

    // 8. Extract metadata (meta tags, OG, JSON-LD)
    if (config.includeMetadata) {
      const metaEntries = extractMetadata($);
      result.metadata.push(...metaEntries);

      const structuredData = extractStructuredData($);
      if (structuredData) {
        result.structuredDataJson = structuredData;
      }
    }
    await onProgress(60);

    // 9. Extract and download images
    if (config.includeImages) {
      const imageAssets = await extractAndDownloadImages($, parsedUrl, tmpDir);
      result.assets.push(...imageAssets);
    }
    await onProgress(80);

    // 10. Extract favicon
    const faviconUrl = extractFavicon($, parsedUrl);
    if (faviconUrl) {
      result.metadata.push({ key: 'favicon_url', value: faviconUrl, category: 'general' });
    }

    // 11. Extract feed links
    const feedLinks = extractFeedLinks($, parsedUrl);
    if (feedLinks.length > 0) {
      result.metadata.push({ key: 'feed_links', valueJson: feedLinks, category: 'technical' });
    }

    await onProgress(95);
  } catch (error: any) {
    // Graceful: return whatever we got
    result.metadata.push({ key: 'scrape_error', value: error.message, category: 'technical' });
  }

  return result;
}

function extractTitle($: cheerio.Root): string | undefined {
  return (
    $('meta[property="og:title"]').attr('content') ||
    $('title').first().text().trim() ||
    $('h1').first().text().trim() ||
    undefined
  );
}

function extractDescription($: cheerio.Root): string | undefined {
  return (
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    undefined
  );
}

function extractHeadings($: cheerio.Root): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tag = (el as any).tagName || (el as any).name;
    const level = parseInt(tag.replace('h', ''), 10);
    const text = $(el).text().trim();
    if (text) {
      headings.push({ level, text });
    }
  });
  return headings;
}

function extractLinks($: cheerio.Root, baseUrl: URL): { url: string; text: string; rel?: string }[] {
  const links: { url: string; text: string; rel?: string }[] = [];
  const seen = new Set<string>();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;

    try {
      const resolved = new URL(href, baseUrl.href).href;
      if (seen.has(resolved)) return;
      seen.add(resolved);

      const text = $(el).text().trim();
      const rel = $(el).attr('rel');
      links.push({ url: resolved, text: text || resolved, rel: rel || undefined });
    } catch {
      // Invalid URL — skip
    }
  });

  return links;
}

function extractTables($: cheerio.Root): any[] {
  const tables: any[] = [];

  $('table').each((_, table) => {
    const headers: string[] = [];
    const rows: string[][] = [];

    $(table).find('thead th, thead td').each((__, th) => {
      headers.push($(th).text().trim());
    });

    // If no thead, try first row
    if (headers.length === 0) {
      $(table).find('tr').first().find('th, td').each((__, cell) => {
        headers.push($(cell).text().trim());
      });
    }

    $(table).find('tbody tr, tr').each((i, tr) => {
      // Skip header row if we already extracted it
      if (i === 0 && headers.length > 0 && !$(table).find('thead').length) return;

      const row: string[] = [];
      $(tr).find('td, th').each((__, cell) => {
        row.push($(cell).text().trim());
      });
      if (row.length > 0) {
        rows.push(row);
      }
    });

    if (headers.length > 0 || rows.length > 0) {
      tables.push({ headers, rows });
    }
  });

  return tables;
}

function extractMetadata($: cheerio.Root): MetadataResult[] {
  const meta: MetadataResult[] = [];

  // Standard meta tags
  $('meta[name], meta[property]').each((_, el) => {
    const name = $(el).attr('name') || $(el).attr('property') || '';
    const content = $(el).attr('content');
    if (!name || !content) return;

    let category: MetadataResult['category'] = 'general';
    if (name.startsWith('og:') || name.startsWith('twitter:')) category = 'social';
    else if (name === 'author' || name === 'creator') category = 'author';
    else if (name === 'robots' || name === 'generator' || name === 'viewport') category = 'technical';
    else if (name === 'description' || name === 'keywords') category = 'seo';

    meta.push({ key: name, value: content, category });
  });

  // Canonical URL
  const canonical = $('link[rel="canonical"]').attr('href');
  if (canonical) {
    meta.push({ key: 'canonical_url', value: canonical, category: 'seo' });
  }

  return meta;
}

function extractStructuredData($: cheerio.Root): any | null {
  const scripts: any[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).text().trim();
      if (text) {
        scripts.push(JSON.parse(text));
      }
    } catch {
      // Invalid JSON-LD — skip
    }
  });

  // Also collect Open Graph as structured data
  const og: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr('property')?.replace('og:', '');
    const content = $(el).attr('content');
    if (prop && content) og[prop] = content;
  });

  if (scripts.length === 0 && Object.keys(og).length === 0) return null;

  return {
    jsonLd: scripts.length > 0 ? scripts : undefined,
    openGraph: Object.keys(og).length > 0 ? og : undefined,
  };
}

function extractFavicon($: cheerio.Root, baseUrl: URL): string | undefined {
  const iconLink =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    $('link[rel="apple-touch-icon"]').attr('href');

  if (iconLink) {
    try {
      return new URL(iconLink, baseUrl.href).href;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function extractFeedLinks($: cheerio.Root, baseUrl: URL): string[] {
  const feeds: string[] = [];
  $('link[type="application/rss+xml"], link[type="application/atom+xml"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      try {
        feeds.push(new URL(href, baseUrl.href).href);
      } catch {
        // Invalid URL
      }
    }
  });
  return feeds;
}

async function extractAndDownloadImages(
  $: cheerio.Root,
  baseUrl: URL,
  tmpDir: string,
): Promise<AssetResult[]> {
  const assets: AssetResult[] = [];
  const seen = new Set<string>();
  const imgDir = join(tmpDir, 'images');
  mkdirSync(imgDir, { recursive: true });

  const imgElements: { src: string; alt: string }[] = [];
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    if (src && !src.startsWith('data:')) {
      imgElements.push({ src, alt });
    }
  });

  // Also check OG image
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    imgElements.unshift({ src: ogImage, alt: 'og-image' });
  }

  // Download up to 50 images
  const toDownload = imgElements.slice(0, 50);

  for (let i = 0; i < toDownload.length; i++) {
    const { src, alt } = toDownload[i];
    try {
      const resolvedUrl = new URL(src, baseUrl.href).href;
      if (seen.has(resolvedUrl)) continue;
      seen.add(resolvedUrl);

      const imgRes = await fetch(resolvedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EpicScraper/1.0)' },
        signal: AbortSignal.timeout(10000),
      });

      if (!imgRes.ok) continue;

      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      if (!contentType.startsWith('image/')) continue;

      const buffer = Buffer.from(await imgRes.arrayBuffer());

      // Skip tiny images (likely tracking pixels)
      if (buffer.length < 1000) continue;

      const ext = extname(new URL(resolvedUrl).pathname) || mimeToExt(contentType);
      const fileName = `img-${String(i + 1).padStart(3, '0')}${ext}`;
      const localPath = join(imgDir, fileName);
      writeFileSync(localPath, buffer);

      assets.push({
        assetType: 'image',
        originalUrl: resolvedUrl,
        fileName,
        mimeType: contentType,
        fileSizeBytes: buffer.length,
        localPath,
        altText: alt || undefined,
      });
    } catch {
      // Skip failed image downloads
    }
  }

  return assets;
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/avif': '.avif',
  };
  return map[mime] || '.jpg';
}
