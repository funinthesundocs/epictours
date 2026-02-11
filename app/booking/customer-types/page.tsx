"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/shell/page-shell";
import { CustomerTypesTable } from "@/features/customer-types/components/customer-types-table";
import { CustomerTypeSheet } from "@/features/customer-types/components/customer-type-sheet";
import { supabase } from "@/lib/supabase";
import { Plus, Tags } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/features/auth/auth-context";

export default function CustomerTypesPage() {
    const { effectiveOrganizationId } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const loadData = async () => {
        if (!effectiveOrganizationId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const { data: result, error } = await supabase
            .from("customer_types" as any)
            .select("*")
            .eq("organization_id", effectiveOrganizationId)
            .order("name", { ascending: true });

        if (!error) {
            setData(result || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [effectiveOrganizationId]);

    const handleCreate = () => {
        setEditingItem(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!effectiveOrganizationId) return;

        const { error } = await supabase
            .from("customer_types" as any)
            .delete()
            .eq("id", id)
            .eq("organization_id", effectiveOrganizationId);

        if (!error) {
            toast.success("Customer type deleted");
            loadData();
        } else {
            console.error("Delete error:", error);
            alert("Failed to delete. Check console.");
        }
    };

    return (
        <PageShell
            title="Customer Types"
            description="Manage customer classifications and segments."
            icon={Tags}
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
            action={
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors shadow-glow"
                >
                    <Plus size={16} strokeWidth={3} />
                    <span>New Type</span>
                </button>
            }
        >
            <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                {isLoading ? (
                    <LoadingState />
                ) : (
                    <CustomerTypesTable
                        data={data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            <CustomerTypeSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={loadData}
                initialData={editingItem}
            />
        </PageShell>
    );
}
