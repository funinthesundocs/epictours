"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SourceTypeIcon } from "@/components/scraper/SourceTypeIcon";
import { Search, Loader2, Check, Film, Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScraperItem {
  id: string;
  title?: string;
  description?: string;
  source_url: string;
  source_type: string;
  content_type: string;
  word_count?: number;
  body_text?: string;
  created_at: string;
  scraper_assets?: { id: string; asset_type: string; file_name?: string }[];
}

interface SourceSelectorProps {
  orgId: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxSelections?: number;
}

export function SourceSelector({ orgId, selectedIds, onSelectionChange, maxSelections = 10 }: SourceSelectorProps) {
  const [items, setItems] = useState<ScraperItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchItems = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ orgId, pageSize: "50" });
      if (search) params.set("search", search);
      // Fetch items that have video/audio content (for remixing)
      const res = await fetch(`/api/remix/library/videos?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [orgId, search]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 300);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else if (selectedIds.length < maxSelections) {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search video and audio content..."
          className="pl-10"
        />
      </div>

      {selectedIds.length > 0 && (
        <p className="text-xs text-primary font-medium">
          {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""} selected
        </p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Film className="h-10 w-10 text-muted-foreground/40" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">No video/audio content found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Scrape some YouTube videos or audio content first
            </p>
          </div>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const hasVideo = item.scraper_assets?.some((a) => a.asset_type === "video");
            const hasAudio = item.scraper_assets?.some((a) => a.asset_type === "audio");
            const hasTranscript = !!item.body_text && item.body_text.length > 50;

            return (
              <button
                key={item.id}
                onClick={() => toggleSelection(item.id)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/30"
                )}
              >
                {/* Selection indicator */}
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                )}>
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <SourceTypeIcon sourceType={item.source_type} className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{item.source_type}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                    {item.title || "Untitled"}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    {hasVideo && (
                      <span className="flex items-center gap-1">
                        <Film className="h-2.5 w-2.5" /> Video
                      </span>
                    )}
                    {hasAudio && (
                      <span className="flex items-center gap-1">
                        <Music className="h-2.5 w-2.5" /> Audio
                      </span>
                    )}
                    {hasTranscript && (
                      <span className="text-primary/80">Transcript available</span>
                    )}
                    {item.word_count && item.word_count > 0 && (
                      <span>{item.word_count.toLocaleString()} words</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
