import { mkdirSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { detectSourceType } from './detector';
import { getEngine } from './engine-dispatch';
import type { ScrapeResult, AssetResult, ScrapeConfig } from './engines/types';

const BUCKET = 'epic-assets';

export interface ScrapeJobData {
  jobId: string;
  url: string;
  orgId: string;
  userId: string;
  collectionId?: string;
  config?: Partial<ScrapeConfig>;
}

const DEFAULT_CONFIG: ScrapeConfig = {
  depth: 0,
  maxPages: 1,
  includeImages: true,
  includeVideos: true,
  includeFiles: true,
  includeSource: true,
  includeMetadata: true,
  renderJs: false,
};

async function updateJobStatus(
  jobId: string,
  status: string,
  progress: number,
  errorMessage?: string,
  extras?: Record<string, unknown>,
) {
  const update: Record<string, unknown> = { status, progress };
  if (errorMessage) update.error_message = errorMessage;
  if (status === 'scraping' && progress === 0) update.started_at = new Date().toISOString();
  if (status === 'complete') update.completed_at = new Date().toISOString();
  if (extras) Object.assign(update, extras);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin as any).from('scraper_jobs').update(update).eq('id', jobId);
}

async function uploadAssetToStorage(
  orgId: string,
  jobId: string,
  asset: AssetResult,
): Promise<{ storagePath: string; fileSize: number } | null> {
  if (!asset.localPath) return null;
  try {
    const fileBuffer = readFileSync(asset.localPath);
    const fileSize = fileBuffer.length;
    const subdir = asset.assetType === 'image' ? 'images' : asset.assetType + 's';
    const storagePath = `scraper/${orgId}/${jobId}/${subdir}/${asset.fileName || 'file'}`;
    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(storagePath, fileBuffer, {
      contentType: asset.mimeType || 'application/octet-stream',
      upsert: true,
    });
    if (error) return null;
    return { storagePath, fileSize };
  } catch {
    return null;
  }
}

async function storeResults(
  jobId: string,
  orgId: string,
  userId: string,
  sourceType: string,
  url: string,
  collectionId: string | undefined,
  result: ScrapeResult,
) {
  void userId; // stored in job record, not item
  const parsedUrl = new URL(url);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabaseAdmin as any;

  const { data: item, error: itemError } = await sb
    .from('scraper_items')
    .insert({
      job_id: jobId,
      org_id: orgId,
      collection_id: collectionId || null,
      source_url: url,
      source_type: sourceType,
      source_domain: result.sourceDomain || parsedUrl.hostname.replace('www.', ''),
      title: result.title || null,
      description: result.description || null,
      body_text: result.bodyText || null,
      body_html: result.bodyHtml || null,
      raw_source: result.rawSource || null,
      content_type: result.contentType,
      tables_json: result.tablesJson && result.tablesJson.length > 0 ? result.tablesJson : null,
      links_json: result.linksJson && result.linksJson.length > 0 ? result.linksJson : null,
      headings_json: result.headingsJson && result.headingsJson.length > 0 ? result.headingsJson : null,
      structured_data_json: result.structuredDataJson || null,
      word_count: result.wordCount || null,
      published_at: result.publishedAt || null,
      asset_count: result.assets.length,
    })
    .select('id')
    .single();

  if (itemError || !item) {
    throw new Error(`Failed to create scraper_item: ${itemError?.message}`);
  }

  const itemId = (item as { id: string }).id;
  let totalSize = 0;

  for (const asset of result.assets) {
    const uploadResult = await uploadAssetToStorage(orgId, jobId, asset);
    await sb.from('scraper_assets').insert({
      item_id: itemId,
      job_id: jobId,
      org_id: orgId,
      asset_type: asset.assetType,
      original_url: asset.originalUrl || null,
      file_name: asset.fileName || null,
      mime_type: asset.mimeType || null,
      file_size_bytes: uploadResult?.fileSize || asset.fileSizeBytes || null,
      storage_path: uploadResult?.storagePath || null,
      width: asset.width || null,
      height: asset.height || null,
      alt_text: asset.altText || null,
      duration_seconds: asset.durationSeconds || null,
      transcript: asset.transcript || null,
      metadata: asset.metadata || null,
    });
    totalSize += uploadResult?.fileSize || asset.fileSizeBytes || 0;
  }

  if (result.metadata.length > 0) {
    const metaRows = result.metadata
      .filter((m) => m.key && (m.value || m.valueJson))
      .map((m) => ({
        item_id: itemId,
        key: m.key,
        value: m.value || null,
        value_json: m.valueJson || null,
        category: m.category,
      }));
    if (metaRows.length > 0) {
      await sb.from('scraper_metadata').insert(metaRows);
    }
  }

  await updateJobStatus(jobId, 'complete', 100, undefined, {
    items_found: 1,
    assets_found: result.assets.length,
    total_size_bytes: totalSize,
  });
}

export async function processScrapeDirect(data: ScrapeJobData): Promise<void> {
  const { jobId, url, orgId, userId, collectionId, config: userConfig } = data;
  const tmpDir = join(tmpdir(), 'scraper', jobId);

  mkdirSync(tmpDir, { recursive: true });

  try {
    await updateJobStatus(jobId, 'scraping', 0);

    const sourceType = detectSourceType(url);
    await updateJobStatus(jobId, 'scraping', 5);

    const config: ScrapeConfig = { ...DEFAULT_CONFIG, ...userConfig };
    const engine = await getEngine(sourceType);
    const result = await engine.scrape(url, {
      config,
      onProgress: async (pct: number) => {
        const jobProgress = Math.round(10 + pct * 0.75);
        await updateJobStatus(jobId, 'scraping', jobProgress);
      },
      tmpDir,
    });

    await updateJobStatus(jobId, 'processing', 90);
    await storeResults(jobId, orgId, userId, sourceType, url, collectionId, result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    await updateJobStatus(jobId, 'error', 0, msg);
    throw error;
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}
