"use client";

import { Eye, ThumbsUp, MessageSquare, Calendar, User, Clock, Tag } from "lucide-react";

interface YouTubeMetadataProps {
  metadata: Array<{ key: string; value?: string; value_json?: any; category: string }>;
}

function formatNumber(n: string | undefined): string {
  if (!n) return "—";
  const num = parseInt(n, 10);
  if (isNaN(num)) return n;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatDuration(iso: string | undefined): string {
  if (!iso) return "—";
  // Parse ISO 8601 duration (PT1H23M45S)
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getMetaValue(metadata: YouTubeMetadataProps["metadata"], key: string): string | undefined {
  return metadata.find((m) => m.key === key)?.value;
}

function getMetaJson(metadata: YouTubeMetadataProps["metadata"], key: string): any {
  return metadata.find((m) => m.key === key)?.value_json;
}

export function YouTubeMetadata({ metadata }: YouTubeMetadataProps) {
  const viewCount = getMetaValue(metadata, "view_count");
  const likeCount = getMetaValue(metadata, "like_count");
  const commentCount = getMetaValue(metadata, "comment_count");
  const channelTitle = getMetaValue(metadata, "channel_title") || getMetaValue(metadata, "uploader");
  const publishedAt = getMetaValue(metadata, "upload_date");
  const durationIso = getMetaValue(metadata, "duration_iso");
  const durationSec = getMetaValue(metadata, "duration_seconds");
  const tags = getMetaJson(metadata, "tags");
  const topComments = getMetaJson(metadata, "top_comments");

  const durationDisplay = durationIso
    ? formatDuration(durationIso)
    : durationSec
      ? `${Math.floor(parseInt(durationSec) / 60)}:${String(parseInt(durationSec) % 60).padStart(2, "0")}`
      : null;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex flex-wrap gap-4">
        {viewCount && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{formatNumber(viewCount)} views</span>
          </div>
        )}
        {likeCount && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ThumbsUp className="h-4 w-4" />
            <span>{formatNumber(likeCount)}</span>
          </div>
        )}
        {commentCount && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{formatNumber(commentCount)} comments</span>
          </div>
        )}
        {durationDisplay && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{durationDisplay}</span>
          </div>
        )}
      </div>

      {/* Channel + date */}
      <div className="flex flex-wrap gap-4">
        {channelTitle && (
          <div className="flex items-center gap-1.5 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{channelTitle}</span>
          </div>
        )}
        {publishedAt && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(publishedAt)}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Tag className="h-3.5 w-3.5" />
            <span>Tags</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 15).map((tag: string, i: number) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {tags.length > 15 && (
              <span className="text-xs text-muted-foreground">+{tags.length - 15} more</span>
            )}
          </div>
        </div>
      )}

      {/* Top Comments */}
      {topComments && topComments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Top Comments ({topComments.length})
          </h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {topComments.map((comment: any, i: number) => (
              <div key={i} className="border border-border/50 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{comment.author}</span>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {comment.likeCount > 0 && (
                      <span className="flex items-center gap-0.5">
                        <ThumbsUp className="h-2.5 w-2.5" /> {comment.likeCount}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
