"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Settings } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { PageShell } from "@/components/shell/page-shell";
import { toast } from "sonner"; // Using sonner as verified

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomFieldsTable } from "@/features/settings/custom-fields/components/custom-fields-table";
import { EditCustomFieldSheet } from "@/features/settings/custom-fields/components/edit-custom-field-sheet";
import { cn } from "@/lib/utils";

// Supabase Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CustomFieldsPage() {
    const [fields, setFields] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingField, setEditingField] = useState<any | null>(null);

    const fetchFields = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("custom_field_definitions")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching custom fields:", error);
            toast.error("Failed to load custom fields");
        } else {
            setFields(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchFields();
    }, []);

    const handleCreate = () => {
        setEditingField(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (field: any) => {
        setEditingField(field);
        setIsSheetOpen(true);
    };

    const handleDuplicate = async (field: any) => {
        const confirm = window.confirm(`Duplicate "${field.label}"?`);
        if (!confirm) return;

        const { id, created_at, updated_at, ...rest } = field;
        const newName = `${rest.name}_copy_${Date.now()}`; // Ensure unique name
        const newLabel = `${rest.label} (Copy)`;

        const { error } = await supabase
            .from("custom_field_definitions")
            .insert([{
                ...rest,
                name: newName,
                label: newLabel
            }]);

        if (error) {
            toast.error("Failed to duplicate field");
        } else {
            toast.success("Field duplicated");
            fetchFields();
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from("custom_field_definitions")
            .delete()
            .eq("id", id);

        if (error) {
            toast.error("Failed to delete field");
        } else {
            toast.success("Field deleted");
            fetchFields();
        }
    };

    const [activeFilter, setActiveFilter] = useState("all");

    // Filter Categories
    const FILTER_TABS = [
        { id: "all", label: "All" },
        { id: "text", label: "Text Input", types: ["text", "textarea"] },
        { id: "dropdown", label: "Drop Down", types: ["select", "quantity"] },
        { id: "checkbox", label: "Checkbox", types: ["checkbox"] },
        { id: "calendar", label: "Calendar", types: ["date"] }
    ];

    const filteredFields = fields.filter(field => {
        // 1. Search Query Logic (Name, Label, Type, or Visibility)
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            field.label.toLowerCase().includes(q) ||
            field.name.toLowerCase().includes(q) ||
            field.type.toLowerCase().includes(q) ||
            (field.is_internal ? "internal" : "public").includes(q);

        if (!matchesSearch) return false;

        // 2. Quick Filter Logic
        if (activeFilter === "all") return true;

        const currentTab = FILTER_TABS.find(t => t.id === activeFilter);
        if (currentTab && currentTab.types) {
            return currentTab.types.includes(field.type);
        }
        return false;
    });

    return (
        <PageShell
            title="Custom Fields"
            description="Manage custom data types for your organization."
            icon={Settings}
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
            action={
                <Button
                    onClick={handleCreate}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" /> New Custom Field
                </Button>
            }
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Toolbar */}
                <div className="flex flex-col gap-4 shrink-0">
                    {/* Search */}
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, type, or visibility..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
                            Loading fields...
                        </div>
                    ) : (
                        <CustomFieldsTable
                            data={filteredFields}
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                            onEdit={handleEdit}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </div>

            {/* Edit Sheet */}
            <EditCustomFieldSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchFields}
                fieldToEdit={editingField}
            />
        </PageShell>
    );
}
