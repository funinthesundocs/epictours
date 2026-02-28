import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { ScrapeResult, ScrapeOptions, AssetResult, MetadataResult } from './types';

/**
 * GitHub scraping engine.
 * Uses GitHub REST API (no auth token needed for public repos, rate-limited to 60/hr).
 * Extracts: repo info, README, file tree, languages, topics, stars/forks, recent commits.
 * Graceful: returns partial results on failure, never throws.
 */
export async function scrape(url: string, options: ScrapeOptions): Promise<ScrapeResult> {
  const { config, onProgress, tmpDir } = options;

  const result: ScrapeResult = {
    contentType: 'repository',
    sourceDomain: 'github.com',
    assets: [],
    metadata: [],
  };

  try {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      result.metadata.push({ key: 'error', value: 'Could not parse GitHub URL', category: 'technical' });
      return result;
    }

    const { owner, repo, path: filePath } = parsed;
    await onProgress(5);

    // 1. Fetch repository info
    const repoData = await githubApi(`/repos/${owner}/${repo}`);
    if (repoData) {
      result.title = repoData.full_name;
      result.description = repoData.description || undefined;

      result.metadata.push(
        { key: 'owner', value: owner, category: 'author' },
        { key: 'repo_name', value: repo, category: 'general' },
        { key: 'stars', value: String(repoData.stargazers_count || 0), category: 'engagement' },
        { key: 'forks', value: String(repoData.forks_count || 0), category: 'engagement' },
        { key: 'watchers', value: String(repoData.subscribers_count || 0), category: 'engagement' },
        { key: 'open_issues', value: String(repoData.open_issues_count || 0), category: 'engagement' },
        { key: 'default_branch', value: repoData.default_branch || 'main', category: 'technical' },
        { key: 'license', value: repoData.license?.spdx_id || repoData.license?.name || 'None', category: 'general' },
        { key: 'language', value: repoData.language || 'Unknown', category: 'technical' },
        { key: 'created_at', value: repoData.created_at, category: 'general' },
        { key: 'updated_at', value: repoData.updated_at, category: 'general' },
        { key: 'pushed_at', value: repoData.pushed_at, category: 'general' },
        { key: 'size_kb', value: String(repoData.size || 0), category: 'technical' },
        { key: 'is_fork', value: String(repoData.fork || false), category: 'technical' },
        { key: 'is_archived', value: String(repoData.archived || false), category: 'technical' },
      );

      if (repoData.homepage) {
        result.metadata.push({ key: 'homepage', value: repoData.homepage, category: 'general' });
      }

      result.publishedAt = repoData.created_at;

      // Topics
      if (repoData.topics && repoData.topics.length > 0) {
        result.metadata.push({ key: 'topics', valueJson: repoData.topics, category: 'platform' });
      }
    }
    await onProgress(20);

    // 2. Fetch languages breakdown
    const languages = await githubApi(`/repos/${owner}/${repo}/languages`);
    if (languages && Object.keys(languages).length > 0) {
      result.metadata.push({ key: 'languages', valueJson: languages, category: 'technical' });
    }
    await onProgress(30);

    // 3. Fetch README
    const readme = await fetchReadme(owner, repo);
    if (readme) {
      result.bodyText = readme;
      result.wordCount = readme.split(/\s+/).filter(Boolean).length;
    }
    await onProgress(50);

    // 4. Fetch file tree (top-level only for performance)
    if (filePath) {
      // If URL points to a specific path, fetch that content
      const fileContent = await fetchFileContent(owner, repo, filePath);
      if (fileContent) {
        result.bodyText = fileContent;
        result.wordCount = fileContent.split(/\s+/).filter(Boolean).length;
        result.contentType = 'file';
        result.title = `${owner}/${repo}/${filePath}`;
      }
    } else {
      const tree = await githubApi(`/repos/${owner}/${repo}/contents`);
      if (Array.isArray(tree)) {
        const fileList = tree.map((f: any) => ({
          name: f.name,
          type: f.type,
          size: f.size,
          path: f.path,
        }));
        result.metadata.push({ key: 'file_tree', valueJson: fileList, category: 'technical' });

        // Also create links from file tree
        result.linksJson = tree.map((f: any) => ({
          url: f.html_url || `https://github.com/${owner}/${repo}/blob/${repoData?.default_branch || 'main'}/${f.path}`,
          text: `${f.type === 'dir' ? '📁' : '📄'} ${f.name}`,
        }));
      }
    }
    await onProgress(65);

    // 5. Fetch recent commits (last 10)
    const commits = await githubApi(`/repos/${owner}/${repo}/commits?per_page=10`);
    if (Array.isArray(commits) && commits.length > 0) {
      const commitSummaries = commits.map((c: any) => ({
        sha: c.sha?.slice(0, 7),
        message: c.commit?.message?.split('\n')[0],
        author: c.commit?.author?.name,
        date: c.commit?.author?.date,
      }));
      result.metadata.push({ key: 'recent_commits', valueJson: commitSummaries, category: 'platform' });
    }
    await onProgress(80);

    // 6. Download owner avatar as asset
    if (config.includeImages && repoData?.owner?.avatar_url) {
      const avatarAsset = await downloadAvatar(repoData.owner.avatar_url, tmpDir);
      if (avatarAsset) result.assets.push(avatarAsset);
    }

    // 7. Fetch contributors count
    const contributors = await githubApi(`/repos/${owner}/${repo}/contributors?per_page=1&anon=1`);
    if (Array.isArray(contributors)) {
      // GitHub returns Link header with total, but we just note what we got
      result.metadata.push({ key: 'contributor_sample', valueJson: contributors.map((c: any) => ({
        login: c.login,
        contributions: c.contributions,
      })), category: 'engagement' });
    }

    if (config.includeSource) {
      // Store the API responses as raw source
      result.rawSource = JSON.stringify({ repoData, languages, readme: readme?.slice(0, 5000) }, null, 2);
    }

    await onProgress(95);
  } catch (error: any) {
    result.metadata.push({ key: 'scrape_error', value: error.message, category: 'technical' });
  }

  return result;
}

interface ParsedGitHub {
  owner: string;
  repo: string;
  path?: string;
}

function parseGitHubUrl(url: string): ParsedGitHub | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);

    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1].replace('.git', '');

    // Check for file path: /owner/repo/blob/branch/path/to/file
    if (parts.length > 3 && (parts[2] === 'blob' || parts[2] === 'tree')) {
      const filePath = parts.slice(4).join('/');
      return { owner, repo, path: filePath || undefined };
    }

    return { owner, repo };
  } catch {
    return null;
  }
}

async function githubApi(endpoint: string): Promise<any | null> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'EpicScraper/1.0',
    };

    // Use token if available for higher rate limits
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`https://api.github.com${endpoint}`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchReadme(owner: string, repo: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'EpicScraper/1.0',
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'EpicScraper/1.0',
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const text = await res.text();
    // Limit to 100KB of text
    return text.slice(0, 100_000);
  } catch {
    return null;
  }
}

async function downloadAvatar(avatarUrl: string, tmpDir: string): Promise<AssetResult | null> {
  try {
    const imgDir = join(tmpDir, 'images');
    mkdirSync(imgDir, { recursive: true });

    const res = await fetch(avatarUrl, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const fileName = 'owner-avatar.jpg';
    const localPath = join(imgDir, fileName);
    writeFileSync(localPath, buffer);

    return {
      assetType: 'avatar',
      originalUrl: avatarUrl,
      fileName,
      mimeType: 'image/jpeg',
      fileSizeBytes: buffer.length,
      localPath,
    };
  } catch {
    return null;
  }
}
