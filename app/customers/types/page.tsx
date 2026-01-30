"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/shell/page-shell";
import { CustomerTypesTable } from "@/features/customer-types/components/customer-types-table";
import { CustomerTypeSheet } from "@/features/customer-types/components/customer-type-sheet";
import { supabase } from "@/lib/supabase";
import { Plus, Loader2, Tags } from "lucide-react";

export default function CustomerTypesPage() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const loadData = async () => {
        setIsLoading(true);
        const { data: result, error } = await supabase
            .from("customer_types" as any)
            .select("*")
            .order("name", { ascending: true });

        if (!error) {
            setData(result || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = () => {
        setEditingItem(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from("customer_types" as any)
            .delete()
            .eq("id", id);

        if (!error) {
            toast.success("Customer type deleted");
            loadData();
        } else {
            alert("Failed to delete. Check console.");
            console.error(error);
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
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground gap-2">
                    <Loader2 size={24} className="animate-spin text-primary" />
                    Loading...
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                    <CustomerTypesTable
                        data={data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>
            )}

            <CustomerTypeSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={loadData}
                initialData={editingItem}
            />
        </PageShell>
    );
}
