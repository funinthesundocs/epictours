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
        if (!confirm("Are you sure you want to delete this profile? This cannot be undone.")) return;

        try {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) throw error;

            // Optimistic Update or Refresh
            setData(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            alert("Error deleting customer: " + err.message);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Customers</h1>
                    <p className="text-zinc-400 text-sm">Manage your relationships and leads.</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search Bar */}
                    <div className="hidden md:flex items-center px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-zinc-400 w-64 focus-within:border-cyan-500/50 transition-colors">
                        <Search size={16} className="mr-2" />
                        <input type="text" placeholder="Search customers..." className="bg-transparent outline-none w-full placeholder:text-zinc-600" />
                    </div>

                    <button className="p-2 border border-white/10 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
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
                <CustomerTable
                    data={data}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
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
