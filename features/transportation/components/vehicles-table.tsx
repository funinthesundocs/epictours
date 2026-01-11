"use client";

import { useState } from "react";
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Bus, AlertCircle, CheckCircle2 } from "lucide-react";

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
    status: string;
}

interface VehiclesTableProps {
    data: Vehicle[];
    onEdit: (vehicle: Vehicle) => void;
    onDelete: (id: string) => void;
}

type SortConfig = {
    key: keyof Vehicle;
    direction: 'asc' | 'desc';
} | null;

export function VehiclesTable({ data, onEdit, onDelete }: VehiclesTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);

    const handleSort = (key: keyof Vehicle) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ column }: { column: keyof Vehicle }) => {
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
        <div className="bg-[#0b1115] border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-left min-w-[1200px]">
                <thead className="bg-black/20 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                        {[
                            { key: 'name', label: 'Vehicle Name' },
                            { key: 'capacity', label: 'Cap' },
                            { key: 'license_requirement', label: 'License' },
                            { key: 'plate_number', label: 'Plate' },
                            { key: 'miles_per_gallon', label: 'MPG' },
                            { key: 'vin_number', label: 'VIN' },
                            { key: 'dot_number', label: 'DOT' },
                            { key: 'rate_per_hour', label: 'Hourly' },
                            { key: 'fixed_rate', label: 'Fixed' },
                            { key: 'status', label: 'Status' },
                        ].map((col) => (
                            <th
                                key={col.key}
                                className="px-4 py-4 cursor-pointer hover:bg-white/5 transition-colors select-none"
                                onClick={() => handleSort(col.key as keyof Vehicle)}
                            >
                                <div className="flex items-center gap-2">
                                    {col.label}
                                    <SortIcon column={col.key as keyof Vehicle} />
                                </div>
                            </th>
                        ))}
                        <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                    {sortedData.map((v) => (
                        <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-4 py-4 font-medium text-white flex items-center gap-2">
                                <Bus size={14} className="text-indigo-400" />
                                {v.name}
                            </td>
                            <td className="px-4 py-4">{v.capacity}</td>
                            <td className="px-4 py-4 text-xs text-zinc-400">{v.license_requirement}</td>
                            <td className="px-4 py-4 font-mono text-xs">{v.plate_number}</td>
                            <td className="px-4 py-4">{v.miles_per_gallon}</td>
                            <td className="px-4 py-4 font-mono text-xs text-zinc-500">{v.vin_number}</td>
                            <td className="px-4 py-4 font-mono text-xs text-zinc-500">{v.dot_number}</td>
                            <td className="px-4 py-4 font-mono">{formatCurrency(v.rate_per_hour)}</td>
                            <td className="px-4 py-4 font-mono">{formatCurrency(v.fixed_rate)}</td>
                            <td className="px-4 py-4">
                                <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(v.status)} uppercase font-bold tracking-wide`}>
                                    {v.status}
                                </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => onEdit(v)}
                                        className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete ${v.name}?`)) onDelete(v.id);
                                        }}
                                        className="p-1.5 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors z-10 relative"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
