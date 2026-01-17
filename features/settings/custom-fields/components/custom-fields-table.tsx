"use client";

import { Edit, Trash2, Search, Type, List, CheckSquare, Hash, Truck, Heading, Copy, Lock, Globe, Calendar as CalendarIcon, ToggleLeft, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomField {
    id: string;
    name: string;
    label: string;
    type: string;
    description: string | null;
    is_internal: boolean;
    options: any;
}

interface CustomFieldsTableProps {
    data: CustomField[];
    onEdit: (field: CustomField) => void;
    onDuplicate: (field: CustomField) => void;
    onDelete: (id: string) => void;
}

const TYPE_ICONS: Record<string, any> = {
    text: Type,
    textarea: Type,
    select: List,
    quantity: Hash,
    checkbox: CheckSquare,
    transport: Truck,
    header: Heading,
    date: CalendarIcon
};

export function CustomFieldsTable({ data, onEdit, onDuplicate, onDelete }: CustomFieldsTableProps) {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/5">
                <Search size={48} className="mb-4 opacity-20" />
                <p>No custom fields found.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto relative rounded-xl border border-white/5 bg-[#0b1115]">
            <table className="w-full text-left">
                <thead className="bg-[#0f172a]/50 text-zinc-400 text-xs uppercase tracking-wider font-semibold sticky top-0 z-10 backdrop-blur-sm border-b border-white/5">
                    <tr>
                        <th className="px-6 py-4 font-medium w-[30%]">Object Name</th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Visibility</th>
                        <th className="px-6 py-4 font-medium w-[30%]">Object Preview</th>
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

                        if (field.type === 'select' || field.type === 'quantity') {
                            PreviewContent = (
                                <div className="relative group/preview cursor-default">
                                    <div className={cn(inputClasses, "justify-between group-hover/preview:border-cyan-500/30 transition-colors")}>
                                        <span className="text-zinc-400">Select option...</span>
                                        <ChevronDown size={16} className="text-zinc-500" />
                                    </div>
                                    {/* Mini dropdown preview hint */}
                                    {field.options && field.options.length > 0 && (
                                        <div className="absolute top-full left-0 mt-1 w-full bg-[#1a1f2e] border border-cyan-500/30 rounded-lg shadow-2xl z-20 hidden group-hover/preview:block py-1">
                                            {field.options.slice(0, 4).map((o: any) => (
                                                <div key={o.value} className="px-4 py-2 text-xs text-zinc-300 hover:bg-cyan-500/10 hover:text-cyan-400">
                                                    {o.label}
                                                </div>
                                            ))}
                                            {field.options.length > 4 && (
                                                <div className="px-4 py-2 text-xs text-zinc-500 italic border-t border-white/5">
                                                    +{field.options.length - 4} more options
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        } else if (field.type === 'textarea') {
                            PreviewContent = (
                                <div className={cn(inputClasses, "h-24 items-start")}>
                                    <span className="opacity-50 italic">Multi-line text area...</span>
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
                                <div className="border-b border-white/10 pb-2 mt-2">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">{field.label}</h3>
                                </div>
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
                                    <Truck size={16} className="text-zinc-500" />
                                </div>
                            );
                        }

                        return (
                            <tr key={field.id} className="hover:bg-white/5 transition-colors group">
                                {/* Label */}
                                <td className="px-6 py-4 font-medium text-white align-top">
                                    <div className="flex items-center gap-3 pt-2">
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span>{field.label}</span>
                                        </div>
                                    </div>
                                </td>

                                {/* Type */}
                                <td className="px-6 py-4 align-top">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-zinc-400 capitalize mt-2">
                                        {field.type}
                                    </span>
                                </td>

                                {/* Visibility */}
                                <td className="px-6 py-4 align-top">
                                    {field.is_internal ? (
                                        <div className="flex items-center gap-2 text-amber-500/80 text-xs bg-amber-500/10 px-2 py-1 rounded w-fit mt-2">
                                            <Lock size={12} />
                                            <span>Internal Only</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-zinc-500 text-xs px-2 py-1 mt-2">
                                            <Globe size={12} />
                                            <span>Public</span>
                                        </div>
                                    )}
                                </td>

                                {/* Object Preview */}
                                <td className="px-6 py-4">
                                    {PreviewContent}
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 text-right align-top">
                                    <div className="flex items-center justify-end gap-2 mt-2">
                                        <button
                                            onClick={() => onDuplicate(field)}
                                            className="p-2 text-zinc-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                                            title="Duplicate Field"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={() => onEdit(field)}
                                            className="p-2 text-zinc-400 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg transition-colors"
                                            title="Edit Field"
                                        >
                                            <Edit size={16} />
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
