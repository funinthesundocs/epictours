import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import type { ScrapeResult, ScrapeOptions, AssetResult, MetadataResult } from './types';

/**
 * Document scraping engine.
 * Supports: PDF files, Google Docs (published HTML), Google Drive files.
 * PDF parsing via pdf-parse. Google Docs via published HTML fetch.
 * Graceful: returns partial results on failure, never throws.
 */
export async function scrape(url: string, options: ScrapeOptions): Promise<ScrapeResult> {
  const { config, onProgress, tmpDir } = options;

  const result: ScrapeResult = {
    contentType: 'document',
    assets: [],
    metadata: [],
  };

  try {
    const parsedUrl = new URL(url);
    result.sourceDomain = parsedUrl.hostname.replace('www.', '');
    await onProgress(5);

    if (isPdfUrl(url)) {
      await scrapePdf(url, result, config, onProgress, tmpDir);
    } else if (isGoogleDoc(url)) {
      await scrapeGoogleDoc(url, result, config, onProgress, tmpDir);
    } else if (isGoogleDrive(url)) {
      await scrapeGoogleDrive(url, result, config, onProgress, tmpDir);
    } else {
      // Attempt to fetch and detect content type
      await scrapeUnknownDocument(url, result, config, onProgress, tmpDir);
    }

    await onProgress(95);
  } catch (error: any) {
    result.metadata.push({ key: 'scrape_error', value: error.message, category: 'technical' });
  }

  return result;
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|#|$)/i.test(url);
}

function isGoogleDoc(url: string): boolean {
  return /docs\.google\.com\/document/i.test(url);
}

function isGoogleDrive(url: string): boolean {
  return /drive\.google\.com/i.test(url);
}

async function scrapePdf(
  url: string,
  result: ScrapeResult,
  config: ScrapeResult extends any ? any : never,
  onProgress: (p: number) => Promise<void>,
  tmpDir: string,
): Promise<void> {
  await onProgress(10);

  // Download PDF
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EpicScraper/1.0)' },
    signal: AbortSignal.timeout(60000), // PDFs can be large
  });

  if (!res.ok) {
    result.metadata.push({ key: 'http_status', value: String(res.status), category: 'technical' });
    return;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  await onProgress(30);

  // Save PDF as asset
  const docsDir = join(tmpDir, 'documents');
  mkdirSync(docsDir, { recursive: true });
  const pdfFileName = sanitizeFileName(basename(new URL(url).pathname)) || 'document.pdf';
  const pdfPath = join(docsDir, pdfFileName);
  writeFileSync(pdfPath, buffer);

  result.assets.push({
    assetType: 'document',
    originalUrl: url,
    fileName: pdfFileName,
    mimeType: 'application/pdf',
    fileSizeBytes: buffer.length,
    localPath: pdfPath,
  });

  result.metadata.push({
    key: 'file_size_bytes',
    value: String(buffer.length),
    category: 'technical',
  });

  await onProgress(40);

  // Parse PDF text with pdf-parse
  try {
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(buffer);

    result.bodyText = pdfData.text || undefined;
    result.title = pdfData.info?.Title || undefined;

    if (pdfData.text) {
      result.wordCount = pdfData.text.split(/\s+/).filter(Boolean).length;
    }

    // PDF metadata
    if (pdfData.info) {
      if (pdfData.info.Author) {
        result.metadata.push({ key: 'author', value: pdfData.info.Author, category: 'author' });
      }
      if (pdfData.info.Subject) {
        result.metadata.push({ key: 'subject', value: pdfData.info.Subject, category: 'general' });
      }
      if (pdfData.info.Creator) {
        result.metadata.push({ key: 'creator', value: pdfData.info.Creator, category: 'technical' });
      }
      if (pdfData.info.Producer) {
        result.metadata.push({ key: 'producer', value: pdfData.info.Producer, category: 'technical' });
      }
      if (pdfData.info.CreationDate) {
        result.metadata.push({ key: 'creation_date', value: pdfData.info.CreationDate, category: 'general' });
        result.publishedAt = pdfData.info.CreationDate;
      }
    }

    result.metadata.push({
      key: 'page_count',
      value: String(pdfData.numpages || 0),
      category: 'technical',
    });

    result.metadata.push({
      key: 'pdf_version',
      value: pdfData.version || 'unknown',
      category: 'technical',
    });
  } catch (parseError: any) {
    result.metadata.push({ key: 'parse_error', value: parseError.message, category: 'technical' });
  }

  await onProgress(80);
}

