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
            <div className="text-center py-12 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/10">
                No hotels found.
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto relative">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-zinc-900/80 backdrop-blur-sm text-white text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4">Hotel Name</th>
                            <th className="px-6 py-4">Contact Phone</th>
                            <th className="px-6 py-4">Assigned Pickup Point</th>
                            <th className="px-6 py-4 w-[100px] border-l border-white/10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                        {data.map((hotel) => (
                            <tr key={hotel.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 align-middle font-medium text-white">
                                    {hotel.name}
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    {hotel.contact_phone ? (
                                        <span className="flex items-center gap-2 text-zinc-400">
                                            <Phone size={14} className="shrink-0 text-zinc-500" />
                                            {hotel.contact_phone}
                                        </span>
                                    ) : (
                                        <span className="text-zinc-600">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    {hotel.pickup_points ? (
                                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 text-zinc-400 rounded-full text-sm font-medium">
                                            <MapPin size={14} className="shrink-0 text-zinc-500" />
                                            {hotel.pickup_points.name}
                                        </span>
                                    ) : (
                                        <span className="text-red-400 text-xs italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 align-middle border-l border-white/10">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(hotel);
                                            }}
                                            className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(hotel);
                                            }}
                                            className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
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
                        <div key={hotel.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                                <h3 className="text-lg font-bold text-white leading-tight">
                                    {hotel.name}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(hotel)}
                                        className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(hotel)}
                                        className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body Grid */}
                            <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-sm">
                                <div className="text-zinc-500">Contact</div>
                                <div>
                                    {hotel.contact_phone ? (
                                        <span className="flex items-center gap-2 text-white">
                                            <Phone size={14} className="text-zinc-500" />
                                            {hotel.contact_phone}
                                        </span>
                                    ) : (
                                        <span className="text-zinc-600">-</span>
                                    )}
                                </div>

                                <div className="text-zinc-500">Pickup Point</div>
                                <div>
                                    {hotel.pickup_points ? (
                                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 text-zinc-400 rounded-full text-sm font-medium">
                                            <MapPin size={14} />
                                            {hotel.pickup_points.name}
                                        </span>
                                    ) : (
                                        <span className="text-red-400 text-xs italic">Unassigned</span>
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
