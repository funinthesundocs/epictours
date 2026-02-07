"use client";

import { useState, useEffect } from "react";
import { Columns3, Check, RotateCcw, GripVertical, X, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColumnConfig } from "../types";
import { SidePanel } from "@/components/ui/side-panel";
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

// All available columns for the Master Report (35+ columns)
// Alignment rules: Text=left, Numbers/Amounts=center, Phone=center, Notes=justify
export const REPORT_COLUMNS: ColumnConfig[] = [
    // Booking fields
    { key: "confirmation_number", label: "Confirmation", width: "140px", align: "left", category: "booking" },
    { key: "booking_status", label: "Status", width: "100px", align: "left", category: "booking" },
    { key: "pax_count", label: "Pax", width: "60px", align: "center", category: "booking" },
    { key: "total_amount", label: "Total", width: "100px", align: "center", format: "currency", category: "booking" },
    { key: "amount_paid", label: "Paid", width: "100px", align: "center", format: "currency", category: "booking" },
    { key: "balance_due", label: "Due", width: "100px", align: "center", format: "currency", category: "booking" },
    { key: "payment_status", label: "Payment", width: "120px", align: "left", category: "booking" },
    { key: "voucher_numbers", label: "Vouchers", width: "120px", align: "left", category: "booking" },
    { key: "notes", label: "Notes", width: "300px", align: "left", category: "booking" },
    { key: "booking_created_at", label: "Booked On", width: "120px", align: "center", format: "date", category: "booking" },
    { key: "agent_name", label: "Agent", width: "120px", align: "left", category: "booking" },
    { key: "booking_source", label: "Source", width: "120px", align: "left", category: "booking" },
    { key: "check_in_status", label: "Check-In", width: "140px", align: "left", category: "booking" },

    // Customer fields
    { key: "customer_name", label: "Customer", width: "160px", align: "left", category: "customer" },
    { key: "customer_email", label: "Email", width: "200px", align: "left", category: "customer" },
    { key: "customer_phone", label: "Phone", width: "150px", align: "center", format: "phone", category: "customer" },
    { key: "customer_hotel", label: "Hotel", width: "140px", align: "left", category: "customer" },
    { key: "customer_source", label: "Source", width: "100px", align: "left", category: "customer" },
    { key: "customer_status", label: "Cust Status", width: "120px", align: "left", category: "customer" },
    { key: "preferred_messaging_app", label: "Com App", width: "110px", align: "left", category: "customer" },
    { key: "dietary_restrictions", label: "Dietary", width: "120px", align: "left", category: "customer" },
    { key: "accessibility_needs", label: "Accessibility", width: "130px", align: "left", category: "customer" },
    { key: "emergency_contact_name", label: "Emergency Contact", width: "180px", align: "left", category: "customer" },
    { key: "emergency_contact_phone", label: "Emergency Phone", width: "170px", align: "center", format: "phone", category: "customer" },
    { key: "customer_total_value", label: "Lifetime Value", width: "140px", align: "center", format: "currency", category: "customer" },

    // Experience/Availability fields
    { key: "experience_code", label: "Exp Code", width: "110px", align: "left", category: "experience" },
    { key: "experience_name", label: "Experience", width: "160px", align: "left", category: "experience" },
    { key: "start_date", label: "Start Date", width: "120px", align: "center", format: "date", category: "experience" },
    { key: "start_time", label: "Start Time", width: "110px", align: "center", category: "experience" },
    { key: "max_capacity", label: "Capacity", width: "100px", align: "center", category: "experience" },

    // Staff & Resources
    { key: "driver_name", label: "Driver", width: "120px", align: "left", category: "staff" },
    { key: "guide_name", label: "Guide", width: "120px", align: "left", category: "staff" },
    { key: "vehicle_name", label: "Vehicle", width: "120px", align: "left", category: "staff" },
    { key: "route_name", label: "Route", width: "120px", align: "left", category: "staff" },

    // Pickup info
    { key: "pickup_location", label: "Pickup Location", width: "170px", align: "left", category: "pickup" },
    { key: "pickup_time", label: "Pickup Time", width: "130px", align: "center", category: "pickup" },

    // IDs (for export/debugging)
    { key: "booking_id", label: "Booking ID", width: "300px", align: "left", category: "booking" },
    { key: "customer_id", label: "Customer ID", width: "300px", align: "left", category: "customer" },
];


// Default visible columns (most useful subset)
export const DEFAULT_VISIBLE_COLUMNS = [
    "confirmation_number",
    "customer_name",
    "customer_phone",
    "experience_code",
    "start_date",
    "pax_count",
    "total_amount",
    "amount_paid",
    "balance_due",
    "booking_status"
];

const STORAGE_KEY = "master-report-visible-columns";

export function useColumnVisibility() {
    const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setVisibleColumns(parsed);
                }
            } catch (e) {
                // Invalid JSON, use defaults
            }
        }
    }, []);

    // Save to localStorage on change
    const updateVisibleColumns = (columns: string[]) => {
        setVisibleColumns(columns);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
    };

    const toggleColumn = (columnKey: string) => {
        if (visibleColumns.includes(columnKey)) {
            if (visibleColumns.length > 1) {
                updateVisibleColumns(visibleColumns.filter(c => c !== columnKey));
            }
        } else {
            updateVisibleColumns([...visibleColumns, columnKey]);
        }
    };

    const resetToDefault = () => {
        updateVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    };

    const reorderColumns = (newOrder: string[]) => {
        updateVisibleColumns(newOrder);
    };

    const isColumnVisible = (columnKey: string) => visibleColumns.includes(columnKey);

    return { visibleColumns, toggleColumn, resetToDefault, reorderColumns, isColumnVisible };
}

