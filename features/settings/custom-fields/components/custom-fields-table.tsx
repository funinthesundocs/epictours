"use client";

import * as React from "react";

import { Edit2, Trash2, Search, Type, List, CheckSquare, Hash, Hotel, Heading, Copy, Lock, Globe, Calendar as CalendarIcon, ToggleLeft, ChevronDown, ListFilter, Ban, ChevronsUpDown, Minus, Plus, Eye } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface CustomField {
    id: string;
    name: string;
    label: string;
    type: string;
    description: string | null;
    is_internal: boolean;
    options: any;
}

export type FilterType = 'all' | 'text' | 'dropdown' | 'checkbox' | 'calendar';

interface CustomFieldsTableProps {
    data: CustomField[];
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    onEdit: (field: CustomField) => void;
    onDuplicate: (field: CustomField) => void;
    onDelete: (id: string) => void;
}

const TYPE_ICONS: Record<string, any> = {
    text: Type,
    textarea: Type,
    select: ChevronsUpDown,
    quantity: Type, // Consolidated under 'Text Field' in Edit Sheet
    checkbox: CheckSquare,
    transport: Hotel,
    header: Heading, // Matches Edit Sheet 'Section Header' icon
    date: CalendarIcon
};

// Filter Categories (Shared Definition)
const FILTER_OPTS = [
    { id: "all", label: "All Types" },
    { id: "text", label: "Text Input" },
    { id: "dropdown", label: "Drop Down" },
    { id: "checkbox", label: "Checkbox" },
    { id: "calendar", label: "Calendar" }
];

