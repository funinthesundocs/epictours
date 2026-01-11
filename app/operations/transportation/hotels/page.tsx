"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Building2, Plus, Phone, MapPin } from "lucide-react";

const PLACEHOLDER_HOTELS = [
    { id: 1, name: "Sheraton Waikiki", phone: "808-922-4422", pickup: "Sheraton Waikiki Bus Depot" },
    { id: 2, name: "Hilton Hawaiian Village", phone: "808-949-4321", pickup: "Grand Islander Bus Stop" },
    { id: 3, name: "Halekulani", phone: "808-923-2311", pickup: "Sheraton Waikiki Bus Depot" },
    { id: 4, name: "Hyatt Regency", phone: "808-923-1234", pickup: "Duke Kahanamoku Statue" },
];

export default function HotelListPage() {
    return (
        <PageShell
            title="Hotel Directory"
            description="Manage hotel partners and assign them to specific pickup points."
            icon={Building2}
            action={
                <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm transition-colors">
                    <Plus size={16} />
                    Add Hotel
                </button>
            }
        >
            <div className="bg-[#0b1115] border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black/20 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                        <tr>
                            <th className="px-6 py-4">Hotel Name</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Assigned Pickup Point</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                        {PLACEHOLDER_HOTELS.map((hotel) => (
                            <tr key={hotel.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                        <Building2 size={16} />
                                    </div>
                                    {hotel.name}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Phone size={14} />
                                        {hotel.phone}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-lg w-fit border border-emerald-500/10">
                                        <MapPin size={14} />
                                        {hotel.pickup}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </PageShell>
    );
}
