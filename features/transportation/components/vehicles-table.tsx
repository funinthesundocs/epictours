"use client";

import { useState } from "react";
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Bus, AlertCircle, CheckCircle2 } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface Vehicle {
    id: string;
    name: string;
    capacity: number;
    license_requirement: string;
    miles_per_gallon: number;
    plate_number: string;
    vin_number: string;
    dot_number: string;
    rate_per_hour: number;
    fixed_rate: number;
    per_pax_rate: number;
    status: string;
    vendor?: { name: string } | null; // Joined vendor data
}

interface VehiclesTableProps {
    data: Vehicle[];
    onEdit: (vehicle: Vehicle) => void;
    onDelete: (id: string) => void;
}

type SortConfig = {
    key: keyof Vehicle | 'vendor'; // Allow sorting by flattened vendor name
    direction: 'asc' | 'desc';
} | null;

export function VehiclesTable({ data, onEdit, onDelete }: VehiclesTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [deletingItem, setDeletingItem] = useState<Vehicle | null>(null);

    const handleSort = (key: keyof Vehicle) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;

        // Handle nested vendor sort
        let valA: any = a[sortConfig.key as keyof Vehicle];
        let valB: any = b[sortConfig.key as keyof Vehicle];

        if (sortConfig.key === 'vendor') {
            valA = a.vendor?.name || '';
            valB = b.vendor?.name || '';
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown size={12} className="opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />;
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'maintenance': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            case 'retired': return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
            default: return 'text-zinc-400';
        }
    };

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/10">
                No vehicles found.
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto relative">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-zinc-900/80 backdrop-blur-sm text-white text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                        <tr>
                            {[
                                { key: 'name', label: 'Vehicle Name' },
                                { key: 'vendor', label: 'Vendor' },
                                { key: 'capacity', label: 'Cap' },
                                { key: 'license_requirement', label: 'License' },
                                { key: 'plate_number', label: 'Plate' },
                                { key: 'miles_per_gallon', label: 'MPG' },
                            ].map((col) => (
                                <th
                                    key={col.key}
                                    className="px-6 py-4 cursor-pointer hover:bg-[#0b1115] transition-colors select-none"
                                    onClick={() => handleSort(col.key as keyof Vehicle)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.label}
                                        <SortIcon column={col.key as keyof Vehicle} />
                                    </div>
                                </th>
                            ))}
                            <th className="px-6 py-4">Rates</th>
                            <th
                                className="px-6 py-4 cursor-pointer hover:bg-[#0b1115] transition-colors select-none"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-2">
                                    Status
                                    <SortIcon column="status" />
                                </div>
                            </th>
                            <th className="px-6 py-4 w-[100px] border-l border-white/10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                        {sortedData.map((v) => (
                            <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-medium text-white align-middle">
                                    {v.name}
                                </td>
                                <td className="px-6 py-4 text-zinc-400 align-middle">
                                    {v.vendor?.name || <span className="text-zinc-600 italic">Internal</span>}
                                </td>
                                <td className="px-6 py-4 text-zinc-400 align-middle">{v.capacity}</td>
                                <td className="px-6 py-4 text-zinc-400 align-middle">{v.license_requirement}</td>
                                <td className="px-6 py-4 text-zinc-400 align-middle">{v.plate_number}</td>
                                <td className="px-6 py-4 text-zinc-400 align-middle">{v.miles_per_gallon}</td>
                                <td className="px-6 py-4 align-middle">
                                    <div className="grid grid-cols-[70px_1fr] gap-x-2 gap-y-1.5 items-center">
                                        {v.rate_per_hour > 0 && (
                                            <>
                                                <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Hourly</span>
                                                <span className="font-mono text-white text-sm">{formatCurrency(v.rate_per_hour)}</span>
                                            </>
                                        )}
                                        {v.fixed_rate > 0 && (
                                            <>
                                                <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Fixed</span>
                                                <span className="font-mono text-white text-sm">{formatCurrency(v.fixed_rate)}</span>
                                            </>
                                        )}
                                        {v.per_pax_rate > 0 && (
                                            <>
                                                <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Per PAX</span>
                                                <span className="font-mono text-white text-sm">{formatCurrency(v.per_pax_rate)}</span>
                                            </>
                                        )}
                                        {!v.rate_per_hour && !v.fixed_rate && !v.per_pax_rate && (
                                            <span className="text-zinc-600 italic col-span-2">-</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(v.status)} uppercase font-bold tracking-wide`}>
                                        {v.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle border-l border-white/10">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(v);
                                            }}
                                            className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(v);
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
                    {sortedData.map((v) => (
                        <div key={v.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                                <h3 className="text-lg font-bold text-white leading-tight">
                                    {v.name}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(v)}
                                        className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(v)}
                                        className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body Grid */}
                            <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-sm">
                                <div className="text-zinc-500">Status</div>
                                <div>
                                    <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(v.status)} uppercase font-bold tracking-wide`}>
                                        {v.status}
                                    </span>
                                </div>

                                <div className="text-zinc-500">Vendor</div>
                                <div className="text-white">
                                    {v.vendor?.name || <span className="text-zinc-600 italic">Internal</span>}
                                </div>

                                <div className="text-zinc-500">Capacity</div>
                                <div className="text-white">{v.capacity}</div>

                                <div className="text-zinc-500">License</div>
                                <div className="text-zinc-400 text-xs">{v.license_requirement}</div>

                                <div className="text-zinc-500">Plate</div>
                                <div className="text-white font-mono text-xs">{v.plate_number}</div>

                                <div className="text-zinc-500">MPG</div>
                                <div className="text-white">{v.miles_per_gallon}</div>

                                <div className="text-zinc-500">Rates</div>
                                <div className="grid grid-cols-[70px_1fr] gap-x-2 gap-y-1.5 items-center">
                                    {v.rate_per_hour > 0 && (
                                        <>
                                            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Hourly</span>
                                            <span className="font-mono text-white text-sm">{formatCurrency(v.rate_per_hour)}</span>
                                        </>
                                    )}
                                    {v.fixed_rate > 0 && (
                                        <>
                                            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Fixed</span>
                                            <span className="font-mono text-white text-sm">{formatCurrency(v.fixed_rate)}</span>
                                        </>
                                    )}
                                    {v.per_pax_rate > 0 && (
                                        <>
                                            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Per PAX</span>
                                            <span className="font-mono text-white text-sm">{formatCurrency(v.per_pax_rate)}</span>
                                        </>
                                    )}
                                    {!v.rate_per_hour && !v.fixed_rate && !v.per_pax_rate && (
                                        <span className="text-zinc-600 italic col-span-2">-</span>
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
                title="Delete Vehicle?"
                description={`Are you sure you want to remove "${deletingItem?.name}"? This action cannot be undone.`}
                confirmLabel="Delete Vehicle"
                isDestructive={true}
            />
        </>
    );
}
