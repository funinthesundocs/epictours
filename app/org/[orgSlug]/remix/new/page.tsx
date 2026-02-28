"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/shell/page-shell";
import { SourceSelector } from "@/components/remix/SourceSelector";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-context";
import { Clapperboard, ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function NewRemixProjectPage() {
    const { user, effectiveOrganizationId } = useAuth();
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!name.trim() || selectedIds.length === 0 || !effectiveOrganizationId || !user) return;
        setIsCreating(true);
        try {
            const res = await fetch("/api/remix/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    scraperItemIds: selectedIds,
                    orgId: effectiveOrganizationId,
                    userId: user.id,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Project created");
                router.push(`../remix/${data.data.id}`);
            } else {
                toast.error(data.error?.message || "Failed to create project");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to create project");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <PageShell
            title="New Remix Project"
            description="Select source content from your Library and start remixing."
            icon={Clapperboard}
            action={
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                    Back
                </Button>
            }
        >
            <div className="max-w-3xl space-y-6">
                {/* Project details */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs">Project Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Remix Project"
                            className="h-10"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Description (optional)</Label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of what you're remixing..."
                            className="w-full h-20 rounded-lg bg-muted/80 border border-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/50 resize-none"
                        />
                    </div>
                </div>

                {/* Source selection */}
                <div className="space-y-3">
                    <div>
                        <h3 className="text-sm font-medium text-foreground">Select Source Content</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Choose video or audio content from your Library. Items need a transcript for remixing.
                        </p>
                    </div>
                    <SourceSelector
                        orgId={effectiveOrganizationId || ""}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                    />
                </div>

                {/* Create button */}
                <div className="flex justify-end pt-4 border-t border-border">
                    <Button
                        onClick={handleCreate}
                        disabled={!name.trim() || selectedIds.length === 0 || isCreating}
                        size="lg"
                    >
                        {isCreating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <ArrowRight className="h-4 w-4 mr-2" />
                        )}
                        Create Project
                    </Button>
                </div>
            </div>
        </PageShell>
    );
}
