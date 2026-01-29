"use client";

import { PageShell } from "@/components/shell/page-shell";
import { UserCog, Plus, Loader2, Search } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { RolesTable } from "@/features/settings/roles/components/roles-table";
import { AddRoleSheet } from "@/features/settings/roles/components/add-role-sheet";

export default function RolesPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [filteredRoles, setFilteredRoles] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const fetchRoles = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("roles")
                .select("*")
                .order("name");

            if (error) throw error;
            setRoles(data || []);
            setFilteredRoles(data || []);
        } catch (err) {
            console.error("Error loading roles:", err);
            // Don't alert on error to avoid spamming if table doesn't exist yet
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    // Client-side search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredRoles(roles);
            return;
        }
        const lowerQ = searchQuery.toLowerCase();
        const filtered = roles.filter(r =>
            r.name.toLowerCase().includes(lowerQ) ||
            (r.description && r.description.toLowerCase().includes(lowerQ))
        );
        setFilteredRoles(filtered);
    }, [searchQuery, roles]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("roles")
                .delete()
                .eq("id", id);

            if (error) throw error;
            toast.success("Role deleted");
            fetchRoles();
        } catch (err) {
            console.error("Error deleting role:", err);
            alert("Failed to delete role.");
        }
    };

    const handleEdit = (role: any) => {
        setEditingItem(role);
        setIsSheetOpen(true);
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setIsSheetOpen(true);
    };

    return (
        <PageShell
            title="Roles Management"
            description="Define user roles, responsibilities, and access permissions."
            icon={UserCog}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    Add Role
                </button>
            }
            className="h-[calc(100dvh-2rem)] lg:h-[calc(100dvh-4rem)] flex flex-col"
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Search Bar */}
                <div className="relative w-full max-w-md shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0b1115] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-cyan-400/50 focus:outline-none transition-colors"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-cyan-400" size={32} />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-white/5 bg-[#010e0f]">
                        <RolesTable
                            data={filteredRoles}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    </div>
                )}
            </div>

            <AddRoleSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchRoles}
                initialData={editingItem}
            />
        </PageShell>
    );
}
