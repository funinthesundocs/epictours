"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Customer } from "./types";
import { CustomerTable } from "./components/customer-table";
import { Search, Filter, Loader2, AlertCircle, Plus } from "lucide-react";
import { AddCustomerSheet } from "./components/add-customer-sheet";

export function CustomersPage() {
    const [data, setData] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

    const fetchCustomers = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data: customers, error } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (customers) {
                setData(customers as unknown as Customer[]);
            }
        } catch (err: any) {
            console.error("Supabase Error:", err);
            setError(err.message || "Failed to load customers.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({ key: "created_at", direction: "desc" });
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    // Derived Data (Client-Side Sort & Filter)
    const filteredAndSortedData = data.filter(customer => {
        // 1. Search (Broad Match)
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            customer.name.toLowerCase().includes(q) ||
            customer.email.toLowerCase().includes(q) ||
            (customer.phone?.toLowerCase().includes(q) ?? false) ||
            (customer.metadata?.hotel?.toLowerCase().includes(q) ?? false);

        // 2. Status Filter
        const matchesStatus = statusFilter === "all" || customer.status === statusFilter;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;

        // Helper to extract value safely including nested JSONB
        const getValue = (obj: Customer, path: string) => {
            if (path === "hotel") return obj.metadata?.hotel || "";
            if (path === "app") return obj.preferences?.preferred_messaging_app || "";
            if (path === "source") return obj.metadata?.source || "";
            // @ts-ignore - Dynamic access
            return obj[path] || "";
        };

        const valA = getValue(a, key);
        const valB = getValue(b, key);

        if (valA < valB) return direction === "asc" ? -1 : 1;
        if (valA > valB) return direction === "asc" ? 1 : -1;
        return 0;
    });

    // Pagination Logic (Post-Filter/Sort)
    const totalItems = filteredAndSortedData.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage);

    // Reset pagination when data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, rowsPerPage]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === "asc" ? "desc" : "asc"
        }));
    };

    // CRUD Handlers
    const handleAddNew = () => {
        setEditingCustomer(undefined);
        setIsSheetOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        // NOTE: Confirmation is handled by the Table's AlertDialog.
        // We strictly execute the API call here.
        try {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) throw error;

            // Optimistic Update
            setData(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            alert("Error deleting customer: " + err.message);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Customers</h1>
                        <p className="text-zinc-400 text-sm">Manage your relationships and leads.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Rows Per Page Selector */}
                        <div className="hidden md:flex items-center bg-black/20 border border-white/10 rounded-lg px-2">
                            <span className="text-xs text-zinc-500 mr-2 whitespace-nowrap">Rows:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                className="bg-transparent border-none text-xs text-zinc-300 focus:ring-0 cursor-pointer py-2 pl-0 pr-6 outline-none"
                            >
                                <option value={50} className="text-black bg-white">50</option>
                                <option value={100} className="text-black bg-white">100</option>
                                <option value={150} className="text-black bg-white">150</option>
                                <option value={200} className="text-black bg-white">200</option>
                            </select>
                        </div>

                        {/* Search Bar */}
                        <div className="hidden md:flex items-center px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-zinc-400 w-64 focus-within:border-cyan-500/50 transition-colors">
                            <Search size={16} className="mr-2" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                className="bg-transparent outline-none w-full placeholder:text-zinc-600"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 border rounded-lg transition-colors ${showFilters ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'border-white/10 hover:bg-white/5 text-zinc-400'}`}
                        >
                            <Filter size={18} />
                        </button>

                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        >
                            <Plus size={16} />
                            Add Customer
                        </button>
                    </div>
                </div>

                {/* Filter Bar (Conditional) */}
                {showFilters && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded focus:border-cyan-500/50 text-sm px-2 py-1 text-white block"
                            >
                                <option value="all">All Statuses</option>
                                <option value="lead">Lead</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        {/* Add more filters here later if needed */}
                        <div className="ml-auto">
                            <button
                                onClick={() => { setStatusFilter("all"); setSearchQuery(""); }}
                                className="text-xs text-zinc-400 hover:text-white underline"
                            >
                                Reset Search & Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-zinc-500 gap-2">
                    <Loader2 size={24} className="animate-spin" />
                    Loading...
                </div>
            ) : error ? (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                    <AlertCircle size={20} />
                    {error}
                </div>
            ) : (
                <>
                    <CustomerTable
                        data={paginatedData}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        // @ts-ignore - We are about to update the table to accept these
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between px-2 pt-2 text-sm text-zinc-500 border-t border-white/10">
                        <div>
                            Showing <span className="text-white font-medium">{startIndex + 1}</span> to <span className="text-white font-medium">{Math.min(startIndex + rowsPerPage, totalItems)}</span> of <span className="text-white font-medium">{totalItems}</span> entries
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-white/10 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <div className="px-2">
                                Page <span className="text-white">{currentPage}</span> of <span className="text-white">{Math.max(1, totalPages)}</span>
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                                className="px-3 py-1 border border-white/10 rounded hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Sheet - Controlled by Page */}
            <AddCustomerSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onCustomerAdded={fetchCustomers}
                editingCustomer={editingCustomer}
            />
        </div>
    );
}
