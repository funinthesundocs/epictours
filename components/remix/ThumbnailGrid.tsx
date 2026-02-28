"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Check, RefreshCw, Loader2, Image as ImageIcon, Sparkles, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ThumbnailVariation {
    id: string;
    prompt: string;
    file_path: string;
    is_selected: boolean;
    analysis?: any;
    signed_url?: string;
}

interface ThumbnailGridProps {
    projectId: string;
    sourceId: string;
    orgId: string;
    thumbnails: ThumbnailVariation[];
    onThumbnailsChange: () => void;
    disabled?: boolean;
}

export function ThumbnailGrid({ projectId, sourceId, orgId, thumbnails, onThumbnailsChange, disabled }: ThumbnailGridProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [customPrompt, setCustomPrompt] = useState("");
    const [showCustomPrompt, setShowCustomPrompt] = useState(false);

    const selectedThumbnail = thumbnails.find((t) => t.is_selected);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/remix/thumbnail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceId,
                    projectId,
                    orgId,
                    customPromptModifier: customPrompt || undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Generated ${data.data.thumbnailsGenerated} thumbnail variations`);
                setCustomPrompt("");
                setShowCustomPrompt(false);
                onThumbnailsChange();
            } else {
                toast.error(data.error?.message || "Failed to generate thumbnails");
            }
        } catch {
            toast.error("Failed to generate thumbnails");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelect = async (thumbnailId: string) => {
        try {
            const res = await fetch(`/api/remix/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    selectThumbnail: thumbnailId,
                    orgId,
                }),
            });
            if (res.ok) {
                onThumbnailsChange();
            }
        } catch {
            toast.error("Failed to select thumbnail");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-foreground">Thumbnail Variations</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {thumbnails.length > 0
                            ? `${thumbnails.length} thumbnails generated. Select one for your remix.`
                            : "Generate AI thumbnails from your source content."}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {thumbnails.length > 0 && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                        >
                            Custom Prompt
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant={thumbnails.length > 0 ? "outline" : "default"}
                        onClick={handleGenerate}
                        disabled={isGenerating || disabled}
                    >
                        {isGenerating ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : thumbnails.length > 0 ? (
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        ) : (
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {thumbnails.length > 0 ? "Regenerate" : "Generate Thumbnails"}
                    </Button>
                </div>
            </div>

            {/* Custom prompt input */}
            {showCustomPrompt && (
                <div className="flex items-center gap-2">
                    <Input
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Add a custom modifier to the prompt (e.g., 'make it more dramatic with warm colors')"
                        className="text-sm"
                        maxLength={500}
                    />
                </div>
            )}

            {isGenerating && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Analyzing original & generating thumbnails...</span>
                    <span className="text-[10px] text-muted-foreground">This may take 30-60 seconds</span>
                </div>
            )}

            {!isGenerating && thumbnails.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {thumbnails.map((thumb, i) => (
                        <div
                            key={thumb.id}
                            className={cn(
                                "border rounded-lg overflow-hidden transition-all cursor-pointer group",
                                thumb.is_selected
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-border hover:border-primary/30"
                            )}
                            onClick={() => handleSelect(thumb.id)}
                        >
                            {/* Thumbnail image */}
                            <div className="aspect-video bg-muted relative">
                                {thumb.signed_url ? (
                                    <img
                                        src={thumb.signed_url}
                                        alt={`Thumbnail variation ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                                    </div>
                                )}

                                {/* Selection overlay */}
                                {thumb.is_selected && (
                                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                        <div className="bg-primary rounded-full p-1.5">
                                            <Check className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                    </div>
                                )}

                                {/* Hover overlay */}
                                {!thumb.is_selected && (
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <span className="text-white text-xs font-medium px-3 py-1.5 rounded-full bg-black/50">
                                            Click to select
                                        </span>
                                    </div>
                                )}

                                {/* Variation number */}
                                <div className="absolute top-2 left-2">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white font-medium">
                                        {i === 0 ? "Style-matched" : i === 1 ? "Bold" : "Cinematic"}
                                    </span>
                                </div>
                            </div>

                            {/* Prompt info */}
                            <div className="p-3 space-y-1.5">
                                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                                    {thumb.prompt}
                                </p>
                                {!thumb.is_selected && (
                                    <p className="text-[10px] text-primary font-medium">Select this thumbnail</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Selected summary */}
            {selectedThumbnail && !isGenerating && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs text-foreground">Thumbnail selected</span>
                    {selectedThumbnail.signed_url && (
                        <a
                            href={selectedThumbnail.signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Download className="h-3 w-3" /> Download
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
