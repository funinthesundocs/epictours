"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Customer } from "./types";
import { CustomerTable } from "./components/customer-table";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { AddCustomerSheet } from "./components/add-customer-sheet";
import { CustomerToolbar } from "./components/customer-toolbar";
import { CustomSelect } from "@/components/ui/custom-select";

export function CustomersPage() {
    const [data, setData] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);

    // Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [sourceFilter, setSourceFilter] = useState("");
    const [hotelFilter, setHotelFilter] = useState("");

    // Sort & Pagination State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({ key: "created_at", direction: "desc" });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

    // Debounce Ref
    const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

    const fetchCustomers = useCallback(async () => {
        try {
            setIsLoading(true);

            let query = supabase
                .from('customers')
                .select('*', { count: 'exact' });

            // 1. Text Search (Expanded to all requested fields)
            if (searchQuery) {
                // Sanitize input to prevent Supabase Parser errors (e.g. "failed to parse logic tree")
                // We strip special characters that might break the .or() syntax
                const q = searchQuery.replace(/[(),]/g, " ").trim();

                if (q) {
                    // ILIKE for Name, Email, Phone, Status, AP, and JSONB fields.
                    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,status.ilike.%${q}%,total_value.ilike.%${q}%,metadata->>hotel.ilike.%${q}%,metadata->>source.ilike.%${q}%,preferences->>preferred_messaging_app.ilike.%${q}%`);
                }
            }

            // 2. Filters (Status handled by Search now)

            // 3. Sorting
            if (sortConfig) {
                // Handle nested JSONB sorting manually? Supabase doesn't easily sort by JSON keys in .order().
                // For MVP, if sorting by JSON key, we might need a workaround or just sort the current page client side?
                // For Robustness: Let's accept that we only SERVER sort top-level fields (name, email, created_at, status).
                // If it's a JSON field, we might resort to client sort or RPC. 
                // Let's stick to simple sort for now.
                if (["name", "email", "created_at", "status", "total_value"].includes(sortConfig.key)) {
                    query = query.order(sortConfig.key, { ascending: sortConfig.direction === "asc" });
                } else {
                    // Default fallback
                    query = query.order('created_at', { ascending: false });
                }
            }

            // 4. Pagination
            const start = (currentPage - 1) * rowsPerPage;
            const end = start + rowsPerPage - 1;
            query = query.range(start, end);

            const { data: customers, count, error } = await query;

            if (error) throw error;

            if (customers) {
                // If we need to sort by JSON keys client-side (because Supabase .order can't easily do it without computed columns)
                // We can do a mini-sort here, but it only sorts the returned page.
                // For "Robust", let's trust the query order for now.
                setData(customers as unknown as Customer[]);
                setTotalItems(count || 0);
            }
        } catch (err: any) {
            console.error("Supabase Error:", err);
            setError(err.message || "Failed to load customers.");
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, sortConfig, currentPage, rowsPerPage]);

    // Effect: Trigger Fetch on changes (Debounced Search)
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(() => {
            fetchCustomers();
        }, 500); // 500ms debounce

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [fetchCustomers]);

    // Reset Page on Filter Change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, rowsPerPage]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === "asc" ? "desc" : "asc"
        }));
    };

    const handleReset = () => {
        setSearchQuery("");
        setCurrentPage(1);
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
        try {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) throw error;
            fetchCustomers(); // Re-fetch to update count and page
        } catch (err: any) {
            alert("Error deleting customer: " + err.message);
        }
    };

    const totalPages = Math.ceil(totalItems / rowsPerPage);

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Customers</h1>
                        <p className="text-zinc-400 text-sm">Manage your relationships and leads.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Rows Selector Aligned */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 whitespace-nowrap">Rows:</span>
                            <div className="w-20">
                                <CustomSelect
                                    value={rowsPerPage.toString()}
                                    onChange={(val) => setRowsPerPage(Number(val))}
                                    options={["50", "100", "150", "200"]}
                                    placeholder="50"
                                    className="h-10 py-1"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAddNew}
                            className="h-10 px-4 bg-primary hover:bg-cyan-300 text-primary-foreground font-semibold rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Customer
                        </button>
                    </div>
                </div>

                {/* New Toolbar */}
                <CustomerToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onReset={handleReset}
                />
            </div>

            {/* Content */}
            {isLoading && totalItems === 0 ? ( // Only show full loader on initial load
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
                    <div className={isLoading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                        <CustomerTable
                            data={data}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                        />
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between px-2 pt-2 text-sm text-zinc-500 border-t border-white/10">
                        <div>
                            Showing <span className="text-white font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="text-white font-medium">{Math.min(currentPage * rowsPerPage, totalItems)}</span> of <span className="text-white font-medium">{totalItems}</span> entries
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

            <AddCustomerSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onCustomerAdded={fetchCustomers}
                editingCustomer={editingCustomer}
            />
        </div>
    );
}
