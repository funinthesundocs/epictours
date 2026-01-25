"use client";

import { useFormContext } from "react-hook-form";
import { DollarSign, MessageSquare } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 text-cyan-400 border-b border-white/10 pb-2 mb-4 mt-2">
        <Icon size={16} />
        <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
    </div>
);

interface ColumnThreeProps {
    bookingSchedules: { id: string; name: string }[];
}

export function ColumnThree({ bookingSchedules }: ColumnThreeProps) {
    const { register, watch, setValue } = useFormContext();

    return (
        <div className="space-y-8 animate-in fade-in duration-300 delay-300">
            {/* Booking & Pricing Section */}
            <div>
                <SectionHeader icon={DollarSign} title="Booking & Settings" />
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Default Booking Options Schedule</label>
                        <CustomSelect
                            value={watch("booking_option_schedule_id") || undefined}
                            onChange={(val) => setValue("booking_option_schedule_id", val, { shouldValidate: true })}
                            options={[
                                { value: "", label: "Select Schedule..." },
                                ...bookingSchedules.map(s => ({ value: s.id, label: s.name }))
                            ]}
                            placeholder="Select Schedule..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Default Booking Options Variation</label>
                        <CustomSelect
                            value={watch("booking_option_variation")}
                            onChange={(val) => setValue("booking_option_variation", val, { shouldValidate: true })}
                            options={[
                                { value: "retail", label: "Retail Options" },
                                { value: "online", label: "Online Options" },
                                { value: "special", label: "Special Options" },
                                { value: "custom", label: "Custom Options" }
                            ]}
                            placeholder="Select Variation..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Online Booking Status</label>
                        <CustomSelect
                            value={watch("online_booking_status")}
                            onChange={(val) => setValue("online_booking_status", val, { shouldValidate: true })}
                            options={[
                                { value: "open", label: "Open" },
                                { value: "closed", label: "Closed" }
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* Notes Section */}
            <div>
                <SectionHeader icon={MessageSquare} title="Internal Notes" />
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Private Announcement</label>
                    <textarea
                        {...register("private_announcement")}
                        rows={4}
                        className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none resize-none transition-colors"
                        placeholder="Internal notes for this availability..."
                    />
                </div>
            </div>
        </div>
    );
}
