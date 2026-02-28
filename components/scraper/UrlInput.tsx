"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SourceTypeIcon } from "./SourceTypeIcon";
import { detectSourceType } from "@/lib/scraper/detector";
import { Scan, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrlInputProps {
  onSubmit: (url: string, config: Record<string, any>) => void;
  isSubmitting?: boolean;
}

export function UrlInput({ onSubmit, isSubmitting }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [config, setConfig] = useState({
    depth: 0,
    maxPages: 1,
    includeImages: true,
    includeVideos: true,
    includeFiles: true,
    includeSource: true,
    includeMetadata: true,
    renderJs: false,
  });

  const detectedType = url.length > 8 ? detectSourceType(url) : null;

  const handleSubmit = useCallback(() => {
    if (!url.trim()) return;
    try {
      new URL(url);
    } catch {
      return;
    }
    onSubmit(url.trim(), config);
    setUrl("");
  }, [url, config, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          {detectedType && detectedType !== "website" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              <SourceTypeIcon sourceType={detectedType} className="h-4 w-4 text-primary" />
            </div>
          )}
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste any URL — website, YouTube, GitHub, social media..."
            className={cn(
              "h-12 text-base",
              detectedType && detectedType !== "website" && "pl-10"
            )}
            disabled={isSubmitting}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!url.trim() || isSubmitting}
          className="h-12 px-6"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Scan className="h-4 w-4 mr-2" />
              Scrape
            </>
          )}
        </Button>
      </div>

      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showOptions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Advanced Options
      </button>

      {showOptions && (
        <div className="border border-border rounded-lg bg-muted/30 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={config.includeImages}
                onCheckedChange={(v) => setConfig((c) => ({ ...c, includeImages: v }))}
              />
              <Label className="text-xs">Images</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.includeVideos}
                onCheckedChange={(v) => setConfig((c) => ({ ...c, includeVideos: v }))}
              />
              <Label className="text-xs">Videos</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.includeSource}
                onCheckedChange={(v) => setConfig((c) => ({ ...c, includeSource: v }))}
              />
              <Label className="text-xs">Source Code</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.renderJs}
                onCheckedChange={(v) => setConfig((c) => ({ ...c, renderJs: v }))}
              />
              <Label className="text-xs">Render JS</Label>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Depth</Label>
              <select
                value={config.depth}
                onChange={(e) => setConfig((c) => ({ ...c, depth: parseInt(e.target.value) }))}
                className="h-8 rounded-md bg-muted border border-input px-2 text-xs text-foreground"
              >
                <option value={0}>This page only</option>
                <option value={1}>1 level deep</option>
                <option value={2}>2 levels deep</option>
                <option value={3}>3 levels deep</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
