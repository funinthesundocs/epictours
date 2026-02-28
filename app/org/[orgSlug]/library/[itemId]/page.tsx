"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/shell/page-shell";
import { ContentViewer } from "@/components/scraper/ContentViewer";
import { AssetGrid } from "@/components/scraper/AssetGrid";
import { MetadataPanel } from "@/components/scraper/MetadataPanel";
import { LinkList } from "@/components/scraper/LinkList";
import { SourceTypeIcon } from "@/components/scraper/SourceTypeIcon";
import { VideoPlayer } from "@/components/scraper/VideoPlayer";
import { TranscriptViewer } from "@/components/scraper/TranscriptViewer";
import { YouTubeMetadata } from "@/components/scraper/YouTubeMetadata";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Library, ArrowLeft, Star, ExternalLink, Loader2, X,
    FileText, Image as ImageIcon, Table, Code, Link2, Tag, Clapperboard
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ItemDetail {
    id: string;
    title?: string;
    description?: string;
    source_url: string;
    source_type: string;
    source_domain?: string;
    content_type: string;
    body_text?: string;
    body_html?: string;
    raw_source?: string;
    tables_json?: any[];
    links_json?: any[];
    headings_json?: any[];
    structured_data_json?: any;
    word_count?: number;
    asset_count?: number;
    is_starred?: boolean;
    tags?: string[];
    notes?: string;
    created_at: string;
    scraped_at: string;
    scraper_assets: any[];
    scraper_metadata: any[];
}

const tabs = [
    { id: "content", label: "Content", icon: FileText },
    { id: "assets", label: "Assets", icon: ImageIcon },
    { id: "metadata", label: "Metadata", icon: Tag },
    { id: "links", label: "Links", icon: Link2 },
    { id: "source", label: "Source", icon: Code },
];

