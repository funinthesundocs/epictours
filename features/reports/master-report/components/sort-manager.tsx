"use client";

import { useState } from "react";
import { ArrowUpDown, Check, RotateCcw, GripVertical, X, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidePanel } from "@/components/ui/side-panel";
import { REPORT_COLUMNS } from "./column-picker";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type SortCriteria = {
    key: string;
    direction: "asc" | "desc";
};

// Columns available for sorting (exclude IDs and very long text fields)
const SORTABLE_COLUMNS = REPORT_COLUMNS.filter(col =>
    !["booking_id", "customer_id", "notes", "voucher_numbers"].includes(col.key)
);

// Column groups for the available criteria section
const SORT_GROUPS = [
    { label: "Booking", keys: ["confirmation_number", "booking_status", "pax_count", "total_amount", "amount_paid", "balance_due", "payment_status", "booking_created_at"] },
    { label: "Customer", keys: ["customer_name", "customer_email", "customer_phone", "customer_hotel", "customer_source", "customer_status", "customer_total_value"] },
    { label: "Experience", keys: ["experience_code", "experience_name", "start_date", "start_time", "max_capacity"] },
    { label: "Staff & Resources", keys: ["driver_name", "guide_name", "vehicle_name", "route_name"] },
    { label: "Pickup", keys: ["pickup_location", "pickup_time"] },
];

// Sortable item component for drag-and-drop
function SortableCriteriaItem({
    criteria,
    onRemove,
    onToggleDirection
}: {
    criteria: SortCriteria;
    onRemove: (key: string) => void;
    onToggleDirection: (key: string) => void;
}) {
    const column = REPORT_COLUMNS.find(c => c.key === criteria.key);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: criteria.key });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (!column) return null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm bg-white/5 border border-white/10 group transition-all",
                isDragging && "opacity-50 bg-cyan-400/10 border-cyan-400/30 shadow-lg"
            )}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-cyan-400 transition-colors"
            >
                <GripVertical size={16} />
            </div>
            <span className="flex-1 text-white font-medium">{column.label}</span>

            {/* Direction Toggle */}
            <button
                onClick={() => onToggleDirection(criteria.key)}
                className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all",
                    criteria.direction === "asc"
                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                )}
            >
                {criteria.direction === "asc" ? (
                    <>
                        <ArrowUp size={12} />
                        ASC
                    </>
                ) : (
                    <>
                        <ArrowDown size={12} />
                        DESC
                    </>
                )}
            </button>

            {/* Remove Button */}
            <button
                onClick={() => onRemove(criteria.key)}
                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-1 hover:bg-red-400/10 rounded"
            >
                <X size={14} />
            </button>
        </div>
    );
}

// Collapsible category group
function SortCategoryGroup({
    label,
    keys,
    activeCriteria,
    onToggle
}: {
    label: string;
    keys: string[];
    activeCriteria: SortCriteria[];
    onToggle: (key: string) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const activeKeys = activeCriteria.map(c => c.key);
    const activeCount = keys.filter(k => activeKeys.includes(k)).length;

    return (
        <div className="mb-2">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="flex-1 text-left uppercase tracking-wider">{label}</span>
                {activeCount > 0 && (
                    <span className="text-xs bg-cyan-400/20 text-cyan-400 px-2 py-0.5 rounded-full">
                        {activeCount}
                    </span>
                )}
            </button>
            {isExpanded && (
                <div className="mt-1 space-y-0.5 pl-2">
                    {keys.map((key) => {
                        const column = SORTABLE_COLUMNS.find(c => c.key === key);
                        if (!column) return null;
                        const isActive = activeKeys.includes(key);
                        return (
                            <button
                                key={key}
                                onClick={() => onToggle(key)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-zinc-300 hover:bg-white/10 hover:text-white"
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                    isActive
                                        ? "bg-cyan-400 border-cyan-400"
                                        : "border-white/20 hover:border-white/40"
                                )}>
                                    {isActive && <Check size={14} className="text-black" strokeWidth={3} />}
                                </div>
                                <span className={cn(isActive && "text-white font-medium")}>{column.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

interface SortManagerProps {
    sortCriteria: SortCriteria[];
    onSortChange: (criteria: SortCriteria[]) => void;
}

export function SortManager({ sortCriteria, onSortChange }: SortManagerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = sortCriteria.findIndex(c => c.key === active.id);
            const newIndex = sortCriteria.findIndex(c => c.key === over.id);
            onSortChange(arrayMove(sortCriteria, oldIndex, newIndex));
        }
    };

    const handleToggle = (key: string) => {
        const existing = sortCriteria.find(c => c.key === key);
        if (existing) {
            // Remove if already active
            onSortChange(sortCriteria.filter(c => c.key !== key));
        } else {
            // Add with default DESC
            onSortChange([...sortCriteria, { key, direction: "desc" }]);
        }
    };

    const handleToggleDirection = (key: string) => {
        onSortChange(sortCriteria.map(c =>
            c.key === key
                ? { ...c, direction: c.direction === "asc" ? "desc" : "asc" }
                : c
        ));
    };

    const handleRemove = (key: string) => {
        onSortChange(sortCriteria.filter(c => c.key !== key));
    };

    const handleClearAll = () => {
        onSortChange([]);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "h-8 px-3 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap",
                    sortCriteria.length > 0
                        ? "bg-cyan-400/10 border-cyan-400/30 text-cyan-400"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                )}
            >
                <ArrowUpDown size={16} />
                Sort
                {sortCriteria.length > 0 && (
                    <span className="text-xs bg-cyan-400/20 text-cyan-400 px-1.5 py-0.5 rounded">
                        {sortCriteria.length}
                    </span>
                )}
            </button>

            <SidePanel
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Custom Sort"
                description="Select and prioritize sort criteria for your report"
                width="max-w-2xl"
            >
                <div className="flex h-full gap-6">
                    {/* Left Column - Available Criteria */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Available Criteria</h3>
                            <span className="text-xs text-zinc-500">Click to add</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-1">
                            {SORT_GROUPS.map((group) => (
                                <SortCategoryGroup
                                    key={group.label}
                                    label={group.label}
                                    keys={group.keys}
                                    activeCriteria={sortCriteria}
                                    onToggle={handleToggle}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-white/10 shrink-0" />

                    {/* Right Column - Active Sort (Draggable) */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">
                                Active Sort
                                {sortCriteria.length > 0 && (
                                    <span className="ml-2 text-sm font-normal text-cyan-400">({sortCriteria.length})</span>
                                )}
                            </h3>
                            <span className="text-xs text-zinc-500">Drag to prioritize</span>
                        </div>

                        {sortCriteria.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-zinc-500">
                                    <ArrowUpDown size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No sort criteria selected</p>
                                    <p className="text-xs mt-1">Click criteria on the left to add</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={sortCriteria.map(c => c.key)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {sortCriteria.map((criteria, index) => (
                                                <div key={criteria.key} className="relative">
                                                    {index === 0 && (
                                                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-xs text-cyan-400 font-bold">
                                                            1st
                                                        </div>
                                                    )}
                                                    <SortableCriteriaItem
                                                        criteria={criteria}
                                                        onRemove={handleRemove}
                                                        onToggleDirection={handleToggleDirection}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>

                                <p className="text-xs text-zinc-500 mt-4 text-center">
                                    ▲ Top = Primary Sort
                                </p>
                            </div>
                        )}

                        {/* Clear All Button */}
                        {sortCriteria.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <button
                                    onClick={handleClearAll}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                                >
                                    <RotateCcw size={16} />
                                    Clear All Sorts
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </SidePanel>
        </>
    );
}
