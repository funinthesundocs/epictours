"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Bus, Plus } from "lucide-react";

const PLACEHOLDER_VEHICLES = [
    { id: 1, name: "Van 1", capacity: 14, plate: "ABC-123", status: "Active" },
    { id: 2, name: "Bus A", capacity: 25, plate: "BUS-999", status: "Maintenance" },
    { id: 3, name: "VIP SUV", capacity: 6, plate: "VIP-001", status: "Active" },
];

export default function VehiclesPage() {
    return (
        <PageShell
            title="Fleet Management"
            description="Manage your vehicles, capacity, and maintenance status."
            icon={Bus}
            action={
                <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm transition-colors">
                    <Plus size={16} />
                    Add Vehicle
                </button>
            }
        >
            <div className="bg-[#0b1115] border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black/20 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                        <tr>
                            <th className="px-6 py-4">Vehicle Name</th>
                            <th className="px-6 py-4">Capacity</th>
                            <th className="px-6 py-4">Plate Number</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                        {PLACEHOLDER_VEHICLES.map((vehicle) => (
                            <tr key={vehicle.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">{vehicle.name}</td>
                                <td className="px-6 py-4">{vehicle.capacity} pax</td>
                                <td className="px-6 py-4 font-mono text-cyan-400">{vehicle.plate}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                        ${vehicle.status === 'Active'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }
                                    `}>
                                        {vehicle.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </PageShell>
    );
}
