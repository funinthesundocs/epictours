"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FolderOpen, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  item_count: number;
}

interface CollectionListProps {
  orgId: string;
  selectedCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
  onCreateNew: () => void;
  onEdit: (collection: Collection) => void;
  refreshKey?: number;
}

export function CollectionList({
  orgId,
  selectedCollectionId,
  onSelectCollection,
  onCreateNew,
  onEdit,
  refreshKey,
}: CollectionListProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await fetch(`/api/scraper/collections?orgId=${orgId}`);
      const data = await res.json();
      if (data.success) {
        setCollections(data.data || []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections, refreshKey]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/scraper/collections/${id}`, { method: "DELETE" });
      if ((await res.json()).success) {
        toast.success("Collection deleted");
        if (selectedCollectionId === id) onSelectCollection(null);
        fetchCollections();
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collections</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreateNew}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* All items button */}
      <button
        onClick={() => onSelectCollection(null)}
        className={cn(
          "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors",
          selectedCollectionId === null
            ? "bg-primary/10 text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <FolderOpen className="h-3.5 w-3.5" />
        All Items
      </button>

      {isLoading && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        </div>
      )}

      {collections.map((c) => (
        <div
          key={c.id}
          className={cn(
            "group flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer",
            selectedCollectionId === c.id
              ? "bg-primary/10 text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          onClick={() => onSelectCollection(c.id)}
        >
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: c.color || "#3b82f6" }}
          />
          <span className="truncate flex-1">{c.name}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">{c.item_count}</span>
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(c); }}
              className="p-0.5 rounded hover:bg-muted"
            >
              <Pencil className="h-2.5 w-2.5" />
            </button>
            <button
              onClick={(e) => handleDelete(e, c.id)}
              className="p-0.5 rounded hover:bg-muted text-destructive"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      ))}

      {!isLoading && collections.length === 0 && (
        <p className="text-[10px] text-muted-foreground px-2.5 py-1">No collections yet</p>
      )}
    </div>
  );
}

// Export collections data for BulkActionBar
export function useCollections(orgId: string, refreshKey?: number) {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    if (!orgId) return;
    fetch(`/api/scraper/collections?orgId=${orgId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCollections(d.data || []);
      })
      .catch(() => {});
  }, [orgId, refreshKey]);

  return collections;
}
