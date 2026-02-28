import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { parseVTT } from '../vtt-parser';
import type { ScrapeResult, ScrapeOptions, AssetResult, MetadataResult } from './types';

const execFileAsync = promisify(execFile);

const MAX_DURATION_SECONDS = 20 * 60; // 20 minutes
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

/**
 * YouTube scraping engine.
 * - Video download via yt-dlp (≤1080p, max 20min, reject longer, compress >200MB)
 * - Transcript via yt-dlp --write-auto-sub (NOT YouTube Captions API)
 * - Metadata via YouTube Data API v3 (API key only, no OAuth)
 */
export async function scrape(url: string, options: ScrapeOptions): Promise<ScrapeResult> {
  const { config, onProgress, tmpDir } = options;

  const result: ScrapeResult = {
    contentType: 'video',
    sourceDomain: 'youtube.com',
    assets: [],
    metadata: [],
  };

  const videoId = extractVideoId(url);
  if (!videoId) {
    result.metadata.push({ key: 'error', value: 'Could not extract YouTube video ID', category: 'technical' });
    return result;
  }

  try {
    await onProgress(5);

    // 1. Get video info via yt-dlp (no download yet) to check duration
    const info = await getVideoInfo(url);
    await onProgress(10);

    if (!info) {
      result.metadata.push({ key: 'error', value: 'Failed to get video info via yt-dlp', category: 'technical' });
      return result;
    }

    result.title = info.title;
    result.description = info.description;

    // Check duration limit
    const duration = info.duration || 0;
    if (duration > MAX_DURATION_SECONDS) {
      result.metadata.push({
        key: 'rejected_reason',
        value: `Video is ${Math.round(duration / 60)} minutes (max ${MAX_DURATION_SECONDS / 60} min)`,
        category: 'technical',
      });
      // Still collect metadata even if we skip the video download
    } else if (config.includeVideos) {
      // 2. Download video
      try {
        const videoAsset = await downloadVideo(url, tmpDir, duration);
        if (videoAsset) {
          result.assets.push(videoAsset);
        }
      } catch (err: any) {
        result.metadata.push({ key: 'video_download_error', value: err.message, category: 'technical' });
      }
    }
    await onProgress(40);

    // 3. Download transcript via yt-dlp --write-auto-sub
    try {
      const transcript = await downloadTranscript(url, tmpDir);
      if (transcript) {
        result.bodyText = transcript;
        result.wordCount = transcript.split(/\s+/).filter(Boolean).length;
      }
    } catch (err: any) {
      result.metadata.push({ key: 'transcript_error', value: err.message, category: 'technical' });
    }
    await onProgress(55);

    // 4. Download thumbnails
    if (config.includeImages) {
      try {
        const thumbAssets = await downloadThumbnails(videoId, tmpDir);
        result.assets.push(...thumbAssets);
      } catch {
        // Non-fatal — thumbnails are nice to have
      }
    }
    await onProgress(65);

    // 5. YouTube Data API metadata (if API key available)
    if (config.includeMetadata) {
      try {
        const apiMeta = await fetchYouTubeApiMetadata(videoId);
        if (apiMeta) {
          result.metadata.push(...apiMeta.metadata);
          // Overwrite title/description with API data (more reliable)
          if (apiMeta.title) result.title = apiMeta.title;
          if (apiMeta.description) result.description = apiMeta.description;
          if (apiMeta.publishedAt) result.publishedAt = apiMeta.publishedAt;
          if (apiMeta.structuredData) result.structuredDataJson = apiMeta.structuredData;
        }
      } catch (err: any) {
        result.metadata.push({ key: 'api_error', value: err.message, category: 'technical' });
      }
    }
    await onProgress(80);

    // 6. Fetch top comments via YouTube Data API
    if (config.includeMetadata) {
      try {
        const comments = await fetchTopComments(videoId);
        if (comments.length > 0) {
          result.metadata.push({ key: 'top_comments', valueJson: comments, category: 'engagement' });
        }
      } catch {
        // Non-fatal
      }
    }
    await onProgress(95);

    // Add yt-dlp info as metadata
    result.metadata.push(
      { key: 'video_id', value: videoId, category: 'platform' },
      { key: 'duration_seconds', value: String(duration), category: 'media' },
      { key: 'uploader', value: info.uploader || undefined, category: 'author' },
      { key: 'uploader_id', value: info.uploaderId || undefined, category: 'author' },
      { key: 'upload_date', value: info.uploadDate || undefined, category: 'general' },
      { key: 'view_count', value: info.viewCount ? String(info.viewCount) : undefined, category: 'engagement' },
      { key: 'like_count', value: info.likeCount ? String(info.likeCount) : undefined, category: 'engagement' },
    );
  } catch (error: any) {
    result.metadata.push({ key: 'scrape_error', value: error.message, category: 'technical' });
  }

  return result;
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0];
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      // Handle /shorts/ and /live/ URLs
      const pathMatch = u.pathname.match(/\/(shorts|live|embed)\/([^/?]+)/);
      if (pathMatch) return pathMatch[2];
    }
    return null;
  } catch {
    return null;
  }
}