async function scrapeGoogleDoc(
  url: string,
  result: ScrapeResult,
  config: any,
  onProgress: (p: number) => Promise<void>,
  tmpDir: string,
): Promise<void> {
  await onProgress(10);

  // Extract document ID
  const docIdMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (!docIdMatch) {
    result.metadata.push({ key: 'error', value: 'Could not extract Google Doc ID', category: 'technical' });
    return;
  }

  const docId = docIdMatch[1];
  result.metadata.push({ key: 'doc_id', value: docId, category: 'platform' });

  // Fetch published HTML version
  const publishedUrl = `https://docs.google.com/document/d/${docId}/pub`;
  await onProgress(20);

  try {
    const res = await fetch(publishedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EpicScraper/1.0)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      // Try export as text
      const textUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      const textRes = await fetch(textUrl, {
        signal: AbortSignal.timeout(30000),
      });

      if (textRes.ok) {
        result.bodyText = await textRes.text();
        if (result.bodyText) {
          result.wordCount = result.bodyText.split(/\s+/).filter(Boolean).length;
        }
      }
      return;
    }

    const html = await res.text();
    await onProgress(50);

    // Parse HTML to extract text
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);

    result.title = $('title').text().trim() || undefined;
    result.bodyHtml = config.includeSource ? html : undefined;
    if (config.includeSource) result.rawSource = html;

    // Clean text extraction
    $('script, style, nav, header, footer').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    result.bodyText = bodyText || undefined;
    if (bodyText) {
      result.wordCount = bodyText.split(/\s+/).filter(Boolean).length;
    }

    // Extract headings
    const headings: { level: number; text: string }[] = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const tag = (el as any).tagName || (el as any).name;
      const level = parseInt(tag.replace('h', ''), 10);
      const text = $(el).text().trim();
      if (text) headings.push({ level, text });
    });
    if (headings.length > 0) result.headingsJson = headings;
  } catch (fetchError: any) {
    result.metadata.push({ key: 'fetch_error', value: fetchError.message, category: 'technical' });
  }

  await onProgress(80);
}

async function scrapeGoogleDrive(
  url: string,
  result: ScrapeResult,
  config: any,
  onProgress: (p: number) => Promise<void>,
  tmpDir: string,
): Promise<void> {
  await onProgress(10);

  // Extract file ID
  const fileIdMatch = url.match(/\/(?:file\/d|open\?id=)\/?([\w-]+)/);
  if (!fileIdMatch) {
    result.metadata.push({ key: 'error', value: 'Could not extract Google Drive file ID', category: 'technical' });
    return;
  }

  const fileId = fileIdMatch[1];
  result.metadata.push({ key: 'file_id', value: fileId, category: 'platform' });

  // Try direct download via export link
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  try {
    const res = await fetch(downloadUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EpicScraper/1.0)' },
      signal: AbortSignal.timeout(60000),
      redirect: 'follow',
    });

    if (!res.ok) {
      result.metadata.push({ key: 'download_error', value: `HTTP ${res.status}`, category: 'technical' });
      return;
    }

    const contentType = res.headers.get('content-type') || '';
    const buffer = Buffer.from(await res.arrayBuffer());

    await onProgress(40);

    const docsDir = join(tmpDir, 'documents');
    mkdirSync(docsDir, { recursive: true });

    // Determine file type and name
    const contentDisposition = res.headers.get('content-disposition') || '';
    const nameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
    const fileName = nameMatch ? sanitizeFileName(nameMatch[1]) : `drive-file-${fileId}`;
    const localPath = join(docsDir, fileName);
    writeFileSync(localPath, buffer);

    result.assets.push({
      assetType: 'document',
      originalUrl: url,
      fileName,
      mimeType: contentType,
      fileSizeBytes: buffer.length,
      localPath,
    });

    // If it's a PDF, parse it
    if (contentType.includes('pdf') || fileName.endsWith('.pdf')) {
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        result.bodyText = pdfData.text || undefined;
        result.title = pdfData.info?.Title || fileName;
        if (pdfData.text) {
          result.wordCount = pdfData.text.split(/\s+/).filter(Boolean).length;
        }
      } catch { /* PDF parse failed */ }
    }

    // If it's text/plain, read directly
    if (contentType.includes('text/')) {
      result.bodyText = buffer.toString('utf-8');
      if (result.bodyText) {
        result.wordCount = result.bodyText.split(/\s+/).filter(Boolean).length;
      }
    }
  } catch (err: any) {
    result.metadata.push({ key: 'download_error', value: err.message, category: 'technical' });
  }

  await onProgress(80);
}

async function scrapeUnknownDocument(
  url: string,
  result: ScrapeResult,
  config: any,
  onProgress: (p: number) => Promise<void>,
  tmpDir: string,
): Promise<void> {
  await onProgress(10);

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EpicScraper/1.0)' },
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    result.metadata.push({ key: 'http_status', value: String(res.status), category: 'technical' });
    return;
  }

  const contentType = res.headers.get('content-type') || '';
  const buffer = Buffer.from(await res.arrayBuffer());

  await onProgress(30);

  // If it's a PDF, delegate to PDF parser
  if (contentType.includes('pdf')) {
    const docsDir = join(tmpDir, 'documents');
    mkdirSync(docsDir, { recursive: true });
    const fileName = sanitizeFileName(basename(new URL(url).pathname)) || 'document.pdf';
    const pdfPath = join(docsDir, fileName);
    writeFileSync(pdfPath, buffer);

    result.assets.push({
      assetType: 'document',
      originalUrl: url,
      fileName,
      mimeType: contentType,
      fileSizeBytes: buffer.length,
      localPath: pdfPath,
    });

    try {
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      result.bodyText = pdfData.text || undefined;
      result.title = pdfData.info?.Title || fileName;
      if (pdfData.text) {
        result.wordCount = pdfData.text.split(/\s+/).filter(Boolean).length;
      }
      if (pdfData.numpages) {
        result.metadata.push({ key: 'page_count', value: String(pdfData.numpages), category: 'technical' });
      }
    } catch { /* PDF parse failed */ }
  }

  // If it's text, read directly
  if (contentType.includes('text/') || contentType.includes('json') || contentType.includes('xml')) {
    result.bodyText = buffer.toString('utf-8');
    if (result.bodyText) {
      result.wordCount = result.bodyText.split(/\s+/).filter(Boolean).length;
    }
    result.contentType = 'file';
  }

  await onProgress(70);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
}
