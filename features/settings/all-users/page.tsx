"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { PageShell } from "@/components/shell/page-shell";
import { Users, Search, Filter, Shield } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { supabase } from "@/lib/supabase";
import { AllUsersTable, UnifiedUser } from "./components/all-users-table";
import { LoadingState } from "@/components/ui/loading-state";

export default function AllUsersPage() {
    const { effectiveOrganizationId } = useAuth();
    const [data, setData] = useState<UnifiedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<'all' | 'staff' | 'customer' | 'vendor'>('all');

    const fetchAllUsers = useCallback(async () => {
        if (!effectiveOrganizationId) return;

        setIsLoading(true);
        console.log("Fetching all users for Org:", effectiveOrganizationId);

        try {
            // 1. Fetch Staff (Organization Users)
            const { data: staffData, error: staffError } = await supabase
                .from('organization_users')
                .select(`
                    id,
                    is_organization_owner,
                    user:users(id, name, email, phone_number),
                    position:staff_positions(name)
                `)
                .eq('organization_id', effectiveOrganizationId);

            console.log("Staff Fetch:", { length: staffData?.length, error: staffError, sample: staffData?.[0] });

            // 2. Fetch Customers
            const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .select('*, user:users(name, email, phone_number)')
                .eq('organization_id', effectiveOrganizationId);

            console.log("Customer Fetch:", { length: customerData?.length, error: customerError, sample: customerData?.[0] });

            // 3. Fetch Vendors
            // Use '*' to be safe against missing columns.
            // AND fetch CONTACT PERSON info from linked users table (user:users)
            // Added contact_name to select implicitly via *
            const { data: vendorData, error: vendorError } = await supabase
                .from('vendors' as any)
                .select('id, name, email, phone, contact_name, organization_id, user:users(name, email, phone_number)')
                .eq('organization_id', effectiveOrganizationId);

            console.log("Vendor Fetch:", { length: vendorData?.length, error: vendorError, sample: vendorData?.[0] });

            // Note: If vendors table doesn't exist or has different schema, this might need adjustment.
            // Failing gracefully for vendors if table issue.
            const safeVendorData = vendorError ? [] : vendorData;

            // Normalize Data
            const normalizedStaff: UnifiedUser[] = (staffData || [])
                .filter((s: any) => s.position || s.is_organization_owner)
                .map((s: any) => ({
                    id: s.id,
                    name: s.user?.name || "Unknown",
                    email: s.user?.email || "",
                    phone: s.user?.phone_number || "",
                    type: 'staff',
                    roles: s.position?.name ? [s.position.name] : (s.is_organization_owner ? ['Owner'] : []),
                    meta: {}
                }));

            const normalizedCustomers: UnifiedUser[] = (customerData || []).map((c: any) => ({
                id: c.id,
                name: c.name || c.user?.name || "Unknown",
                email: c.email || c.user?.email || "",
                phone: c.phone || c.user?.phone_number || "",
                type: 'customer',
                roles: [],
                meta: {}
            }));

            const normalizedVendors: UnifiedUser[] = (safeVendorData || []).map((v: any) => ({
                id: v.id,
                // Check if 'name' exists on vendor record, otherwise fallback to user name
                // Note: v.name might be undefined if column doesn't exist, but 'select(*)' handles that.
                name: v.name || v.contact_name || v.user?.name || "Unknown Vendor",
                email: v.email || v.user?.email || "",
                phone: v.phone || v.user?.phone_number || "",
                type: 'vendor',
                roles: [],
                meta: {
                    // Start with explicit contact_name, fallback to linked user name
                    contactPerson: v.contact_name || v.user?.name
                }
            }));

            // Deduplication
            const combinedMap = new Map<string, UnifiedUser>();

            const addToMap = (users: UnifiedUser[]) => {
                users.forEach(u => {
                    const key = u.email ? u.email.toLowerCase().trim() : `id:${u.id}`;
                    if (!combinedMap.has(key)) {
                        combinedMap.set(key, u);
                    }
                });
            };

            addToMap(normalizedStaff);
            addToMap(normalizedCustomers);
            addToMap(normalizedVendors);

            const combined = Array.from(combinedMap.values());
            console.log("Combined Data:", combined.length);
            setData(combined);

        } catch (error) {
            console.error("Critical error in fetchAllUsers:", error);
        } finally {
            setIsLoading(false);
        }
    }, [effectiveOrganizationId]);

    useEffect(() => {
        fetchAllUsers();
    }, [fetchAllUsers]);

    const filteredData = useMemo(() => {
        let result = data;

        // Type Filter
        if (typeFilter !== 'all') {
            result = result.filter(u => u.type === typeFilter);
        }

        // Search Filter
        const q = searchQuery.toLowerCase().trim();
        result = result.filter(u => {
            const nameMatch = (u.name || "").toLowerCase().includes(q);
            const emailMatch = (u.email || "").toLowerCase().includes(q);

            // Phone check: specific match on digits
            const phoneClean = (u.phone || "").replace(/\D/g, "");
            const qClean = q.replace(/\D/g, "");
            const phoneMatch = qClean.length > 0 && phoneClean.includes(qClean);

            const contactMatch = (u.meta?.contactPerson || "").toLowerCase().includes(q);
            const roleMatch = (u.roles || []).some(r => (r || "").toLowerCase().includes(q));
            // User Type Match
            const typeMatch = (u.type || "").toLowerCase().includes(q);

            return nameMatch || emailMatch || phoneMatch || contactMatch || roleMatch || typeMatch;
        });

        return result;
    }, [data, searchQuery, typeFilter]);

    return (
        <PageShell
            title="All Users"
            description=" comprehensive view of all people associated with your organization."
            icon={Users}
            stats={[
                { label: "Total Users", value: data.length.toString(), icon: Users },
                { label: "Staff", value: data.filter(u => u.type === 'staff').length.toString(), icon: Shield },
                { label: "Customers", value: data.filter(u => u.type === 'customer').length.toString(), icon: Users },
            ]}
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Toolbar */}
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-center shrink-0">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary/50 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="flex items-center w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border">
                            {(['all', 'staff', 'customer', 'vendor'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={cn(
                                        "px-4 py-1.5 text-sm font-medium transition-colors capitalize whitespace-nowrap rounded-md",
                                        typeFilter === t
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                    {isLoading ? (
                        <LoadingState message="Aggregating user data..." />
                    ) : (
                        <AllUsersTable data={filteredData} />
                    )}
                </div>
            </div>
        </PageShell>
    );
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}
