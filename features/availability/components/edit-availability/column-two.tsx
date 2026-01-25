"use client";

import { useFormContext } from "react-hook-form";
import { Users, Truck, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/custom-select";

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
    vehicles: { id: string; name: string }[];
    staff: { id: string; name: string; role: { name: string } | null }[];
}

export function ColumnTwo({
    pricingSchedules,
    pricingVariations,
    transportationSchedules,
    vehicles,
    staff
}: ColumnTwoProps) {
    const { register, watch, setValue } = useFormContext();

    const staffIds = watch("staff_ids");

    // Toggle staff
    const toggleStaff = (id: string) => {
        const current = staffIds || [];
        if (current.includes(id)) {
            setValue("staff_ids", current.filter((s: string) => s !== id));
        } else {
            setValue("staff_ids", [...current, id]);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300 delay-200">
            {/* Capacity & Pricing Section */}
            <div>
                <SectionHeader icon={Users} title="Capacity & Pricing" />
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Max Capacity</label>
                        <input
                            type="number"
                            {...register("max_capacity")}
                            className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
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
            </div>

            {/* Resources Section */}
            <div>
                <SectionHeader icon={Truck} title="Resources" />
                <div className="space-y-5">

                    {/* Route */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Route Schedule</label>
                        <CustomSelect
                            value={watch("transportation_route_id") || undefined}
                            onChange={(val) => setValue("transportation_route_id", val || null, { shouldValidate: true })}
                            options={[
                                { value: "", label: "No Route" },
                                ...transportationSchedules.map(s => ({ value: s.id, label: s.name }))
                            ]}
                            placeholder="Select Route Schedule..."
                        />
                    </div>

                    {/* Vehicle */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Vehicle</label>
                        <CustomSelect
                            value={watch("vehicle_id") || undefined}
                            onChange={(val) => setValue("vehicle_id", val || null, { shouldValidate: true })}
                            options={[
                                { value: "", label: "No Vehicle" },
                                ...vehicles.map(v => ({ value: v.id, label: v.name }))
                            ]}
                            placeholder="Select Vehicle..."
                        />
                    </div>

                    {/* Staff Section */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Assigned Staff</label>
                        <div className="flex flex-wrap gap-2">
                            {staff.map(member => (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => toggleStaff(member.id)}
                                    className={cn(
                                        "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                                        staffIds?.includes(member.id)
                                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                                            : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-900"
                                    )}
                                >
                                    {member.name} ({member.role?.name || 'Staff'})
                                </button>
                            ))}
                            {staff.length === 0 && (
                                <span className="text-zinc-500 text-sm">No staff configured</span>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