interface YtDlpInfo {
  title?: string;
  description?: string;
  duration?: number;
  uploader?: string;
  uploaderId?: string;
  uploadDate?: string;
  viewCount?: number;
  likeCount?: number;
}

async function getVideoInfo(url: string): Promise<YtDlpInfo | null> {
  try {
    const { stdout } = await execFileAsync('yt-dlp', [
      '--dump-json',
      '--no-download',
      '--no-playlist',
      url,
    ], { maxBuffer: 10 * 1024 * 1024, timeout: 30000 });

    const json = JSON.parse(stdout);
    return {
      title: json.title,
      description: json.description,
      duration: json.duration,
      uploader: json.uploader || json.channel,
      uploaderId: json.uploader_id || json.channel_id,
      uploadDate: json.upload_date,
      viewCount: json.view_count,
      likeCount: json.like_count,
    };
  } catch {
    return null;
  }
}

async function downloadVideo(
  url: string,
  tmpDir: string,
  duration: number,
): Promise<AssetResult | null> {
  const outputTemplate = join(tmpDir, 'video.%(ext)s');

  // Choose format: best ≤1080p
  const formatArg = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best';

  await execFileAsync('yt-dlp', [
    '-f', formatArg,
    '--merge-output-format', 'mp4',
    '--no-playlist',
    '-o', outputTemplate,
    url,
  ], { maxBuffer: 1024 * 1024, timeout: 10 * 60 * 1000 }); // 10min timeout

  // Find the downloaded video file
  const files = readdirSync(tmpDir).filter((f) => f.startsWith('video.'));
  if (files.length === 0) return null;

  const videoFile = files[0];
  const localPath = join(tmpDir, videoFile);
  const stat = statSync(localPath);

  // If file is >200MB, re-download at 720p
  if (stat.size > MAX_FILE_SIZE) {
    try {
      await execFileAsync('yt-dlp', [
        '-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]/best',
        '--merge-output-format', 'mp4',
        '--no-playlist',
        '-o', join(tmpDir, 'video_compressed.%(ext)s'),
        url,
      ], { maxBuffer: 1024 * 1024, timeout: 10 * 60 * 1000 });

      const compressedFiles = readdirSync(tmpDir).filter((f) => f.startsWith('video_compressed.'));
      if (compressedFiles.length > 0) {
        const compressedPath = join(tmpDir, compressedFiles[0]);
        const compressedStat = statSync(compressedPath);
        return {
          assetType: 'video',
          fileName: compressedFiles[0],
          mimeType: 'video/mp4',
          fileSizeBytes: compressedStat.size,
          localPath: compressedPath,
          durationSeconds: duration,
        };
      }
    } catch {
      // Fall through to original file
    }
  }

  return {
    assetType: 'video',
    fileName: videoFile,
    mimeType: 'video/mp4',
    fileSizeBytes: stat.size,
    localPath,
    durationSeconds: duration,
  };
}

