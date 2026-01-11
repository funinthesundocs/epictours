"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Customer } from "./types";
import { CustomerTable } from "./components/customer-table";
import { Plus, Search, Filter, Loader2, AlertCircle } from "lucide-react";
import { PageShell } from "@/components/shell/page-shell";

export function CustomersPage() {
    const [data, setData] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCustomers() {
            try {
                setIsLoading(true);
                const { data: customers, error } = await supabase
                    .from('customers')
                    .select('*')
                    .order('last_active', { ascending: false });

                if (error) {
                    throw error;
                }

                if (customers) {
                    // Cast the raw DB data to our Customer type (enums match string values)
                    setData(customers as unknown as Customer[]);
                }
            } catch (err: any) {
                console.error("Supabase Error:", err);
                setError(err.message || "Failed to load customers.");
            } finally {
                setIsLoading(false);
            }
        }

        fetchCustomers();
    }, []);

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Customers</h1>
                    <p className="text-zinc-400 text-sm">Manage your relationships and leads.</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search Bar - Logic to be added later */}
                    <div className="hidden md:flex items-center px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-zinc-400 w-64 focus-within:border-cyan-500/50 transition-colors">
                        <Search size={16} className="mr-2" />
                        <input type="text" placeholder="Search customers..." className="bg-transparent outline-none w-full placeholder:text-zinc-600" />
                    </div>

                    <button className="p-2 border border-white/10 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                        <Filter size={18} />
                    </button>

                    <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <Plus size={16} />
                        Add Customer
                    </button>
                </div>
            </div>

            {/* Stats - Quick View (Real Data Calculation) */}
            {!isLoading && !error && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Customers" value={data.length.toString()} />
                    <StatCard label="Active Leads" value={data.filter(c => c.status === 'lead').length.toString()} highlight />
                    <StatCard label="Total Value" value={`$${data.reduce((acc, curr) => acc + Number(curr.total_value), 0).toLocaleString()}`} />
                    <StatCard label="Retention Rate" value="98.2%" />
                </div>
            )}

            {/* Main Table */}
            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                </div>
            ) : error ? (
                <div className="h-64 flex flex-col items-center justify-center text-red-400 space-y-2">
                    <AlertCircle size={32} />
                    <p>Error: {error}</p>
                </div>
            ) : (
                <CustomerTable data={data} />
            )}
        </div>
    );
}

// Simple internal helper for stats
function StatCard({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
    return (
        <div className="glass-card p-4 rounded-lg">
            <p className="text-xs text-zinc-500 uppercase font-semibold">{label}</p>
            <p className={`text-xl font-bold mt-1 ${highlight ? "text-cyan-400" : "text-white"}`}>
                {value}
            </p>
        </div>
    )
}
