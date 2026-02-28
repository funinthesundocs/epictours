"use client";

import { Video, FileAudio, File, Download, Loader2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Asset {
    id: string;
    asset_type: string;
    file_name?: string;
    mime_type?: string;
    file_size_bytes?: number;
    storage_path?: string;
    original_url?: string;
    alt_text?: string;
    width?: number;
    height?: number;
    signed_url?: string | null;
}

interface AssetGridProps {
    assets: Asset[];
}

function formatSize(bytes?: number): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetThumbnail({ asset }: { asset: Asset }) {
    const [expanded, setExpanded] = useState(false);

    if (asset.signed_url) {
        if (asset.asset_type === "image" || asset.asset_type === "thumbnail" || asset.asset_type === "screenshot") {
            return (
                <>
                    <div className="relative group/thumb">
                        <img
                            src={asset.signed_url}
                            alt={asset.alt_text || asset.file_name || "Image"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        <button
                            onClick={() => setExpanded(true)}
                            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/30 transition-colors"
                        >
                            <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                        </button>
                    </div>
                    {/* Lightbox */}
                    {expanded && (
                        <div
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 cursor-pointer"
                            onClick={() => setExpanded(false)}
                        >
                            <img
                                src={asset.signed_url}
                                alt={asset.alt_text || asset.file_name || "Image"}
                                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                </>
            );
        }

        if (asset.asset_type === "video") {
            return (
                <video
                    src={asset.signed_url}
                    className="w-full h-full object-cover"
                    controls
                    muted
                    preload="metadata"
                />
            );
        }

        if (asset.asset_type === "audio") {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                    <FileAudio className="h-8 w-8 text-cyan-400/70" />
                    <audio src={asset.signed_url} controls className="w-full h-8" />
                </div>
            );
        }
    }

    // Fallback — no signed URL or unsupported type
    const icons: Record<string, any> = { video: Video, audio: FileAudio };
    const Icon = icons[asset.asset_type] || File;
    return (
        <div className="w-full h-full flex items-center justify-center">
            <Icon className="h-8 w-8 text-muted-foreground/40" />
        </div>
    );
}

export function AssetGrid({ assets }: AssetGridProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    if (assets.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground text-sm">
                No assets found
            </div>
        );
    }

    const handleDownload = async (asset: Asset) => {
        // Use existing signed_url if available, otherwise fetch it
        const url = asset.signed_url || await (async () => {
            setLoadingId(asset.id);
            try {
                const res = await fetch(`/api/scraper/assets/${asset.id}`);
                const data = await res.json();
                return data.success ? data.data.signedUrl : null;
            } catch {
                return null;
            } finally {
                setLoadingId(null);
            }
        })();

        if (url) window.open(url, "_blank");
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {assets.map((asset) => {
                const isVisual = ["image", "thumbnail", "screenshot"].includes(asset.asset_type);
                return (
                    <div
                        key={asset.id}
                        className={cn(
                            "border border-border rounded-lg overflow-hidden bg-card",
                            isVisual && "hover:border-primary/40 transition-colors"
                        )}
                    >
                        <div className="h-28 bg-muted/30 overflow-hidden">
                            <AssetThumbnail asset={asset} />
                        </div>
                        <div className="p-2 space-y-1">
                            <p className="text-xs font-medium text-foreground truncate">
                                {asset.file_name || asset.asset_type}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">
                                    {formatSize(asset.file_size_bytes)}
                                    {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
                                </span>
                                {asset.storage_path && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => handleDownload(asset)}
                                        disabled={loadingId === asset.id}
                                    >
                                        {loadingId === asset.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Download className="h-3 w-3" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
