"use client";

import { Edit2, Trash2, Search, Layers, GripVertical } from "lucide-react";
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
            className="hover:bg-white/5 transition-colors group"
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
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                        <Layers size={16} />
                    </div>
                    {variation.name}
                </div>
            </td>

            {/* Actions - Always Visible */}
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => onEdit(variation)}
                        className="p-2 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg transition-colors"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(variation.id)}
                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

export function PricingVariationsTable({ data, onEdit, onDelete, onReorder }: PricingVariationsTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
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
                <table className="w-full text-left">
                    <thead className="bg-white/5 backdrop-blur-sm text-zinc-400 text-xs uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4 font-medium">Variation Name</th>
                            <th className="px-6 py-4 font-medium text-right w-[100px]">Actions</th>
                        </tr>
                    </thead>
                    <SortableContext items={data.map(v => v.id)} strategy={verticalListSortingStrategy}>
                        <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
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
