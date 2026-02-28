"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Layers } from "lucide-react";

interface BatchUrlInputProps {
  onSubmit: (urls: string[], config: Record<string, any>) => void;
  isSubmitting?: boolean;
}

export function BatchUrlInput({ onSubmit, isSubmitting }: BatchUrlInputProps) {
  const [text, setText] = useState("");

  const urls = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      try {
        new URL(l);
        return true;
      } catch {
        return false;
      }
    });

  const handleSubmit = () => {
    if (urls.length === 0) return;
    onSubmit(urls.slice(0, 25), {});
    setText("");
  };

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Paste up to 25 URLs, one per line...\nhttps://example.com\nhttps://github.com/user/repo\nhttps://youtube.com/watch?v=..."}
        className="w-full h-32 rounded-lg bg-muted/80 border border-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/50 resize-none font-mono"
        disabled={isSubmitting}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {urls.length > 0
            ? `${urls.length} valid URL${urls.length !== 1 ? "s" : ""} detected${urls.length > 25 ? " (max 25)" : ""}`
            : "Enter URLs to begin"}
        </span>
        <Button
          onClick={handleSubmit}
          disabled={urls.length === 0 || isSubmitting}
          size="sm"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Layers className="h-4 w-4 mr-1.5" />
          )}
          Scrape {urls.length > 0 ? urls.length : ""} URL{urls.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
