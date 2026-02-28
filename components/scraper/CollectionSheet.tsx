"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidePanel } from "@/components/ui/side-panel";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface CollectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: Collection | null;
  orgId: string;
  onSaved: () => void;
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export function CollectionSheet({ open, onOpenChange, collection, orgId, onSaved }: CollectionSheetProps) {
  const [name, setName] = useState(collection?.name || "");
  const [description, setDescription] = useState(collection?.description || "");
  const [color, setColor] = useState(collection?.color || "#3b82f6");
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!collection;

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);

    try {
      const url = isEditing
        ? `/api/scraper/collections/${collection.id}`
        : "/api/scraper/collections";

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          orgId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEditing ? "Collection updated" : "Collection created");
        onSaved();
        onOpenChange(false);
      } else {
        toast.error(data.error?.message || "Failed to save");
      }
    } catch {
      toast.error("Failed to save collection");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SidePanel
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={isEditing ? "Edit Collection" : "New Collection"}
    >
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <Label className="text-xs">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Collection name"
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            className="w-full h-20 rounded-lg bg-muted/80 border border-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/50 resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Color</Label>
          <div className="flex gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-all ${
                  color === c ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" : "hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
            {isEditing ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </SidePanel>
  );
}
