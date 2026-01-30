"use client";

import { Edit2, MapPin, Phone, Trash2, Building2 } from "lucide-react";

import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface HotelTableProps {
    data: any[];
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
}

export function HotelsTable({ data, onEdit, onDelete }: HotelTableProps) {
    const [deletingItem, setDeletingItem] = useState<any>(null);

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-popover rounded-xl border border-border">
                No hotels found.
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto relative">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-muted/50 backdrop-blur-sm text-foreground text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-border">
                        <tr>
                            <th className="px-6 py-4">Hotel Name</th>
                            <th className="px-6 py-4">Contact Phone</th>
                            <th className="px-6 py-4">Assigned Pickup Point</th>
                            <th className="px-6 py-4 w-[100px] border-l border-border"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                        {data.map((hotel) => (
                            <tr key={hotel.id} className="hover:bg-muted/50 transition-colors group">
                                <td className="px-6 py-4 align-middle font-medium text-foreground">
                                    {hotel.name}
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    {hotel.contact_phone ? (
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Phone size={14} className="shrink-0 text-muted-foreground" />
                                            {hotel.contact_phone}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    {hotel.pickup_points ? (
                                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">
                                            <MapPin size={14} className="shrink-0 text-muted-foreground" />
                                            {hotel.pickup_points.name}
                                        </span>
                                    ) : (
                                        <span className="text-destructive text-xs italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 align-middle border-l border-border">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(hotel);
                                            }}
                                            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(hotel);
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
                    {data.map((hotel) => (
                        <div key={hotel.id} className="bg-card border border-border rounded-xl p-4 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                                <h3 className="text-lg font-bold text-foreground leading-tight">
                                    {hotel.name}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(hotel)}
                                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(hotel)}
                                        className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body Grid */}
                            <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-sm">
                                <div className="text-muted-foreground">Contact</div>
                                <div>
                                    {hotel.contact_phone ? (
                                        <span className="flex items-center gap-2 text-foreground">
                                            <Phone size={14} className="text-muted-foreground" />
                                            {hotel.contact_phone}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </div>

                                <div className="text-muted-foreground">Pickup Point</div>
                                <div>
                                    {hotel.pickup_points ? (
                                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">
                                            <MapPin size={14} />
                                            {hotel.pickup_points.name}
                                        </span>
                                    ) : (
                                        <span className="text-destructive text-xs italic">Unassigned</span>
                                    )}
                                </div>
                            </div>
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
                title="Delete Hotel?"
                description={`Are you sure you want to remove "${deletingItem?.name}"?`}
                confirmLabel="Delete Hotel"
                isDestructive={true}
            />
        </>
    );
}
