"use client";

import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, MapPin, Phone, Mail, User, Shield, UserCog, Briefcase, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UnifiedUser {
    id: string; // Unique ID (could be from staff, customer, or vendor table)
    name: string;
    email: string;
    phone: string;
    type: 'staff' | 'customer' | 'vendor';
    roles?: string[]; // For staff (Position Name)
    meta?: any; // Extra data like customer preferences or vendor details
}

interface AllUsersTableProps {
    data: UnifiedUser[];
}

type SortConfig = {
    key: keyof UnifiedUser;
    direction: 'asc' | 'desc';
} | null;

export function AllUsersTable({ data }: AllUsersTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

    const formatPhoneNumber = (str: string | null | undefined) => {
        if (!str) return "—";
        const cleaned = str.replace(/\D/g, "");
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return str;
    };

    const handleSort = (key: keyof UnifiedUser) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;
        const valA = a[sortConfig.key] || "";
        const valB = b[sortConfig.key] || "";

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ column }: { column: keyof UnifiedUser }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown size={12} className="opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />;
    };

    const getTypeBadge = (user: UnifiedUser) => {
        const type = user.type;
        let badge;

        switch (type) {
            case 'staff':
                badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"><Shield size={10} /> Staff</span>;
                break;
            case 'vendor':
                badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Briefcase size={10} /> Vendor</span>;
                break;
            case 'customer':
                badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><ShoppingBag size={10} /> Customer</span>;
                break;
            default:
                badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{type}</span>;
        }

        return (
            <div className="flex flex-col items-start gap-1">
                {badge}
                {type === 'staff' && user.roles && user.roles.length > 0 && (
                    <span className="text-xs text-muted-foreground font-medium pl-1">
                        {user.roles.join(", ")}
                    </span>
                )}
                {type === 'vendor' && user.meta?.contactPerson && (
                    <span className="text-xs text-muted-foreground font-medium pl-1 flex items-center gap-1">
                        <User size={10} /> {user.meta.contactPerson}
                    </span>
                )}
            </div>
        );
    };

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                <UserCog size={48} className="mb-4 opacity-20" />
                <p>No users found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto relative rounded-md border border-border">
            <table className="w-full text-left hidden md:table">
                <thead className="bg-muted/50 backdrop-blur-sm text-foreground text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-border">
                    <tr>
                        <th className="px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort('name')}>
                            <div className="flex items-center gap-2">Name <SortIcon column="name" /></div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort('email')}>
                            <div className="flex items-center gap-2">Email <SortIcon column="email" /></div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort('phone')}>
                            <div className="flex items-center gap-2">Phone <SortIcon column="phone" /></div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort('type')}>
                            <div className="flex items-center gap-2">User Type <SortIcon column="type" /></div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted-foreground">
                    {sortedData.map((user) => (
                        <tr key={`${user.type}-${user.id}`} className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 align-middle font-medium text-foreground">
                                {user.name}
                            </td>
                            <td className="px-6 py-4 align-middle">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Mail size={14} className="shrink-0 text-muted-foreground" />
                                    {user.email || "—"}
                                </span>
                            </td>
                            <td className="px-6 py-4 align-middle">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Phone size={14} className="shrink-0 text-muted-foreground" />
                                    {formatPhoneNumber(user.phone)}
                                </span>
                            </td>
                            <td className="px-6 py-4 align-middle">
                                {getTypeBadge(user)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
                {sortedData.map((user) => (
                    <div key={`${user.type}-${user.id}`} className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-foreground text-lg">{user.name}</h3>
                            {getTypeBadge(user)}
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail size={14} /> {user.email || "—"}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone size={14} /> {formatPhoneNumber(user.phone)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
