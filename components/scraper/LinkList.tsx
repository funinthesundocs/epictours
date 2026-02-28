"use client";

import { ExternalLink } from "lucide-react";

interface Link {
  url: string;
  text: string;
  rel?: string;
}

interface LinkListProps {
  links: Link[];
}

export function LinkList({ links }: LinkListProps) {
  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No links found
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-3">{links.length} link{links.length !== 1 ? "s" : ""} found</p>
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors group"
        >
          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-sm text-primary truncate group-hover:underline">
            {link.text || link.url}
          </span>
          {link.text && link.text !== link.url && (
            <span className="text-xs text-muted-foreground truncate hidden md:block">
              {(() => { try { return new URL(link.url).hostname; } catch { return ""; } })()}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
