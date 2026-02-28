"use client";

interface ContentViewerProps {
  bodyText?: string | null;
  bodyHtml?: string | null;
  wordCount?: number | null;
}

export function ContentViewer({ bodyText, bodyHtml, wordCount }: ContentViewerProps) {
  if (!bodyText && !bodyHtml) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No text content extracted
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {wordCount != null && wordCount > 0 && (
        <p className="text-xs text-muted-foreground">{wordCount.toLocaleString()} words</p>
      )}
      <div className="prose prose-sm prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
          {bodyText}
        </div>
      </div>
    </div>
  );
}
