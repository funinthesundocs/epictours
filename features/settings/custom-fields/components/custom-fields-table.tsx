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
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/5">
                <Search size={48} className="mb-4 opacity-20" />
                <p>No custom fields found.</p>
                {activeFilter !== 'all' && (
                    <Button variant="link" onClick={() => onFilterChange('all')} className="mt-2 text-cyan-400">
                        Clear Filters
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto relative">
            <table className="w-full text-left">
                <thead className="bg-white/5 backdrop-blur-sm text-zinc-400 text-xs uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                    <tr>
                        <th className="px-6 py-4 font-medium w-[30%]">Field Name</th>
                        <th className="px-6 py-4 font-medium">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn(
                                        "flex items-center gap-2 hover:text-white transition-colors outline-none",
                                        activeFilter !== 'all' && "text-cyan-400"
                                    )}>
                                        Type
                                        {activeFilter !== 'all' ? <ListFilter size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[180px] bg-[#1a1f2e] border-white/10 text-zinc-300">
                                    <DropdownMenuLabel className="text-xs uppercase text-zinc-500 font-bold">Filter By Type</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    {FILTER_OPTS.map((opt) => (
                                        <DropdownMenuItem
                                            key={opt.id}
                                            onClick={() => onFilterChange(opt.id)}
                                            className={cn(
                                                "text-xs focus:bg-cyan-500/10 focus:text-cyan-400 cursor-pointer",
                                                activeFilter === opt.id && "bg-cyan-500/10 text-cyan-400"
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
                        <th className="px-6 py-4 font-medium text-right w-[120px]">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                    {data.map((field) => {
                        const Icon = TYPE_ICONS[field.type] || Type;

                        // Render Preview Content based on type
                        // Deep Core Aesthetic: bg-black/20 border-white/10 rounded-lg px-4 py-3
                        const inputClasses = "w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 text-sm flex items-center";

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
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium select-none">$</div>
                                        <div className={cn(inputClasses, "pl-7")}>
                                            <span className="opacity-50 italic">0.00</span>
                                        </div>
                                    </div>
                                );
                            } else if (style === 'counter') {
                                QuantityPreview = (
                                    <div className="flex items-center w-full bg-black/20 border border-white/10 rounded-lg overflow-hidden h-[42px]">
                                        <div className="h-full w-10 flex items-center justify-center bg-white/5 border-r border-white/5 text-zinc-500"><Minus size={14} /></div>
                                        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">{min || 0}</div>
                                        <div className="h-full w-10 flex items-center justify-center bg-white/5 border-l border-white/5 text-zinc-500"><Plus size={14} /></div>
                                    </div>
                                );
                            } else {
                                // Default Text/Number Style
                                if (max) {
                                    // Hybrid Dropdown Mode
                                    QuantityPreview = (
                                        <div className={cn(inputClasses, "justify-between")}>
                                            <span className="text-zinc-400">{min || 0}</span>
                                            <ChevronDown size={16} className="text-zinc-500" />
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
                                            <span className="text-[10px] bg-white/5 border border-white/5 rounded px-1.5 py-0.5 text-zinc-500">
                                                Range: {min ?? '∞'} - {max ?? '∞'}
                                            </span>
                                        )}
                                        {settings.step && settings.step !== 1 && (
                                            <span className="text-[10px] bg-white/5 border border-white/5 rounded px-1.5 py-0.5 text-zinc-500">
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
                                        <span className="text-[10px] text-zinc-500 bg-white/5 border border-white/10 rounded px-2 py-0.5">
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
                                                "w-4 h-4 border border-white/20 flex items-center justify-center flex-shrink-0",
                                                isMulti ? "rounded" : "rounded-full"
                                            )}>
                                                {/* Empty state for preview */}
                                            </div>
                                            <span className="text-xs text-zinc-400 break-words">{opt.label}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        } else if (field.type === 'header') {
                            PreviewContent = (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg px-2">
                                                <Eye size={16} />
                                                <span className="ml-2 text-xs">Preview</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-[#1a1f24] border-white/10 max-w-[300px]">
                                            <div className="border-b border-white/10 pb-2 mb-1">
                                                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 break-words">{field.label}</h3>
                                            </div>
                                            {field.description && (
                                                <p className="text-xs text-zinc-400 mt-1">{field.description}</p>
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
                                                "w-full justify-between text-left font-normal bg-black/20 border-white/10 px-4 py-3 h-[46px] text-white hover:bg-white/5 hover:text-white",
                                                "text-zinc-400"
                                            )}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span>Pick a date</span>
                                            <CalendarIcon className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#0b1115] border-white/10" align="start">
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
                                    <span className="text-zinc-400">Select Hotel...</span>
                                    <Hotel size={16} className="text-zinc-500" />
                                </div>
                            );
                        }

                        return (
                            <tr key={field.id} className="hover:bg-white/5 transition-colors group">
                                {/* Label */}
                                <td className="px-6 py-4 font-medium text-white align-middle">
                                    <div className="flex items-center gap-3 pt-2">
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="flex items-center gap-1">
                                                {field.type === 'header' && field.label.length > 30 && !expandedFields.has(field.id) ? (
                                                    <span className="flex items-center gap-2">
                                                        <span>{field.label.substring(0, 30)}...</span>
                                                        <button
                                                            onClick={(e) => toggleExpand(field.id, e)}
                                                            className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
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
                                                                className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
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
                                            "bg-white/5 border-white/10 text-zinc-400"
                                        )}>
                                            {field.type === 'quantity' ? 'Number' : field.type}
                                        </span>
                                        {/* Show Subtype for Number (Quantity) */}
                                        {field.type === 'quantity' && (
                                            <span className="text-[10px] text-zinc-500 bg-white/5 border border-white/10 rounded px-2 py-0.5 mt-2 ml-1 font-normal">
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
                                        <div className="flex items-center gap-2 text-zinc-500 text-sm bg-white/5 border border-white/10 px-2 py-1 rounded w-fit mt-2">
                                            <Lock size={12} />
                                            <span>Internal Only</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-zinc-500 text-sm bg-white/5 border border-white/10 px-2 py-1 rounded w-fit mt-2">
                                            <Globe size={12} />
                                            <span>Public</span>
                                        </div>
                                    )}
                                </td>

                                {/* Object Preview */}
                                <td className="px-6 py-4 align-middle">
                                    {PreviewContent}
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 text-right align-middle">
                                    <div className="flex items-center justify-end gap-2 mt-2">
                                        <button
                                            onClick={() => onEdit(field)}
                                            className="p-2 text-zinc-400 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg transition-colors"
                                            title="Edit Field"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDuplicate(field)}
                                            className="p-2 text-zinc-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                                            title="Duplicate Field"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm("Are you sure? This action cannot be undone.")) {
                                                    onDelete(field.id);
                                                }
                                            }}
                                            className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                            title="Delete Field"
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
        </div>
    );
}
