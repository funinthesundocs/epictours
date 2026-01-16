"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/shell/page-shell";
import { CustomerTypesTable } from "@/features/customers/components/customer-types-table";
import { CustomerTypeSheet } from "@/features/customers/components/customer-type-sheet";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";

export default function CustomerTypesPage() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const loadData = async () => {
        setIsLoading(true);
        const { data: result, error } = await supabase
            .from("customer_types")
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
            .from("customer_types")
            .delete()
            .eq("id", id);

        if (!error) {
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
            className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-4rem)] flex flex-col"
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
            action={
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                    <Plus size={16} strokeWidth={3} />
                    <span>New Type</span>
                </button>
            }
        >
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin text-cyan-400">Loading...</div>
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-white/5 bg-[#0b1115]">
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
