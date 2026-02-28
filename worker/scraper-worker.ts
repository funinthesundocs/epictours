import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, rmSync, readFileSync, statSync } from 'fs';
import { redisConnection } from '../lib/queue/connection';
import { detectSourceType } from '../lib/scraper/detector';
import { getEngine } from '../lib/scraper/engine-dispatch';
import { createLogger } from '../lib/logger';
import type { ScrapeResult, AssetResult, ScrapeConfig } from '../lib/scraper/engines/types';

const log = createLogger('scraper-worker');

// Supabase admin client for worker (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = 'epic-assets';

interface ScrapeJobData {
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
  extras?: Record<string, any>,
) {
  const update: Record<string, any> = { status, progress };
  if (errorMessage) update.error_message = errorMessage;
  if (status === 'scraping' && progress === 0) update.started_at = new Date().toISOString();
  if (status === 'complete') update.completed_at = new Date().toISOString();
  if (extras) Object.assign(update, extras);

  const { error } = await supabase
    .from('scraper_jobs')
    .update(update)
    .eq('id', jobId);

  if (error) {
    log.error({ jobId, error: error.message }, 'Failed to update job status');
  }
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

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: asset.mimeType || 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      log.warn({ storagePath, error: error.message }, 'Asset upload failed');
      return null;
    }

    return { storagePath, fileSize };
  } catch (error: any) {
    log.warn({ asset: asset.fileName, error: error.message }, 'Asset read/upload failed');
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
  // 1. Create the scraper_item
  const parsedUrl = new URL(url);
  const { data: item, error: itemError } = await supabase
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

  const itemId = item.id;
  let totalSize = 0;

  // 2. Upload assets to storage and create scraper_asset rows
  for (const asset of result.assets) {
    const uploadResult = await uploadAssetToStorage(orgId, jobId, asset);

    const { error: assetError } = await supabase.from('scraper_assets').insert({
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

    if (assetError) {
      log.warn({ itemId, error: assetError.message }, 'Failed to insert asset row');
    }

    totalSize += uploadResult?.fileSize || asset.fileSizeBytes || 0;
  }

  // 3. Store metadata key-value pairs
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
      const { error: metaError } = await supabase.from('scraper_metadata').insert(metaRows);
      if (metaError) {
        log.warn({ itemId, error: metaError.message }, 'Failed to insert metadata rows');
      }
    }
  }

  // 4. Update job summary
  await updateJobStatus(jobId, 'complete', 100, undefined, {
    items_found: 1,
    assets_found: result.assets.length,
    total_size_bytes: totalSize,
  });

  return itemId;
}

async function processScrapeJob(job: Job<ScrapeJobData>) {
  const { jobId, url, orgId, userId, collectionId, config: userConfig } = job.data;
  const tmpDir = `/tmp/scraper/${jobId}`;

  log.info({ jobId, url }, 'Starting scrape job');
  mkdirSync(tmpDir, { recursive: true });

  try {
    // 1. Update status to scraping
    await updateJobStatus(jobId, 'scraping', 0);

    // 2. Detect source type
    const sourceType = detectSourceType(url);
    await updateJobStatus(jobId, 'scraping', 5);

    // 3. Build config
    const config: ScrapeConfig = { ...DEFAULT_CONFIG, ...userConfig };

    // 4. Get engine and run scrape
    const engine = await getEngine(sourceType);
    const result = await engine.scrape(url, {
      config,
      onProgress: async (pct: number) => {
        // Map engine progress (0-100) to job progress (10-85)
        const jobProgress = Math.round(10 + pct * 0.75);
        await updateJobStatus(jobId, 'scraping', jobProgress);
      },
      tmpDir,
    });

    // 5. Store results
    await updateJobStatus(jobId, 'processing', 90);
    await storeResults(jobId, orgId, userId, sourceType, url, collectionId, result);

    log.info({ jobId, url, sourceType, assets: result.assets.length }, 'Scrape job completed');
  } catch (error: any) {
    log.error({ jobId, url, error: error.message }, 'Scrape job failed');
    await updateJobStatus(jobId, 'error', 0, error.message);
    throw error;
  } finally {
    // ALWAYS clean up /tmp
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

export function startScraperWorker() {
  const worker = new Worker<ScrapeJobData>('epic-scraper', processScrapeJob, {
    connection: redisConnection,
    concurrency: 5,
    limiter: { max: 10, duration: 60000 },
  });

  worker.on('completed', (job) => {
    log.info({ jobId: job.data.jobId }, 'Scrape worker: job completed');
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.data?.jobId, error: err.message }, 'Scrape worker: job failed');
  });

  log.info('Scraper worker started');
  return worker;
}
