"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptViewerProps {
  transcript: string;
  className?: string;
}

export function TranscriptViewer({ transcript, className }: TranscriptViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const wordCount = useMemo(
    () => transcript.split(/\s+/).filter(Boolean).length,
    [transcript]
  );

  const highlightedText = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = transcript.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }, [transcript, searchQuery]);

  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    return (transcript.match(regex) || []).length;
  }, [transcript, searchQuery]);

  const displayText = isExpanded ? transcript : transcript.slice(0, 500);
  const isLong = transcript.length > 500;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Transcript</span>
          <span className="text-xs">({wordCount.toLocaleString()} words)</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transcript..."
          className="pl-9 h-8 text-xs"
        />
        {searchQuery && matchCount > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
            {matchCount} match{matchCount !== 1 ? "es" : ""}
          </span>
        )}
      </div>

      {/* Transcript text */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {highlightedText || displayText}
          {!isExpanded && isLong && !searchQuery && "..."}
        </div>

        {isLong && !searchQuery && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 mt-3 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> Show full transcript
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
