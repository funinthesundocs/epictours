"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/shell/page-shell";
import { LibraryCard } from "@/components/scraper/LibraryCard";
import { SourceTypeIcon } from "@/components/scraper/SourceTypeIcon";
import { StatsBar } from "@/components/scraper/StatsBar";
import { CollectionList, useCollections } from "@/components/scraper/CollectionList";
import { CollectionSheet } from "@/components/scraper/CollectionSheet";
import { BulkActionBar } from "@/components/scraper/BulkActionBar";
import { UploadDialog } from "@/components/scraper/UploadDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { Library, Search, Loader2, Star, X, CheckSquare, Upload } from "lucide-react";
import { toast } from "sonner";

interface LibraryItem {
    id: string;
    title?: string;
    description?: string;
    source_url: string;
    source_type: string;
    source_domain?: string;
    content_type: string;
    word_count?: number;
    asset_count?: number;
    is_starred?: boolean;
    tags?: string[];
    created_at: string;
    scraper_assets?: any[];
    thumbnail_signed_url?: string | null;
}

const SOURCE_TYPES = [
    "website", "youtube", "twitter", "instagram", "tiktok",
    "facebook", "linkedin", "github", "google_doc", "pdf",
];

export default function LibraryPage() {
    const { effectiveOrganizationId, user } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sourceTypeFilter, setSourceTypeFilter] = useState<string | null>(null);
    const [starredFilter, setStarredFilter] = useState(false);
    const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const searchTimeout = useRef<NodeJS.Timeout>(null);
    const [uploadOpen, setUploadOpen] = useState(false);

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSelectMode, setIsSelectMode] = useState(false);

    // Collections
    const [collectionSheetOpen, setCollectionSheetOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<any>(null);
    const [collectionsRefreshKey, setCollectionsRefreshKey] = useState(0);

    const collections = useCollections(effectiveOrganizationId || "", collectionsRefreshKey);

    const fetchItems = useCallback(async () => {
        if (!effectiveOrganizationId) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                orgId: effectiveOrganizationId,
                page: String(page),
                pageSize: "24",
            });
            if (search) params.set("search", search);
            if (sourceTypeFilter) params.set("sourceType", sourceTypeFilter);
            if (starredFilter) params.set("starred", "true");
            if (collectionFilter) params.set("collectionId", collectionFilter);

            const res = await fetch(`/api/scraper/library?${params}`);
            const data = await res.json();
            if (data.success) {
                setItems(data.data || []);
                setTotal(data.pagination?.total || 0);
            }
        } catch {
            // Silent fail
        } finally {
            setIsLoading(false);
        }
    }, [effectiveOrganizationId, search, sourceTypeFilter, starredFilter, collectionFilter, page]);

    // Debounced fetch
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            fetchItems();
        }, 500);
        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [fetchItems]);

    const handleItemClick = (itemId: string) => {
        if (isSelectMode) {
            toggleSelect(itemId);
            return;
        }
        router.push(`library/${itemId}`);
    };

    const toggleSelect = (itemId: string) => {
        setSelectedIds((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            const res = await fetch(`/api/scraper/library/${itemId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setItems((prev) => prev.filter((i) => i.id !== itemId));
                setTotal((t) => t - 1);
            } else {
                toast.error(data.error?.message || "Failed to delete");
            }
        } catch {
            toast.error("Failed to delete item");
        }
    };

    const clearFilters = () => {
        setSearch("");
        setSourceTypeFilter(null);
        setStarredFilter(false);
        setCollectionFilter(null);
        setPage(1);
    };

    const exitSelectMode = () => {
        setIsSelectMode(false);
        setSelectedIds([]);
    };

    const handleBulkDone = () => {
        exitSelectMode();
        fetchItems();
        setCollectionsRefreshKey((k) => k + 1);
    };

    const hasFilters = search || sourceTypeFilter || starredFilter || collectionFilter;

    return (
        <PageShell
            title="Library"
            description="Browse and manage your scraped content repository."
            icon={Library}
            action={
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={() => setUploadOpen(true)}
                        className="gap-1.5"
                    >
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                    </Button>
                    <Button
                        variant={isSelectMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            if (isSelectMode) exitSelectMode();
                            else setIsSelectMode(true);
                        }}
                    >
                        <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                        {isSelectMode ? "Cancel" : "Select"}
                    </Button>
                </div>
            }
        >
            <div className="flex gap-6">
                {/* Collections sidebar */}
                <div className="w-48 shrink-0 hidden md:block">
                    <CollectionList
                        orgId={effectiveOrganizationId || ""}
                        selectedCollectionId={collectionFilter}
                        onSelectCollection={(id) => { setCollectionFilter(id); setPage(1); }}
                        onCreateNew={() => { setEditingCollection(null); setCollectionSheetOpen(true); }}
                        onEdit={(c) => { setEditingCollection(c); setCollectionSheetOpen(true); }}
                        refreshKey={collectionsRefreshKey}
                    />
                </div>

                {/* Main content */}
                <div className="flex-1 space-y-4 min-w-0">
                    {/* Stats bar */}
                    {effectiveOrganizationId && (
                        <StatsBar orgId={effectiveOrganizationId} />
                    )}

                    {/* Bulk action bar */}
                    {isSelectMode && (
                        <BulkActionBar
                            selectedIds={selectedIds}
                            onClear={exitSelectMode}
                            onDone={handleBulkDone}
                            collections={collections}
                            orgId={effectiveOrganizationId || ""}
                        />
                    )}

                    {/* Search + Filters */}
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Search titles, content, URLs..."
                                    className="pl-10"
                                />
                            </div>
                            <Button
                                variant={starredFilter ? "default" : "outline"}
                                size="icon"
                                onClick={() => { setStarredFilter(!starredFilter); setPage(1); }}
                            >
                                <Star className={`h-4 w-4 ${starredFilter ? "fill-current" : ""}`} />
                            </Button>
                            {hasFilters && (
                                <Button variant="ghost" size="icon" onClick={clearFilters}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Source type filter pills */}
                        <div className="flex flex-wrap gap-1.5">
                            {SOURCE_TYPES.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setSourceTypeFilter(sourceTypeFilter === type ? null : type);
                                        setPage(1);
                                    }}
                                    className={`
                                        flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors
                                        ${sourceTypeFilter === type
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }
                                    `}
                                >
                                    <SourceTypeIcon sourceType={type} className="h-3 w-3" />
                                    {type.replace("_", " ")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results count */}
                    {total > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {total} item{total !== 1 ? "s" : ""}
                            {hasFilters ? " matching filters" : " in library"}
                        </p>
                    )}

                    {/* Item Grid */}
                    {!isLoading && items.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {items.map((item) => (
                                <div key={item.id} className="relative">
                                    {isSelectMode && (
                                        <div className="absolute top-2 left-2 z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => toggleSelect(item.id)}
                                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                            />
                                        </div>
                                    )}
                                    <LibraryCard
                                        item={item}
                                        onClick={handleItemClick}
                                        onDelete={handleDeleteItem}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {total > 24 && (
                        <div className="flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Previous
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                Page {page} of {Math.ceil(total / 24)}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= Math.ceil(total / 24)}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {isLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="border border-border rounded-lg overflow-hidden animate-pulse">
                                    <div className="h-32 bg-muted/50" />
                                    <div className="p-3 space-y-2">
                                        <div className="h-3 bg-muted/50 rounded w-1/3" />
                                        <div className="h-4 bg-muted/50 rounded w-3/4" />
                                        <div className="h-3 bg-muted/50 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && items.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute w-24 h-24 -inset-6 bg-primary/20 blur-2xl rounded-full" />
                                <Library size={48} className="text-primary relative z-10" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-semibold text-foreground">
                                    {hasFilters ? "No matching items" : "Your library is empty"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {hasFilters ? "Try adjusting your filters" : "Scraped content will appear here"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Collection Sheet */}
            <CollectionSheet
                open={collectionSheetOpen}
                onOpenChange={setCollectionSheetOpen}
                collection={editingCollection}
                orgId={effectiveOrganizationId || ""}
                onSaved={() => setCollectionsRefreshKey((k) => k + 1)}
            />

            {/* Upload Dialog */}
            <UploadDialog
                open={uploadOpen}
                onOpenChange={setUploadOpen}
                orgId={effectiveOrganizationId || ""}
                userId={user?.id || ""}
                collections={collections}
                onUploaded={() => {
                    fetchItems();
                    setCollectionsRefreshKey((k) => k + 1);
                }}
            />
        </PageShell>
    );
}