async function downloadTranscript(url: string, tmpDir: string): Promise<string | null> {
  const outputTemplate = join(tmpDir, 'subs');

  try {
    await execFileAsync('yt-dlp', [
      '--write-auto-sub',
      '--sub-lang', 'en',
      '--skip-download',
      '--no-playlist',
      '-o', outputTemplate,
      url,
    ], { maxBuffer: 1024 * 1024, timeout: 60000 });
  } catch {
    // yt-dlp may exit non-zero if no subs available
  }

  // Find the VTT file
  const subFiles = readdirSync(tmpDir).filter(
    (f) => f.endsWith('.vtt') && (f.includes('subs') || f.includes('sub'))
  );

  if (subFiles.length === 0) return null;

  const vttContent = readFileSync(join(tmpDir, subFiles[0]), 'utf-8');
  return parseVTT(vttContent);
}

async function downloadThumbnails(videoId: string, tmpDir: string): Promise<AssetResult[]> {
  const assets: AssetResult[] = [];
  const resolutions = [
    { name: 'maxresdefault', width: 1280, height: 720 },
    { name: 'hqdefault', width: 480, height: 360 },
    { name: 'mqdefault', width: 320, height: 180 },
  ];

  for (const res of resolutions) {
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/${res.name}.jpg`;
    try {
      const response = await fetch(thumbUrl, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) continue;

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 1000) continue; // Skip placeholder images

      const fileName = `thumb-${res.name}.jpg`;
      const localPath = join(tmpDir, fileName);
      const { writeFileSync } = await import('fs');
      writeFileSync(localPath, buffer);

      assets.push({
        assetType: 'thumbnail',
        originalUrl: thumbUrl,
        fileName,
        mimeType: 'image/jpeg',
        fileSizeBytes: buffer.length,
        localPath,
        width: res.width,
        height: res.height,
      });
    } catch {
      // Non-fatal
    }
  }

  return assets;
}

interface ApiMetadataResult {
  title?: string;
  description?: string;
  publishedAt?: string;
  structuredData?: any;
  metadata: MetadataResult[];
}

async function fetchYouTubeApiMetadata(videoId: string): Promise<ApiMetadataResult | null> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;

    const data = await response.json();
    const video = data.items?.[0];
    if (!video) return null;

    const snippet = video.snippet || {};
    const stats = video.statistics || {};
    const details = video.contentDetails || {};

    const metadata: MetadataResult[] = [
      { key: 'channel_title', value: snippet.channelTitle, category: 'author' },
      { key: 'channel_id', value: snippet.channelId, category: 'author' },
      { key: 'category_id', value: snippet.categoryId, category: 'platform' },
      { key: 'default_language', value: snippet.defaultLanguage || snippet.defaultAudioLanguage, category: 'general' },
      { key: 'view_count', value: stats.viewCount, category: 'engagement' },
      { key: 'like_count', value: stats.likeCount, category: 'engagement' },
      { key: 'comment_count', value: stats.commentCount, category: 'engagement' },
      { key: 'favorite_count', value: stats.favoriteCount, category: 'engagement' },
      { key: 'duration_iso', value: details.duration, category: 'media' },
      { key: 'definition', value: details.definition, category: 'media' },
      { key: 'caption', value: details.caption, category: 'media' },
      { key: 'licensed_content', value: String(details.licensedContent), category: 'platform' },
    ];

    if (snippet.tags && snippet.tags.length > 0) {
      metadata.push({ key: 'tags', valueJson: snippet.tags, category: 'general' });
    }

    return {
      title: snippet.title,
      description: snippet.description,
      publishedAt: snippet.publishedAt,
      structuredData: {
        snippet,
        statistics: stats,
        contentDetails: details,
      },
      metadata: metadata.filter((m) => m.value || m.valueJson),
    };
  } catch {
    return null;
  }
}

async function fetchTopComments(videoId: string, maxResults = 20): Promise<any[]> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&order=relevance&key=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return [];

    const data = await response.json();
    return (data.items || []).map((item: any) => {
      const comment = item.snippet?.topLevelComment?.snippet;
      return {
        author: comment?.authorDisplayName,
        text: comment?.textDisplay,
        likeCount: comment?.likeCount,
        publishedAt: comment?.publishedAt,
      };
    });
  } catch {
    return [];
  }
}
