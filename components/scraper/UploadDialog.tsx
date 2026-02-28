"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X, Film, Music, FileText, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    userId: string;
    onUploaded: () => void;
    collections?: { id: string; name: string }[];
}

const ACCEPT = ".mp4,.mov,.webm,.avi,.mp3,.wav,.ogg,.jpg,.jpeg,.png,.gif,.webp,.pdf";

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileCategory(mimeType: string): "image" | "video" | "audio" | "document" {
    const prefix = mimeType.split("/")[0];
    if (prefix === "image") return "image";
    if (prefix === "video") return "video";
    if (prefix === "audio") return "audio";
    return "document";
}

function FilePlaceholderIcon({ category }: { category: "image" | "video" | "audio" | "document" }) {
    if (category === "video") return <Film className="h-10 w-10 text-violet-400/70" />;
    if (category === "audio") return <Music className="h-10 w-10 text-cyan-400/70" />;
    if (category === "document") return <FileText className="h-10 w-10 text-amber-400/70" />;
    return <ImageIcon className="h-10 w-10 text-muted-foreground/50" />;
}

interface FilePreviewProps {
    file: File;
    objectUrl: string;
}

function FilePreview({ file, objectUrl }: FilePreviewProps) {
    const category = getFileCategory(file.type);

    return (
        <div className="relative w-full h-full rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
            {category === "image" ? (
                <img
                    src={objectUrl}
                    alt={file.name}
                    className="w-full h-full object-contain"
                />
            ) : category === "video" ? (
                <video
                    src={objectUrl}
                    className="w-full h-full object-contain"
                    controls
                    muted
                    preload="metadata"
                />
            ) : (
                <div className="flex flex-col items-center gap-2 p-4">
                    <FilePlaceholderIcon category={category} />
                    <p className="text-xs text-muted-foreground text-center break-all px-2">{file.name}</p>
                </div>
            )}
        </div>
    );
}

export function UploadDialog({ open, onOpenChange, orgId, userId, onUploaded, collections }: UploadDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [collectionId, setCollectionId] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadDone, setUploadDone] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Create and clean up object URL whenever file changes
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setObjectUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setObjectUrl(null);
        }
    }, [file]);

    const reset = () => {
        setFile(null);
        setObjectUrl(null);
        setTitle("");
        setDescription("");
        setCollectionId("");
        setUploadDone(false);
    };

    const handleClose = () => {
        if (isUploading) return;
        reset();
        onOpenChange(false);
    };

    const handleFileSelect = (f: File) => {
        setFile(f);
        setTitle(f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
        setUploadDone(false);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFileSelect(dropped);
    }, []);

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);

        try {
            const form = new FormData();
            form.append("file", file);
            form.append("orgId", orgId);
            form.append("userId", userId);
            if (title) form.append("title", title);
            if (description) form.append("description", description);
            if (collectionId) form.append("collectionId", collectionId);

            const res = await fetch("/api/scraper/upload", { method: "POST", body: form });
            const data = await res.json();

            if (data.success) {
                setUploadDone(true);
                toast.success(`"${title || file.name}" added to library`);
                onUploaded();
            } else {
                toast.error(data.error?.message || "Upload failed");
            }
        } catch {
            toast.error("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    if (!open) return null;

    const category = file ? getFileCategory(file.type) : null;
    const hasPreview = !!objectUrl && !!file;
    const isVisual = category === "image" || category === "video";

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Dialog */}
            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Upload to Library</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Add video, audio, image, or PDF directly</p>
                    </div>
                    <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {!uploadDone ? (
                        <>
                            {/* Drop zone / preview area */}
                            {!hasPreview ? (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-10 cursor-pointer transition-colors",
                                        isDragging
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50 hover:bg-muted/20"
                                    )}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={ACCEPT}
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                    />
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-foreground">
                                            {isDragging ? "Drop to upload" : "Drop file here or click to browse"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            MP4, MOV, MP3, JPG, PNG, PDF · Max 500 MB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* File selected — show preview */
                                <div className="space-y-3">
                                    {/* Preview box */}
                                    <div className={cn(
                                        "relative rounded-lg overflow-hidden border border-border bg-muted/20",
                                        isVisual ? "h-48" : "h-24"
                                    )}>
                                        <FilePreview file={file!} objectUrl={objectUrl!} />
                                        {/* Change file button */}
                                        <button
                                            onClick={() => { setFile(null); setTitle(""); }}
                                            className="absolute top-2 right-2 flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
                                        >
                                            <X className="h-3 w-3" /> Change
                                        </button>
                                    </div>

                                    {/* File info pill */}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-1.5">
                                        <span className="truncate font-medium text-foreground">{file!.name}</span>
                                        <span className="shrink-0 ml-auto">{formatBytes(file!.size)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Hidden file input when showing preview */}
                            {hasPreview && (
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={ACCEPT}
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                />
                            )}

                            {/* Metadata fields — only shown after file is picked */}
                            {hasPreview && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Title</label>
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Item title..."
                                            className="mt-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Description <span className="text-muted-foreground/60">(optional)</span>
                                        </label>
                                        <Input
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Short description..."
                                            className="mt-1 text-sm"
                                        />
                                    </div>
                                    {collections && collections.length > 0 && (
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Collection <span className="text-muted-foreground/60">(optional)</span>
                                            </label>
                                            <select
                                                value={collectionId}
                                                onChange={(e) => setCollectionId(e.target.value)}
                                                className="mt-1 w-full text-sm bg-muted border border-border rounded-md px-3 py-1.5 text-foreground"
                                            >
                                                <option value="">No collection</option>
                                                {collections.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Success state — keep the preview visible */
                        <div className="space-y-4">
                            {/* Keep image/video preview in success state */}
                            {hasPreview && isVisual && (
                                <div className="relative h-40 rounded-lg overflow-hidden border border-emerald-500/30 bg-muted/20">
                                    <FilePreview file={file!} objectUrl={objectUrl!} />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                        <CheckCircle2 className="h-12 w-12 text-emerald-400 drop-shadow-lg" />
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col items-center gap-2 py-2">
                                {!isVisual && <CheckCircle2 className="h-10 w-10 text-emerald-400" />}
                                <p className="text-sm font-semibold text-foreground">Upload complete!</p>
                                <p className="text-xs text-muted-foreground text-center">
                                    <span className="font-medium text-foreground">{title || file?.name}</span> has been added to your library.
                                </p>
                            </div>
                            <div className="flex gap-2 justify-center">
                                <Button size="sm" variant="outline" onClick={reset}>
                                    Upload another
                                </Button>
                                <Button size="sm" onClick={handleClose}>
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!uploadDone && (
                    <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
                        <Button variant="ghost" size="sm" onClick={handleClose} disabled={isUploading}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={hasPreview ? handleUpload : () => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="gap-1.5"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Uploading...
                                </>
                            ) : hasPreview ? (
                                <>
                                    <Upload className="h-3.5 w-3.5" />
                                    Upload
                                </>
                            ) : (
                                <>
                                    <Upload className="h-3.5 w-3.5" />
                                    Choose File
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
