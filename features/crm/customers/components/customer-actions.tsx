"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Customer } from "../types";

interface CustomerActionsProps {
    customer: Customer;
    onEdit: (customer: Customer) => void;
    onDelete: (id: string) => void;
}

export function CustomerActions({ customer, onEdit, onDelete }: CustomerActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleEdit = () => {
        setIsOpen(false);
        onEdit(customer);
    };

    const handleDelete = () => {
        setIsOpen(false);
        onDelete(customer.id!);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"
            >
                <MoreHorizontal size={18} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0b1115] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                        <button
                            onClick={handleEdit}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-md transition-colors text-left"
                        >
                            <Edit size={14} />
                            Edit Profile
                        </button>
                        <button
                            onClick={handleDelete}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors text-left"
                        >
                            <Trash2 size={14} />
                            Delete Profile
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
