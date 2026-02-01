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

import { LoadingState } from "@/components/ui/loading-state";

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
                .select('*, user:users(name, email, phone_number)', { count: 'exact' });

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
                // Flatten user data for compatibility
                const flattenedData = (customers as any[]).map(c => ({
                    ...c,
                    name: c.user?.name || c.name,
                    email: c.user?.email || c.email,
                    phone: c.user?.phone_number || c.phone
                }));
                setData(flattenedData as unknown as Customer[]);
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
        <div
            className="flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
        >
            {/* Header */}
            <div className="flex flex-col space-y-4 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Users size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Customers</h1>
                            <p className="text-muted-foreground text-sm">Manage your relationships and leads.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                        <button
                            onClick={handleAddNew}
                            className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(var(--color-primary),0.3)] flex items-center gap-2"
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
            {error ? (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20">
                    <AlertCircle size={20} />
                    {error}
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                    {isLoading && data.length === 0 ? (
                        <LoadingState message="Loading customers..." className="h-full" />
                    ) : (
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
                    )}
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
