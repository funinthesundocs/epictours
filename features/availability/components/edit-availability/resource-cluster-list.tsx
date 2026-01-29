"use client";

import { useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Bus, Truck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/custom-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSidebar } from "@/components/shell/sidebar-context";

// Types
export interface Assignment {
    id: string; // concise local ID for dnd (if new) or UUID (if existing)
    vehicle_id: string;
    transportation_route_id: string | null;
    driver_id: string | null;
    guide_id: string | null;
}

interface ResourceClusterListProps {
    assignments: Assignment[];
    onChange: (assignments: Assignment[]) => void;
    vehicles: { id: string; name: string; capacity?: number }[];
    routes: { id: string; name: string }[];
    staff: { id: string; name: string; role: { name: string } | null }[];
    maxCapacity: number;
}

// Sortable Item Component
function SortableItem({
    assignment,
    onDelete,
    vehicles,
    routes,
    staff
}: {
    assignment: Assignment;
    onDelete: (id: string) => void;
    vehicles: { id: string; name: string }[];
    routes: { id: string; name: string }[];
    staff: { id: string; name: string }[];
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: assignment.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const vehicle = vehicles.find(v => v.id === assignment.vehicle_id);
    const vehicleName = vehicle?.name || "Unknown Vehicle";
    const routeName = routes.find(r => r.id === assignment.transportation_route_id)?.name || "No Route";
    const driverName = staff.find(s => s.id === assignment.driver_id)?.name || "No Driver";
    const guideName = staff.find(s => s.id === assignment.guide_id)?.name || "No Guide";

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-start gap-3 bg-zinc-900/80 border border-white/10 rounded-lg p-3 group mb-2"
        >
            <button {...attributes} {...listeners} type="button" className="mt-1 text-zinc-500 hover:text-white cursor-grab active:cursor-grabbing">
                <GripVertical size={16} />
            </button>

            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Bus size={14} className="text-cyan-400" />
                    {vehicleName}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-400">
                    <span className="flex items-center gap-1"><Truck size={12} /> {routeName}</span>
                    <span className="flex items-center gap-1"><User size={12} /> {driverName} (Driver)</span>
                    {assignment.guide_id && (
                        <span className="flex items-center gap-1 col-span-2"><User size={12} /> {guideName} (Guide)</span>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={() => onDelete(assignment.id)}
                className="text-zinc-500 hover:text-red-400 transition-colors"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}

export function ResourceClusterList({ assignments, onChange, vehicles, routes, staff, maxCapacity }: ResourceClusterListProps) {
    const { isCollapsed } = useSidebar();
    const [isAdding, setIsAdding] = useState(false);

    // New Cluster State
    const [newCluster, setNewCluster] = useState<Partial<Assignment>>({});

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = assignments.findIndex((item) => item.id === active.id);
            const newIndex = assignments.findIndex((item) => item.id === over?.id);
            onChange(arrayMove(assignments, oldIndex, newIndex));
        }
    };

    const handleAdd = () => {
        if (!newCluster.vehicle_id) return;
        const newAssignment: Assignment = {
            id: `new-${Date.now()}`, // Temporary ID
            vehicle_id: newCluster.vehicle_id,
            transportation_route_id: newCluster.transportation_route_id || null,
            driver_id: newCluster.driver_id || null,
            guide_id: newCluster.guide_id || null,
        };
        onChange([...assignments, newAssignment]);
        setNewCluster({});
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        onChange(assignments.filter(a => a.id !== id));
    };

    // Capacity Calculation
    const totalClusterCapacity = assignments.reduce((sum, assign) => {
        const vehicle = vehicles.find(v => v.id === assign.vehicle_id);
        return sum + (vehicle?.capacity || 0);
    }, 0);

    const capacityDiff = totalClusterCapacity - maxCapacity;

    // Display Logic
    let diffColor = "text-cyan-400"; // Zero (Teal)
    let diffText = "0";

    if (capacityDiff > 0) {
        diffColor = "text-green-500";
        diffText = `+${capacityDiff}`;
    } else if (capacityDiff < 0) {
        diffColor = "text-red-500";
        diffText = `${capacityDiff}`;
    }

    return (
        <div className="space-y-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={assignments.map(a => a.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {assignments.map(assignment => (
                            <SortableItem
                                key={assignment.id}
                                assignment={assignment}
                                onDelete={handleDelete}
                                vehicles={vehicles}
                                routes={routes}
                                staff={staff}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Add Button & Indicator */}
            <div className="space-y-2">
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild>
                        <button
                            type="button"
                            className="w-full py-3 border-2 border-dashed border-white/10 rounded-lg text-zinc-400 hover:text-white hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                        >
                            <Plus size={16} />
                            Add Vehicle Cluster
                        </button>
                    </DialogTrigger>
                    <DialogContent
                        portal={false}
                        overlayClassName="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#0b1115] border-white/10 text-white sm:max-w-[425px] shadow-2xl"
                    >
                        <DialogHeader>
                            <DialogTitle>Add Vehicle Cluster</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Vehicle (Required)</label>
                                <CustomSelect
                                    value={newCluster.vehicle_id}
                                    onChange={(val) => setNewCluster({ ...newCluster, vehicle_id: val })}
                                    options={vehicles.map(v => ({ value: v.id, label: v.name }))}
                                    placeholder="Select Vehicle..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Route</label>
                                <CustomSelect
                                    value={newCluster.transportation_route_id || ""}
                                    onChange={(val) => setNewCluster({ ...newCluster, transportation_route_id: val })}
                                    options={[{ value: "", label: "No Route" }, ...routes.map(r => ({ value: r.id, label: r.name }))]}
                                    placeholder="Select Route..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Driver (Required)</label>
                                <CustomSelect
                                    value={newCluster.driver_id || ""}
                                    onChange={(val) => setNewCluster({ ...newCluster, driver_id: val })}
                                    options={[{ value: "", label: "No Driver" }, ...staff.filter(s => s.role?.name === 'Driver').map(s => ({ value: s.id, label: s.name }))]}
                                    placeholder="Select Driver..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Guide (Optional)</label>
                                <CustomSelect
                                    value={newCluster.guide_id || ""}
                                    onChange={(val) => setNewCluster({ ...newCluster, guide_id: val })}
                                    options={[{ value: "", label: "No Guide" }, ...staff.filter(s => s.role?.name === 'Guide' || s.role?.name === 'Driver').map(s => ({ value: s.id, label: s.name }))]}
                                    placeholder="Select Guide..."
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={!newCluster.vehicle_id || !newCluster.driver_id}
                                className="w-full bg-cyan-400 text-black font-bold py-2.5 rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                Add Cluster
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Capacity Difference Indicator */}
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Capacity Diff</span>
                    <span className={cn("text-sm font-bold font-mono", diffColor)}>
                        {diffText}
                    </span>
                </div>
            </div>
        </div>
    );
}
