"use client";

import { PageShell } from "@/components/shell/page-shell";
import { FileText, Filter, X, ThumbsUp, ThumbsDown, Copy, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { CustomSelect } from "@/components/ui/custom-select";

// Mock data
const posts = [
    {
        id: 1,
        title: "Best Snorkeling Spots in Oahu for Families",
        topic: "Hawaii family vacations",
        created: "2024-02-10",
        status: "Draft",
        wordCount: 1250,
    },
    {
        id: 2,
        title: "Top 10 Authentic Hawaiian Restaurants in Honolulu",
        topic: "Honolulu food guides",
        created: "2024-02-09",
        status: "Approved",
        wordCount: 980,
    },
    {
        id: 3,
        title: "Hiking the Diamond Head Trail: Complete Guide",
        topic: "Maui outdoor adventures",
        created: "2024-02-08",
        status: "Draft",
        wordCount: 1420,
    },
];

export default function GeneratedPostsPage() {
    const [showPostEditor, setShowPostEditor] = useState(false);
    const [selectedPost, setSelectedPost] = useState<typeof posts[0] | null>(null);
    const [filterTopic, setFilterTopic] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const handlePostClick = (post: typeof posts[0]) => {
        setSelectedPost(post);
        setShowPostEditor(true);
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            Draft: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
            Approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            Rejected: "bg-red-500/10 text-red-500 border-red-500/20",
            Published: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        };

        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
                {status}
            </span>
        );
    };

    return (
        <PageShell
            title="Generated Posts"
            description="Review and edit AI-generated blog content"
            icon={FileText}
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col overflow-hidden">
                {/* Filters */}
                <div className="px-6 py-4 border-b border-border flex flex-wrap items-center gap-3">
                    <Filter size={16} className="text-muted-foreground" />
                    <CustomSelect
                        value={filterTopic}
                        onChange={setFilterTopic}
                        options={[
                            { value: "", label: "All Topics" },
                            { value: "hawaii-family", label: "Hawaii family vacations" },
                            { value: "honolulu-food", label: "Honolulu food guides" },
                            { value: "maui-adventure", label: "Maui outdoor adventures" }
                        ]}
                        placeholder="All Topics"
                        className="w-48"
                    />
                    <CustomSelect
                        value={filterStatus}
                        onChange={setFilterStatus}
                        options={[
                            { value: "", label: "All Statuses" },
                            { value: "draft", label: "Draft" },
                            { value: "approved", label: "Approved" },
                            { value: "rejected", label: "Rejected" },
                            { value: "published", label: "Published" }
                        ]}
                        placeholder="All Statuses"
                        className="w-48"
                    />
                    <input
                        type="date"
                        className="px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:border-primary/50 focus:outline-none"
                    />
                </div>

                {/* Posts Table */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50 backdrop-blur-sm">
                                <tr className="border-b border-border">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Topic</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Words</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {posts.map((post) => (
                                    <tr
                                        key={post.id}
                                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => handlePostClick(post)}
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-foreground">{post.title}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{post.topic}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{post.created}</td>
                                        <td className="px-6 py-4">{getStatusBadge(post.status)}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{post.wordCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Post Editor Panel */}
            {showPostEditor && selectedPost && (
                <div className="fixed inset-0 z-50 bg-background flex">
                    {/* Main Editor */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-foreground">Edit Post</h2>
                            <button
                                onClick={() => setShowPostEditor(false)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                                <input
                                    type="text"
                                    defaultValue={selectedPost.title}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary/50 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Meta Description</label>
                                <textarea
                                    placeholder="SEO meta description..."
                                    rows={2}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none"
                                    defaultValue="Discover the best snorkeling spots in Oahu perfect for families. Safe, shallow waters with abundant marine life await!"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Tags / Keywords</label>
                                <div className="flex flex-wrap gap-2 p-3 bg-background border border-border rounded-lg">
                                    {["snorkeling", "oahu", "family activities", "hawaii"].map((tag) => (
                                        <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1">
                                            {tag}
                                            <X size={14} className="cursor-pointer hover:text-primary/70" />
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        placeholder="Add tag..."
                                        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Content</label>
                                <div className="bg-background border border-border rounded-lg p-4 min-h-[400px] text-foreground">
                                    <h3 className="text-xl font-semibold mb-4">Best Snorkeling Spots in Oahu for Families</h3>
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        Oahu offers some of the most spectacular snorkeling opportunities in Hawaii, with crystal-clear waters
                                        and vibrant marine life that will captivate both adults and children alike. Whether you're a first-timer
                                        or an experienced snorkeler, these family-friendly spots provide the perfect blend of safety and adventure.
                                    </p>
                                    <h4 className="text-lg font-semibold mb-2 mt-6">1. Hanauma Bay Nature Preserve</h4>
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        This protected marine life conservation area is consistently ranked as one of the best snorkeling spots
                                        in the world...
                                    </p>
                                    <p className="text-sm text-muted-foreground italic mt-8">
                                        [Full article content would continue here...]
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                            <div className="flex gap-2">
                                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-medium rounded-lg text-sm transition-colors">
                                    <ThumbsUp size={16} /> Approve
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium rounded-lg text-sm transition-colors">
                                    <ThumbsDown size={16} /> Reject
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex items-center gap-2 px-4 py-2 hover:bg-muted text-muted-foreground font-medium rounded-lg text-sm transition-colors">
                                    <Copy size={16} /> Duplicate
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 hover:bg-destructive/10 text-destructive font-medium rounded-lg text-sm transition-colors">
                                    <Trash2 size={16} /> Delete
                                </button>
                                <button
                                    disabled
                                    title="Publishing integration coming soon"
                                    className="flex items-center gap-2 px-4 py-2 bg-primary/50 text-primary-foreground font-medium rounded-lg text-sm cursor-not-allowed opacity-50"
                                >
                                    <Upload size={16} /> Publish
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Post Info Sidebar */}
                    <div className="w-72 border-l border-border bg-card p-6 space-y-6 overflow-auto">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3">Post Info</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-muted-foreground">Topic</label>
                                    <p className="text-sm text-foreground mt-1">{selectedPost.topic}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Created</label>
                                    <p className="text-sm text-foreground mt-1">{selectedPost.created}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Word Count</label>
                                    <p className="text-sm text-foreground mt-1">{selectedPost.wordCount} words</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Status</label>
                                    <div className="mt-1">{getStatusBadge(selectedPost.status)}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Source</label>
                                    <p className="text-sm text-foreground mt-1">Auto-generated from web scrape</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