export function CustomFieldsTable({ data, activeFilter, onFilterChange, onEdit, onDuplicate, onDelete }: CustomFieldsTableProps) {
    const [expandedFields, setExpandedFields] = React.useState<Set<string>>(new Set());
    const [deleteId, setDeleteId] = React.useState<string | null>(null);

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedFields(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-card rounded-xl border border-border">
                <Search size={48} className="mb-4 opacity-20" />
                <p>No custom fields found.</p>
                {activeFilter !== 'all' && (
                    <Button variant="link" onClick={() => onFilterChange('all')} className="mt-2 text-primary">
                        Clear Filters
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto relative">
            <table className="w-full text-left hidden md:table">
                <thead className="bg-muted/80 backdrop-blur-sm text-foreground text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-border">
                    <tr>
                        <th className="px-6 py-4 font-medium w-[30%]">Field Name</th>
                        <th className="px-6 py-4 font-medium">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn(
                                        "flex items-center gap-2 hover:text-foreground transition-colors outline-none",
                                        activeFilter !== 'all' && "text-primary"
                                    )}>
                                        Type
                                        {activeFilter !== 'all' ? <ListFilter size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[180px] bg-popover border-border text-muted-foreground">
                                    <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-bold">Filter By Type</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-border" />
                                    {FILTER_OPTS.map((opt) => (
                                        <DropdownMenuItem
                                            key={opt.id}
                                            onClick={() => onFilterChange(opt.id)}
                                            className={cn(
                                                "text-xs focus:bg-muted focus:text-primary cursor-pointer",
                                                activeFilter === opt.id && "bg-muted text-primary"
                                            )}
                                        >
                                            {opt.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </th>
                        <th className="px-6 py-4 font-medium">Visibility</th>
                        <th className="px-6 py-4 font-medium w-[30%]">Field Preview</th>
                        <th className="px-6 py-4 font-medium w-[120px] border-l border-border"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted-foreground">
                    {data.map((field) => {
                        const Icon = TYPE_ICONS[field.type] || Type;

                        // Render Preview Content based on type
                        // Deep Core Aesthetic: bg-muted border-border rounded-lg px-4 py-3
                        const inputClasses = "w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm flex items-center";

                        let PreviewContent = (
                            <div className={inputClasses}>
                                <span className="opacity-50 italic">Text input...</span>
                            </div>
                        );

                        if (field.type === 'quantity') {
                            const settings = (field as any).settings || {};
                            const style = settings.display_style || 'text';
                            const min = settings.min;
                            const max = settings.max;

                            let QuantityPreview = null;

                            if (style === 'currency') {
                                QuantityPreview = (
                                    <div className="relative w-full">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium select-none">$</div>
                                        <div className={cn(inputClasses, "pl-7")}>
                                            <span className="opacity-50 italic">0.00</span>
                                        </div>
                                    </div>
                                );
                            } else if (style === 'counter') {
                                QuantityPreview = (
                                    <div className="flex items-center w-full bg-muted/50 border border-border rounded-lg overflow-hidden h-[42px]">
                                        <div className="h-full w-10 flex items-center justify-center bg-muted/50 border-r border-border text-muted-foreground"><Minus size={14} /></div>
                                        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">{min || 0}</div>
                                        <div className="h-full w-10 flex items-center justify-center bg-muted/50 border-l border-border text-muted-foreground"><Plus size={14} /></div>
                                    </div>
                                );
                            } else {
                                // Default Text/Number Style
                                if (max) {
                                    // Hybrid Dropdown Mode
                                    QuantityPreview = (
                                        <div className={cn(inputClasses, "justify-between")}>
                                            <span className="text-muted-foreground">{min || 0}</span>
                                            <ChevronDown size={16} className="text-muted-foreground" />
                                        </div>
                                    );
                                } else {
                                    // Infinite Input Mode
                                    QuantityPreview = (
                                        <div className={inputClasses}>
                                            <span className="opacity-50 italic">{min || 0}</span>
                                        </div>
                                    );
                                }
                            }

                            PreviewContent = (
                                <div className="space-y-2">
                                    {QuantityPreview}
                                    {/* Config Badges */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {(min !== undefined || max !== undefined) && (
                                            <span className="text-[10px] bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                                                Range: {min ?? '∞'} - {max ?? '∞'}
                                            </span>
                                        )}
                                        {settings.step && settings.step !== 1 && (
                                            <span className="text-[10px] bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                                                Step: {settings.step}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        } else if (field.type === 'select') {
                            const settings = (field as any).settings || {};
                            const isRequired = settings.required;

                            // Replicate 'None' logic from Edit Sheet
                            const options = field.options || [];
                            const effectiveOptions = isRequired
                                ? options
                                : [{ label: 'None / Empty', value: '' }, ...options];

                            const defaultValue = (field as any).default_value || "";
                            // If default value exists, use it. If not, and optional, implies "None" ("").

                            PreviewContent = (
                                <div className="w-full">
                                    <Combobox
                                        value={defaultValue}
                                        onChange={() => { }} // Read only
                                        options={effectiveOptions}
                                        placeholder={options.length > 0 ? "Select option..." : "No options"}
                                    />
                                    {/* Mini badge for options count */}
                                    <div className="mt-1 flex gap-2">
                                        <span className="text-[10px] text-muted-foreground bg-muted border border-border rounded px-2 py-0.5">
                                            {options.length} options
                                        </span>
                                    </div>
                                </div>
                            );
                        } else if (field.type === 'checkbox') {
                            const isMulti = field.options?.settings?.allow_multiselect || (field as any).settings?.allow_multiselect; // Handle both locations if migration lag
                            // Creating fake options for preview if none exist
                            const previewOptions = (field.options && field.options.length > 0)
                                ? field.options
                                : [{ label: "Option A", value: "a" }, { label: "Option B", value: "b" }];

                            PreviewContent = (
                                <div className="flex flex-col gap-2 pt-1 pb-1">
                                    {previewOptions.map((opt: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 px-1">
                                            <div className={cn(
                                                "w-4 h-4 border border-border flex items-center justify-center flex-shrink-0",
                                                isMulti ? "rounded" : "rounded-full"
                                            )}>
                                                {/* Empty state for preview */}
                                            </div>
                                            <span className="text-xs text-muted-foreground break-words">{opt.label}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        } else if (field.type === 'header') {
                            PreviewContent = (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg px-2">
                                                <Eye size={16} />
                                                <span className="ml-2 text-xs">Preview</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-popover border-border max-w-[300px]">
                                            <div className="border-b border-border pb-2 mb-1">
                                                <h3 className="text-sm font-bold uppercase tracking-wider text-primary break-words">{field.label}</h3>
                                            </div>
                                            {field.description && (
                                                <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        } else if (field.type === 'date') {
                            PreviewContent = (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-between text-left font-normal bg-muted/50 border-border px-4 py-3 h-[46px] text-foreground hover:bg-muted hover:text-foreground",
                                                "text-custom-foreground"
                                            )}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span>Pick a date</span>
                                            <CalendarIcon className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                                        <Calendar
                                            mode="single"
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            );
                        } else if (field.type === 'transport') {
                            PreviewContent = (
                                <div className={cn(inputClasses, "justify-between")}>
                                    <span className="text-muted-foreground">Select Hotel...</span>
                                    <Hotel size={16} className="text-muted-foreground" />
                                </div>
                            );
                        }

                        return (
                            <tr key={field.id} className="hover:bg-muted transition-colors group">
                                {/* Label */}
                                <td className="px-6 py-4 font-medium text-foreground align-middle">
                                    <div className="flex items-center gap-3 pt-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="flex items-center gap-1">
                                                {field.type === 'header' && field.label.length > 30 && !expandedFields.has(field.id) ? (
                                                    <span className="flex items-center gap-2">
                                                        <span>{field.label.substring(0, 30)}...</span>
                                                        <button
                                                            onClick={(e) => toggleExpand(field.id, e)}
                                                            className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                        >
                                                            <Plus size={10} />
                                                        </button>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <span>{field.label}</span>
                                                        {field.type === 'header' && field.label.length > 30 && (
                                                            <button
                                                                onClick={(e) => toggleExpand(field.id, e)}
                                                                className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                                                            >
                                                                <Minus size={10} />
                                                            </button>
                                                        )}
                                                    </span>
                                                )}

                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* Type */}
                                <td className="px-6 py-4 align-middle">
                                    <div className="flex flex-col items-start mt-2">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border capitalize transition-colors",
                                            "bg-muted border-border text-muted-foreground"
                                        )}>
                                            {field.type === 'quantity' ? 'Number' : field.type}
                                        </span>
                                        {/* Show Subtype for Number (Quantity) */}
                                        {field.type === 'quantity' && (
                                            <span className="text-[10px] text-muted-foreground bg-muted border border-border rounded px-2 py-0.5 mt-2 ml-1 font-normal">
                                                {(field as any).settings?.display_style
                                                    ? ((field as any).settings.display_style.charAt(0).toUpperCase() + (field as any).settings.display_style.slice(1))
                                                    : 'Text'} Style
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Visibility */}
                                <td className="px-6 py-4 align-middle">
                                    {field.is_internal ? (
                                        <div className="flex items-center gap-2 text-muted-foreground text-sm bg-muted border border-border px-2 py-1 rounded w-fit mt-2">
                                            <Lock size={12} />
                                            <span>Internal Only</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground text-sm bg-muted border border-border px-2 py-1 rounded w-fit mt-2">
                                            <Globe size={12} />
                                            <span>Public</span>
                                        </div>
                                    )}
                                </td>

                                {/* Object Preview */}
                                <td className="px-6 py-4 align-middle">
                                    {PreviewContent}
                                </td>

                                {/* Actions - Last Column */}
                                <td className="px-6 py-4 align-middle border-l border-border">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={() => onEdit(field)}
                                            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                            title="Edit Field"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDuplicate(field)}
                                            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(field.id)}
                                            className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
                {data.map((field) => {
                    const Icon = TYPE_ICONS[field.type] || Type;
                    const typeLabel = field.type === 'quantity' ? 'Number' : field.type;

                    return (
                        <div key={field.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                            {/* Header: Type Icon + Actions */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Icon size={20} />
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(field)}
                                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => onDuplicate(field)}
                                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(field.id)}
                                        className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Field Name - beneath icon */}
                            <h3 className="text-lg font-bold text-foreground leading-tight">{field.label}</h3>

                            {/* Body: Icon-based layout */}
                            <div className="space-y-2 pt-2 border-t border-border">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border capitalize bg-muted border-border">
                                        {typeLabel}
                                    </span>
                                    {field.is_internal ? (
                                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                            <Lock size={12} />
                                            <span>Internal</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                            <Globe size={12} />
                                            <span>Public</span>
                                        </div>
                                    )}
                                </div>
                                {field.type === 'select' && field.options?.length > 0 && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <List size={14} className="text-muted-foreground" />
                                        {field.options.length} options
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <AlertDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => {
                    if (deleteId) onDelete(deleteId);
                    setDeleteId(null);
                }}
                isDestructive={true}
                title="Delete Custom Field"
                description="Are you sure you want to delete this custom field? This action cannot be undone and will remove data associated with this field from existing bookings."
                confirmLabel="Delete Field"
            />
        </div>
    );
}