export default function LibraryItemPage() {
    const params = useParams();
    const router = useRouter();
    const itemId = params.itemId as string;
    const [item, setItem] = useState<ItemDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("content");
    const [tagInput, setTagInput] = useState("");
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchItem = useCallback(async () => {
        try {
            const res = await fetch(`/api/scraper/library/${itemId}`);
            const data = await res.json();
            if (data.success) {
                setItem(data.data);
                setNotes(data.data.notes || "");
            }
        } catch {
            toast.error("Failed to load item");
        } finally {
            setIsLoading(false);
        }
    }, [itemId]);

    useEffect(() => {
        fetchItem();
    }, [fetchItem]);

    const handleToggleStar = async () => {
        if (!item) return;
        try {
            const res = await fetch(`/api/scraper/library/${itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isStarred: !item.is_starred }),
            });
            const data = await res.json();
            if (data.success) {
                setItem((prev) => prev ? { ...prev, is_starred: !prev.is_starred } : null);
            }
        } catch {
            toast.error("Failed to update");
        }
    };

    const handleAddTag = async () => {
        if (!item || !tagInput.trim()) return;
        const newTags = [...(item.tags || []), tagInput.trim()];
        setIsSaving(true);
        try {
            const res = await fetch(`/api/scraper/library/${itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: newTags }),
            });
            const data = await res.json();
            if (data.success) {
                setItem((prev) => prev ? { ...prev, tags: newTags } : null);
                setTagInput("");
            }
        } catch {
            toast.error("Failed to add tag");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        if (!item) return;
        const newTags = (item.tags || []).filter((t) => t !== tagToRemove);
        try {
            await fetch(`/api/scraper/library/${itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: newTags }),
            });
            setItem((prev) => prev ? { ...prev, tags: newTags } : null);
        } catch {
            toast.error("Failed to remove tag");
        }
    };

    const handleSaveNotes = async () => {
        setIsSaving(true);
        try {
            await fetch(`/api/scraper/library/${itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes }),
            });
            toast.success("Notes saved");
        } catch {
            toast.error("Failed to save notes");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <PageShell title="Loading..." description="" icon={Library}>
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </PageShell>
        );
    }

    if (!item) {
        return (
            <PageShell title="Not Found" description="" icon={Library}>
                <div className="text-center py-16 text-muted-foreground">Item not found</div>
            </PageShell>
        );
    }

    return (
        <PageShell
            title={item.title || "Untitled Item"}
            description={item.source_domain || item.source_type}
            icon={Library}
            action={
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleToggleStar}>
                        <Star className={cn("h-4 w-4", item.is_starred && "fill-amber-400 text-amber-400")} />
                    </Button>
                    {(item.content_type === "video" || item.content_type === "audio" || item.source_type === "youtube") && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`../../remix/new?source=${item.id}`)}
                        >
                            <Clapperboard className="h-3.5 w-3.5 mr-1.5" />
                            Send to Remix
                        </Button>
                    )}
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Source
                        </Button>
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                        Back
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                {/* Item header */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <SourceTypeIcon sourceType={item.source_type} className="h-4 w-4" />
                    <span>{item.source_type}</span>
                    <span className="text-border">|</span>
                    <span>{item.content_type}</span>
                    {item.word_count != null && item.word_count > 0 && (
                        <>
                            <span className="text-border">|</span>
                            <span>{item.word_count.toLocaleString()} words</span>
                        </>
                    )}
                    {item.scraper_assets?.length > 0 && (
                        <>
                            <span className="text-border">|</span>
                            <span>{item.scraper_assets.length} assets</span>
                        </>
                    )}
                </div>

                {/* Tags */}
                <div className="flex items-center flex-wrap gap-2">
                    {item.tags?.map((tag) => (
                        <span
                            key={tag}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                        >
                            {tag}
                            <button onClick={() => handleRemoveTag(tag)} className="hover:text-foreground">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <div className="flex items-center gap-1">
                        <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                            placeholder="Add tag..."
                            className="h-7 w-28 text-xs"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-border">
                    <div className="flex gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const count =
                                tab.id === "assets" ? item.scraper_assets?.length :
                                tab.id === "links" ? item.links_json?.length :
                                tab.id === "metadata" ? item.scraper_metadata?.length : undefined;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                                        activeTab === tab.id
                                            ? "border-primary text-foreground"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {tab.label}
                                    {count != null && count > 0 && (
                                        <span className="text-[10px] text-muted-foreground">({count})</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[300px]">
                    {activeTab === "content" && (
                        <div className="space-y-4">
                            {/* YouTube-specific content */}
                            {item.source_type === "youtube" && (
                                <div className="space-y-4">
                                    {/* Video Player */}
                                    {(() => {
                                        const videoAsset = item.scraper_assets?.find((a: any) => a.asset_type === "video");
                                        if (videoAsset) {
                                            return (
                                                <VideoPlayer
                                                    assetId={videoAsset.id}
                                                    fileName={videoAsset.file_name}
                                                    durationSeconds={videoAsset.duration_seconds}
                                                    signedUrl={videoAsset.signed_url}
                                                />
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* YouTube Metadata (views, likes, channel, etc.) */}
                                    <YouTubeMetadata metadata={item.scraper_metadata || []} />

                                    {/* Transcript */}
                                    {item.body_text && (
                                        <TranscriptViewer transcript={item.body_text} />
                                    )}
                                </div>
                            )}

                            {/* Generic content for non-YouTube items */}
                            {item.source_type !== "youtube" && (
                                <>
                                    {/* Show visual asset at top for image/video items */}
                                    {(() => {
                                        const visualAsset = item.scraper_assets?.find(
                                            (a: any) => (a.asset_type === "image" || a.asset_type === "thumbnail" || a.asset_type === "video") && a.signed_url
                                        );
                                        if (!visualAsset) return null;
                                        return (
                                            <div className="rounded-lg overflow-hidden border border-border bg-muted/20 max-h-[480px] flex items-center justify-center">
                                                {visualAsset.asset_type === "video" ? (
                                                    <video
                                                        src={visualAsset.signed_url}
                                                        controls
                                                        className="max-w-full max-h-[480px] object-contain"
                                                        preload="metadata"
                                                    />
                                                ) : (
                                                    <img
                                                        src={visualAsset.signed_url}
                                                        alt={item.title || "Image"}
                                                        className="max-w-full max-h-[480px] object-contain"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })()}
                                    <ContentViewer
                                        bodyText={item.body_text}
                                        bodyHtml={item.body_html}
                                        wordCount={item.word_count}
                                    />
                                </>
                            )}
                            {/* Notes */}
                            <div className="border-t border-border pt-4 space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add notes about this item..."
                                    className="w-full h-24 rounded-lg bg-muted/80 border border-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/50 resize-none"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSaveNotes}
                                    disabled={isSaving || notes === (item.notes || "")}
                                >
                                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                    Save Notes
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === "assets" && (
                        <AssetGrid assets={item.scraper_assets || []} />
                    )}

                    {activeTab === "metadata" && (
                        <MetadataPanel
                            metadata={item.scraper_metadata || []}
                            structuredData={item.structured_data_json}
                        />
                    )}

                    {activeTab === "links" && (
                        <LinkList links={item.links_json || []} />
                    )}

                    {activeTab === "source" && (
                        <div>
                            {item.raw_source ? (
                                <pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-auto max-h-[600px] text-muted-foreground whitespace-pre-wrap">
                                    {item.raw_source.substring(0, 50000)}
                                    {item.raw_source.length > 50000 && "\n\n... (truncated)"}
                                </pre>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground text-sm">
                                    Source code was not captured for this item
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </PageShell>
    );
}
