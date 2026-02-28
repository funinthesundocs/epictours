"use client";

import { SourceTypeIcon } from "./SourceTypeIcon";
import { Star, FileText, Film, Music, File, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LibraryItem {
    id: string;
    title?: string;
    description?: string;
    source_url: string;
    source_type: string;
    source_domain?: string;
    content_type: string;
    word_count?: number;
    asset_count?: number;
    is_starred?: boolean;
    tags?: string[];
    created_at: string;
    scraper_assets?: { id: string; asset_type: string; storage_path?: string; mime_type?: string; alt_text?: string }[];
    thumbnail_signed_url?: string | null;
}

interface LibraryCardProps {
    item: LibraryItem;
    onClick?: (itemId: string) => void;
    onDelete?: (itemId: string) => void;
}

function ContentPlaceholder({ contentType, sourceType }: { contentType: string; sourceType: string }) {
    if (contentType === "video") return <Film className="h-10 w-10 text-violet-400/50" />;
    if (contentType === "audio") return <Music className="h-10 w-10 text-cyan-400/50" />;
    if (contentType === "document") return <FileText className="h-10 w-10 text-amber-400/50" />;
    if (contentType === "file") return <File className="h-10 w-10 text-muted-foreground/40" />;
    return <SourceTypeIcon sourceType={sourceType} className="h-10 w-10 text-muted-foreground/40" />;
}

export function LibraryCard({ item, onClick, onDelete }: LibraryCardProps) {
    // thumbnail_signed_url is generated from image/thumbnail assets first, then video
    // If the signed URL came from a video asset (no image/thumbnail present), use video element
    const hasStillAsset = item.scraper_assets?.some((a) => a.asset_type === "image" || a.asset_type === "thumbnail");
    const videoAsset = item.scraper_assets?.find((a) => a.asset_type === "video");
    const showVideo = !!(item.thumbnail_signed_url && videoAsset && !hasStillAsset);
    const showImage = !!(item.thumbnail_signed_url && (hasStillAsset || !videoAsset));

    return (
        <div
            className="group border border-border rounded-lg bg-card overflow-hidden hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => onClick?.(item.id)}
        >
            {/* Thumbnail area */}
            <div className="h-32 bg-muted/30 flex items-center justify-center relative overflow-hidden">
                {showVideo ? (
                    <video
                        src={item.thumbnail_signed_url!}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                        onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                        onMouseLeave={(e) => {
                            const v = e.currentTarget as HTMLVideoElement;
                            v.pause();
                            v.currentTime = 0;
                        }}
                    />
                ) : showImage ? (
                    <img
                        src={item.thumbnail_signed_url!}
                        alt={item.title || "Library item"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <ContentPlaceholder contentType={item.content_type} sourceType={item.source_type} />
                )}

                {/* Gradient overlay on hover for images/video */}
                {(showVideo || showImage) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}

                {item.is_starred && (
                    <Star className="absolute top-2 right-2 h-4 w-4 text-amber-400 fill-amber-400 drop-shadow" />
                )}

                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="absolute top-2 left-2 h-6 w-6 rounded bg-black/60 flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete item"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                )}

                {/* Content type badge for video */}
                {item.content_type === "video" && (
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white font-medium">
                        <Film className="h-2.5 w-2.5" /> Video
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                    <SourceTypeIcon sourceType={item.source_type} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">{item.source_domain || item.source_type}</span>
                </div>
                <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                    {item.title || "Untitled"}
                </h3>
                {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    {item.word_count != null && item.word_count > 0 && (
                        <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {item.word_count.toLocaleString()} words
                        </span>
                    )}
                    {item.asset_count != null && item.asset_count > 0 && (
                        <span className="flex items-center gap-1">
                            <Film className="h-3 w-3" />
                            {item.asset_count}
                        </span>
                    )}
                </div>
                {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {tag}
                            </span>
                        ))}
                        {item.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{item.tags.length - 3}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
