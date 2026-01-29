"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Customer } from "./types";
import { CustomerTable } from "./components/customer-table";
import { Loader2, AlertCircle, Plus, Users } from "lucide-react";
import { AddCustomerSheet } from "./components/add-customer-sheet";
import { CustomerToolbar } from "./components/customer-toolbar";
import { useColumnVisibility } from "./components/column-picker";
import { cn } from "@/lib/utils";

const MAX_RECORDS = 10000; // Maximum records to fetch for virtual scrolling

export function CustomersPage() {
    const [data, setData] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);

    // Filter State
    const [searchQuery, setSearchQuery] = useState("");

    // Sort State (no pagination)
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({ key: "created_at", direction: "desc" });

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

    // Column Visibility
    const { visibleColumns, toggleColumn, resetToDefault } = useColumnVisibility();

    // Debounce Ref
    const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

    const fetchCustomers = useCallback(async () => {
        try {
            setIsLoading(true);

            let query = supabase
                .from('customers')
                .select('*', { count: 'exact' });

            // Text Search
            if (searchQuery) {
                const q = searchQuery.replace(/[(),]/g, " ").trim();
                if (q) {
                    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,status.ilike.%${q}%,total_value.ilike.%${q}%,metadata->>hotel.ilike.%${q}%,metadata->>source.ilike.%${q}%,preferences->>preferred_messaging_app.ilike.%${q}%`);
                }
            }

            // Sorting
            if (sortConfig) {
                if (["name", "email", "created_at", "status", "total_value"].includes(sortConfig.key)) {
                    query = query.order(sortConfig.key, { ascending: sortConfig.direction === "asc" });
                } else {
                    query = query.order('created_at', { ascending: false });
                }
            }

            // Limit for virtual scrolling (no pagination)
            query = query.limit(MAX_RECORDS);

            const { data: customers, count, error } = await query;

            if (error) throw error;

            if (customers) {
                setData(customers as unknown as Customer[]);
                setTotalItems(count || 0);
            }
        } catch (err: any) {
            console.error("Supabase Error:", err);
            setError(err.message || "Failed to load customers.");
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, sortConfig]);

    // Effect: Trigger Fetch on changes (Debounced Search)
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(() => {
            fetchCustomers();
        }, 500);

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [fetchCustomers]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === "asc" ? "desc" : "asc"
        }));
    };

    const handleReset = () => {
        setSearchQuery("");
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
            toast.success("Customer deleted");
            fetchCustomers();
        } catch (err: any) {
            alert("Error deleting customer: " + err.message);
        }
    };

    return (
        <div className="h-[calc(100dvh-2rem)] lg:h-[calc(100dvh-4rem)] flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col space-y-4 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 shrink-0">
                            <Users size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Customers</h1>
                            <p className="text-zinc-400 text-sm">Manage your relationships and leads.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                        <button
                            onClick={handleAddNew}
                            className="h-10 px-4 bg-cyan-400 hover:bg-cyan-300 text-white font-semibold rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Customer
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <CustomerToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onReset={handleReset}
                    visibleColumns={visibleColumns}
                    onToggleColumn={toggleColumn}
                    onResetColumns={resetToDefault}
                />
            </div>

            {/* Content */}
            {isLoading && data.length === 0 ? (
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
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-white/5 bg-[#09090b]">
                    <div className={cn("h-full", isLoading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity")}>
                        <CustomerTable
                            data={data}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                            visibleColumns={visibleColumns}
                        />
                    </div>
                </div>
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
