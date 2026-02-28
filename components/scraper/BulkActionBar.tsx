"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Trash2, FolderOpen, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
  onDone: () => void;
  collections: { id: string; name: string; color?: string }[];
  orgId: string;
}

export function BulkActionBar({ selectedIds, onClear, onDone, collections, orgId }: BulkActionBarProps) {
  const [tagInput, setTagInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [showCollections, setShowCollections] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    setIsTagging(true);
    try {
      let success = 0;
      for (const id of selectedIds) {
        const res = await fetch(`/api/scraper/library/${id}`);
        const data = await res.json();
        if (!data.success) continue;

        const existingTags = data.data.tags || [];
        if (existingTags.includes(tagInput.trim())) { success++; continue; }

        const updateRes = await fetch(`/api/scraper/library/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: [...existingTags, tagInput.trim()] }),
        });
        if ((await updateRes.json()).success) success++;
      }
      toast.success(`Tagged ${success} item${success !== 1 ? "s" : ""}`);
      setTagInput("");
      onDone();
    } catch {
      toast.error("Failed to tag items");
    } finally {
      setIsTagging(false);
    }
  };

  const handleMoveToCollection = async (collectionId: string | null) => {
    setIsMoving(true);
    try {
      let success = 0;
      for (const id of selectedIds) {
        const res = await fetch(`/api/scraper/library/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collectionId }),
        });
        if ((await res.json()).success) success++;
      }
      toast.success(`Moved ${success} item${success !== 1 ? "s" : ""}`);
      setShowCollections(false);
      onDone();
    } catch {
      toast.error("Failed to move items");
    } finally {
      setIsMoving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      let success = 0;
      for (const id of selectedIds) {
        const res = await fetch(`/api/scraper/library/${id}`, { method: "DELETE" });
        if ((await res.json()).success) success++;
      }
      toast.success(`Deleted ${success} item${success !== 1 ? "s" : ""}`);
      onDone();
    } catch {
      toast.error("Failed to delete items");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-2.5 shadow-sm">
      <span className="text-sm font-medium text-foreground shrink-0">
        {selectedIds.length} selected
      </span>

      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
        {/* Tag input */}
        <div className="flex items-center gap-1">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            placeholder="Add tag..."
            className="h-7 w-28 text-xs"
            disabled={isTagging}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleAddTag}
            disabled={!tagInput.trim() || isTagging}
          >
            {isTagging ? <Loader2 className="h-3 w-3 animate-spin" /> : <Tag className="h-3 w-3 mr-1" />}
            Tag
          </Button>
        </div>

        {/* Move to collection */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowCollections(!showCollections)}
            disabled={isMoving}
          >
            {isMoving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <FolderOpen className="h-3 w-3 mr-1" />}
            Move
          </Button>
          {showCollections && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg p-1 z-50">
              <button
                onClick={() => handleMoveToCollection(null)}
                className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-muted text-muted-foreground"
              >
                Remove from collection
              </button>
              {collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleMoveToCollection(c.id)}
                  className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-muted flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color || "#3b82f6" }} />
                  <span className="text-foreground truncate">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
          Delete
        </Button>
      </div>

      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
