"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Users, Plus, Loader2, Search } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { StaffTable } from "@/features/operations/staff/components/staff-table";
import { AddStaffSheet } from "@/features/operations/staff/components/add-staff-sheet";
import { CompensationSheet } from "@/features/operations/staff/components/compensation-sheet";

export default function StaffPage() {
    const [staff, setStaff] = useState<any[]>([]);
    const [filteredStaff, setFilteredStaff] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Sheet States
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any>(null); // For Add/Edit Sheet

    const [isCompSheetOpen, setIsCompSheetOpen] = useState(false);
    const [compStaff, setCompStaff] = useState<{ id: string, name: string } | null>(null); // For Comp Sheet

    const fetchStaff = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("staff")
                .select("*, position:staff_positions(name)")
                .order("name");

            if (error) throw error;
            setStaff(data || []);
            setFilteredStaff(data || []);
        } catch (err) {
            console.error("Error loading staff:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    // Client-side search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredStaff(staff);
            return;
        }
        const lowerQ = searchQuery.toLowerCase();
        const filtered = staff.filter(s =>
            s.name.toLowerCase().includes(lowerQ) ||
            s.email?.toLowerCase().includes(lowerQ) ||
            s.role?.name?.toLowerCase().includes(lowerQ) ||
            s.phone?.toLowerCase().includes(lowerQ) ||
            s.messaging_app?.toLowerCase().includes(lowerQ) ||
            s.notes?.toLowerCase().includes(lowerQ)
        );
        setFilteredStaff(filtered);
    }, [searchQuery, staff]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("staff")
                .delete()
                .eq("id", id);

            if (error) throw error;
            toast.success("Staff member deleted");
            fetchStaff();
        } catch (err) {
            console.error("Error deleting staff:", err);
            alert("Failed to delete staff.");
        }
    };

    const handleEdit = (staffMember: any) => {
        setEditingStaff(staffMember);
        setIsAddSheetOpen(true);
    };

    const handleAddNew = () => {
        setEditingStaff(null);
        setIsAddSheetOpen(true);
    };

    const handleCompensation = (staffMember: any) => {
        setCompStaff({ id: staffMember.id, name: staffMember.name });
        setIsCompSheetOpen(true);
    };

    return (
        <PageShell
            title="Staff Management"
            description="Manage team members, roles, and compensation structures."
            icon={Users}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    Add Staff
                </button>
            }
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Search Bar */}
                <div className="relative w-full max-w-md shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search staff..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary/50 focus:outline-none transition-colors placeholder:text-muted-foreground"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                        <StaffTable
                            data={filteredStaff}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onCompensation={handleCompensation}
                        />
                    </div>
                )}
            </div>

            <AddStaffSheet
                isOpen={isAddSheetOpen}
                onClose={() => setIsAddSheetOpen(false)}
                onSuccess={fetchStaff}
                initialData={editingStaff}
            />

            <CompensationSheet
                isOpen={isCompSheetOpen}
                onClose={() => setIsCompSheetOpen(false)}
                staffId={compStaff?.id || null}
                staffName={compStaff?.name || ""}
            />

        </PageShell>
    );
}
