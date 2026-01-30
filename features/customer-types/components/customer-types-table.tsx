"use client";

import { Trash2, Edit2, Code } from "lucide-react";
import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface CustomerTypesTableProps {
    data: any[];
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
}

export function CustomerTypesTable({ data, onEdit, onDelete }: CustomerTypesTableProps) {
    const [deletingItem, setDeletingItem] = useState<any>(null);


    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/50 rounded-xl border border-border">
                No customer types found.
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto relative">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-muted/50 backdrop-blur-sm text-foreground text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-border">
                        <tr>
                            <th className="px-6 py-4">Customer Type</th>
                            <th className="px-6 py-4">Code</th>
                            <th className="px-6 py-4">Notes</th>
                            <th className="px-6 py-4 w-[100px] border-l border-border"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                        {data.map((type) => (
                            <tr key={type.id} className="hover:bg-muted/50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-foreground">
                                    {type.name}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                                        {type.code}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                                    {type.description || "-"}
                                </td>
                                <td className="px-6 py-4 border-l border-border">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(type);
                                            }}
                                            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(type);
                                            }}
                                            className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                    {data.map((type) => (
                        <div key={type.id} className="bg-card border border-border rounded-xl p-4">
                            {/* Header */}
                            <div className={`flex items-start justify-between gap-4 ${type.description ? 'border-b border-border pb-3' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-foreground leading-tight">
                                        {type.name}
                                    </h3>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                                        {type.code}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(type)}
                                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(type)}
                                        className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            {type.description && (
                                <div className="text-muted-foreground pt-3">{type.description}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <AlertDialog
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={() => {
                    if (deletingItem) {
                        onDelete(deletingItem.id);
                        setDeletingItem(null);
                    }
                }}
                title="Delete Customer Type?"
                description={`Are you sure you want to remove "${deletingItem?.name}"? This action cannot be undone.`}
                confirmLabel="Delete Type"
                isDestructive={true}
            />
        </>
    );
}
