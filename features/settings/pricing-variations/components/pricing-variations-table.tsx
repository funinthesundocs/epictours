"use client";

import { Edit2, Trash2, Search, Layers, GripVertical } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface PricingVariation {
    id: string;
    name: string;
    sort_order: number;
    created_at: string;
}

interface PricingVariationsTableProps {
    data: PricingVariation[];
    onEdit: (variation: PricingVariation) => void;
    onDelete: (id: string) => void;
    onReorder: (reorderedData: PricingVariation[]) => void;
}

// Sortable Row Component
function SortableRow({ variation, onEdit, onDelete }: {
    variation: PricingVariation;
    onEdit: (v: PricingVariation) => void;
    onDelete: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: variation.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className="hover:bg-white/5 transition-colors group select-none"
        >
            {/* Drag Handle + Name */}
            <td className="px-6 py-4 font-medium text-white">
                <div className="flex items-center gap-3">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab text-zinc-600 hover:text-zinc-400 p-1"
                    >
                        <GripVertical size={16} />
                    </div>
                    {variation.name}
                </div>
            </td>

            {/* Actions - Last Column */}
            <td className="px-6 py-4 border-l border-white/10">
                <div className="flex items-center gap-2 justify-end">
                    <button
                        onClick={() => onEdit(variation)}
                        className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(variation.id)}
                        className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// Sortable Mobile Card Component
function SortableMobileCard({ variation, onEdit, onDelete }: {
    variation: PricingVariation;
    onEdit: (v: PricingVariation) => void;
    onDelete: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: variation.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white/5 border border-white/10 rounded-xl p-4 select-none"
        >
            {/* Header: Drag Handle + Name + Actions */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab text-zinc-600 hover:text-zinc-400 p-1 touch-none"
                    >
                        <GripVertical size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-white leading-tight">{variation.name}</h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => onEdit(variation)}
                        className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(variation.id)}
                        className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
export function PricingVariationsTable({ data, onEdit, onDelete, onReorder }: PricingVariationsTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = data.findIndex(item => item.id === active.id);
            const newIndex = data.findIndex(item => item.id === over.id);

            const reorderedData = arrayMove(data, oldIndex, newIndex).map((item, index) => ({
                ...item,
                sort_order: index + 1
            }));

            onReorder(reorderedData);
        }
    };

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/5">
                <Search size={48} className="mb-4 opacity-20" />
                <p>No pricing variations found.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto relative">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-zinc-900/80 backdrop-blur-sm text-white text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4 font-medium">Variation Name</th>
                            <th className="px-6 py-4 font-medium w-[100px] border-l border-white/10"></th>
                        </tr>
                    </thead>
                    <SortableContext items={data.map(v => v.id)} strategy={verticalListSortingStrategy}>
                        <tbody className="divide-y divide-white/5 text-zinc-300">
                            {data.map((variation) => (
                                <SortableRow
                                    key={variation.id}
                                    variation={variation}
                                    onEdit={onEdit}
                                    onDelete={(id) => setDeleteId(id)}
                                />
                            ))}
                        </tbody>
                    </SortableContext>
                </table>

                {/* Mobile Card View */}
                <SortableContext items={data.map(v => v.id)} strategy={verticalListSortingStrategy}>
                    <div className="md:hidden space-y-4 p-4">
                        {data.map((variation) => (
                            <SortableMobileCard
                                key={variation.id}
                                variation={variation}
                                onEdit={onEdit}
                                onDelete={(id) => setDeleteId(id)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <AlertDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => {
                    if (deleteId) onDelete(deleteId);
                    setDeleteId(null);
                }}
                isDestructive={true}
                title="Delete Variation"
                description="Are you sure you want to delete this variation? This action cannot be undone."
                confirmLabel="Delete Variation"
            />
        </div>
    );
}
