"use client";

import { Customer } from "../types";
import { StatusBadge } from "./status-badge";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function CustomerTable({ data }: { data: Customer[] }) {
    return (
        <div className="w-full overflow-hidden rounded-xl glass-card border border-white/5">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-zinc-400 uppercase text-xs font-semibold sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Total Value</th>
                            <th className="px-6 py-4">Last Active</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((customer) => (
                            <tr
                                key={customer.id}
                                className="group hover:bg-cyan-500/5 transition-colors duration-200 cursor-pointer"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                                            {customer.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                                                {customer.name}
                                            </div>
                                            <div className="text-xs text-zinc-500">{customer.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={customer.status} />
                                </td>
                                <td className="px-6 py-4 text-white font-mono">
                                    ${customer.total_value.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-zinc-400">
                                    {new Date(customer.last_active).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
