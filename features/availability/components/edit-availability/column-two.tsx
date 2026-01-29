"use client";

import { useFormContext } from "react-hook-form";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/custom-select";
import { ResourceClusterList, Assignment } from "./resource-cluster-list";

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 text-cyan-400 border-b border-white/10 pb-2 mb-4 mt-2">
        <Icon size={16} />
        <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
    </div>
);

interface ColumnTwoProps {
    pricingSchedules: { id: string; name: string }[];
    pricingVariations: { id: string; name: string }[];
    transportationSchedules: { id: string; name: string }[];
    vehicles: { id: string; name: string; capacity?: number }[];
    staff: { id: string; name: string; role: { name: string } | null }[];
    assignments: Assignment[];
    onAssignmentsChange: (assignments: Assignment[]) => void;
}

export function ColumnTwo({
    pricingSchedules,
    pricingVariations,
    transportationSchedules,
    vehicles,
    staff,
    assignments,
    onAssignmentsChange
}: ColumnTwoProps) {
    const { register, watch, setValue } = useFormContext();

    const maxCapacity = watch("max_capacity") || 0;

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Sticky Header */}
            <div className="shrink-0 bg-white/5 backdrop-blur-md border-b border-white/5 sticky top-0 z-10 w-full animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 px-6 py-4">
                    <Users size={16} className="text-cyan-400" />
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Capacity & Resources</span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8 animate-in fade-in duration-300 delay-200">
                    {/* Capacity & Pricing Section */}
                    <div className="space-y-5">


                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Max Capacity</label>
                            <input
                                type="number"
                                {...register("max_capacity")}
                                className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-400/50 focus:outline-none transition-colors"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Default Pricing Schedule</label>
                            <CustomSelect
                                value={watch("pricing_schedule_id") || undefined}
                                onChange={(val) => setValue("pricing_schedule_id", val, { shouldValidate: true })}
                                options={[
                                    { value: "", label: "Select Schedule..." },
                                    ...pricingSchedules.map(s => ({ value: s.id, label: s.name }))
                                ]}
                                placeholder="Select Schedule..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Default Pricing Variation</label>
                            <CustomSelect
                                value={watch("pricing_tier_id") || undefined}
                                onChange={(val) => setValue("pricing_tier_id", val, { shouldValidate: true })}
                                options={[
                                    { value: "", label: "Select Variation..." },
                                    ...pricingVariations.map(s => ({ value: s.id, label: s.name }))
                                ]}
                                placeholder="Select Variation..."
                            />
                        </div>
                    </div>

                    <div className="h-px bg-white/5 my-6" />

                    {/* Resources Section (Clustered) */}
                    <div>

                        <ResourceClusterList
                            assignments={assignments}
                            onChange={onAssignmentsChange}
                            vehicles={vehicles}
                            routes={transportationSchedules}
                            staff={staff}
                            maxCapacity={Number(maxCapacity)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
