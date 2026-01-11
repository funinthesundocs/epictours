import { mockCustomers } from "./mock-data";
import { CustomerTable } from "./components/customer-table";
import { Plus, Search, Filter } from "lucide-react";

export function CustomersPage() {
    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Customers</h1>
                    <p className="text-zinc-400 text-sm">Manage your relationships and leads.</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search Bar - Placeholder */}
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

            {/* Stats - Quick View */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Customers", value: "2,543" },
                    { label: "Active Leads", value: "128", highlight: true },
                    { label: "New this Month", value: "+45" },
                    { label: "Retention Rate", value: "98.2%" },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-4 rounded-lg">
                        <p className="text-xs text-zinc-500 uppercase font-semibold">{stat.label}</p>
                        <p className={`text-xl font-bold mt-1 ${stat.highlight ? "text-cyan-400" : "text-white"}`}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Main Table */}
            <CustomerTable data={mockCustomers} />
        </div>
    );
}