// Column groups for the available columns section
const COLUMN_GROUPS = [
    { label: "Booking", keys: ["confirmation_number", "booking_status", "pax_count", "total_amount", "amount_paid", "balance_due", "payment_status", "voucher_numbers", "notes", "booking_created_at", "agent_name", "booking_source", "check_in_status"] },
    { label: "Customer", keys: ["customer_name", "customer_email", "customer_phone", "customer_hotel", "customer_source", "customer_status", "preferred_messaging_app", "dietary_restrictions", "accessibility_needs", "emergency_contact_name", "emergency_contact_phone", "customer_total_value"] },
    { label: "Experience", keys: ["experience_code", "experience_name", "start_date", "start_time", "max_capacity"] },
    { label: "Staff & Resources", keys: ["driver_name", "guide_name", "vehicle_name", "route_name"] },
    { label: "Pickup", keys: ["pickup_location", "pickup_time"] },
    { label: "IDs", keys: ["booking_id", "customer_id"] },
];

// Sortable item component for drag-and-drop
function SortableColumnItem({ id, onRemove }: { id: string; onRemove: (key: string) => void }) {
    const column = REPORT_COLUMNS.find(c => c.key === id);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

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
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm bg-muted/50 border border-border group transition-all",
                isDragging && "opacity-50 bg-primary/10 border-primary/30 shadow-lg"
            )}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors"
            >
                <GripVertical size={16} />
            </div>
            <span className="flex-1 text-foreground font-medium">{column.label}</span>
            <button
                onClick={() => onRemove(id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 hover:bg-destructive/10 rounded"
            >
                <X size={14} />
            </button>
        </div>
    );
}

// Collapsible category group
function CategoryGroup({
    label,
    keys,
    visibleColumns,
    onToggle
}: {
    label: string;
    keys: string[];
    visibleColumns: string[];
    onToggle: (key: string) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const activeCount = keys.filter(k => visibleColumns.includes(k)).length;

    return (
        <div className="mb-2">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="flex-1 text-left uppercase tracking-wider">{label}</span>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                    {activeCount}/{keys.length}
                </span>
            </button>
            {isExpanded && (
                <div className="mt-1 space-y-0.5 pl-2">
                    {keys.map((key) => {
                        const column = REPORT_COLUMNS.find(c => c.key === key);
                        if (!column) return null;
                        const isActive = visibleColumns.includes(key);
                        return (
                            <button
                                key={key}
                                onClick={() => onToggle(key)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                    isActive
                                        ? "bg-primary border-primary"
                                        : "border-border hover:border-muted-foreground"
                                )}>
                                    {isActive && <Check size={14} className="text-primary-foreground" strokeWidth={3} />}
                                </div>
                                <span className={cn(isActive && "text-foreground font-medium")}>{column.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

interface ColumnPickerProps {
    visibleColumns: string[];
    onToggle: (columnKey: string) => void;
    onReset: () => void;
    onReorder?: (newOrder: string[]) => void;
}

export function ColumnPicker({ visibleColumns, onToggle, onReset, onReorder }: ColumnPickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const isDefault = JSON.stringify([...visibleColumns].sort()) === JSON.stringify([...DEFAULT_VISIBLE_COLUMNS].sort());

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = visibleColumns.indexOf(active.id as string);
            const newIndex = visibleColumns.indexOf(over.id as string);
            const newOrder = arrayMove(visibleColumns, oldIndex, newIndex);
            onReorder?.(newOrder);
        }
    };

    const handleRemove = (key: string) => {
        if (visibleColumns.length > 1) {
            onToggle(key);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "h-8 px-3 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap",
                    "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
            >
                <Columns3 size={16} />
                Columns
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                    {visibleColumns.length}
                </span>
            </button>

            <SidePanel
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Column Manager"
                description="Select and reorder columns for your report"
                width="max-w-2xl"
            >
                <div className="flex h-full gap-6">
                    {/* Left Column - Available Columns */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-foreground">Available Columns</h3>
                            <span className="text-xs text-muted-foreground">Click to add/remove</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-1">
                            {COLUMN_GROUPS.map((group) => (
                                <CategoryGroup
                                    key={group.label}
                                    label={group.label}
                                    keys={group.keys}
                                    visibleColumns={visibleColumns}
                                    onToggle={onToggle}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-border shrink-0" />

                    {/* Right Column - Active Columns (Draggable) */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-foreground">
                                Active Columns
                                <span className="ml-2 text-sm font-normal text-primary">({visibleColumns.length})</span>
                            </h3>
                            <span className="text-xs text-muted-foreground">Drag to reorder</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={visibleColumns}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-2">
                                        {visibleColumns.map((key) => (
                                            <SortableColumnItem
                                                key={key}
                                                id={key}
                                                onRemove={handleRemove}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>

                        {/* Reset Button */}
                        {!isDefault && (
                            <div className="mt-4 pt-4 border-t border-border">
                                <button
                                    onClick={onReset}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border"
                                >
                                    <RotateCcw size={16} />
                                    Reset to Default
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </SidePanel>
        </>
    );
}
