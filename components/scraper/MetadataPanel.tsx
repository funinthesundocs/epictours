"use client";

import { cn } from "@/lib/utils";

interface MetadataItem {
  id: string;
  key: string;
  value?: string;
  value_json?: any;
  category: string;
}

interface MetadataPanelProps {
  metadata: MetadataItem[];
  structuredData?: any;
}

const categoryColors: Record<string, string> = {
  general: "text-foreground",
  seo: "text-green-400",
  social: "text-blue-400",
  technical: "text-amber-400",
  author: "text-purple-400",
  media: "text-cyan-400",
  engagement: "text-rose-400",
  platform: "text-indigo-400",
};

export function MetadataPanel({ metadata, structuredData }: MetadataPanelProps) {
  if (metadata.length === 0 && !structuredData) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No metadata extracted
      </div>
    );
  }

  // Group by category
  const grouped = metadata.reduce<Record<string, MetadataItem[]>>((acc, m) => {
    const cat = m.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h4 className={cn("text-xs font-medium uppercase tracking-wider mb-2", categoryColors[category] || "text-foreground")}>
            {category}
          </h4>
          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 text-sm py-1.5 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground shrink-0 w-40 truncate">{item.key}</span>
                <span className="text-foreground break-all">
                  {item.value || (item.value_json ? JSON.stringify(item.value_json) : "—")}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {structuredData && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider mb-2 text-cyan-400">
            Structured Data
          </h4>
          <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-auto max-h-96 text-muted-foreground">
            {JSON.stringify(structuredData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
