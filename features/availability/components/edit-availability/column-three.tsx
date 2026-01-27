"use client";

import { useFormContext } from "react-hook-form";
import { Settings2 } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ColumnThreeProps {
    bookingSchedules: { id: string; name: string }[];
}

export function ColumnThree({ bookingSchedules }: ColumnThreeProps) {
    const { register, watch, setValue } = useFormContext();

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Sticky Header */}
            <div className="shrink-0 bg-white/5 backdrop-blur-md border-b border-white/5 sticky top-0 z-10 w-full animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 px-6 py-4">
                    <Settings2 size={16} className="text-cyan-500" />
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Options & Settings</span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8 animate-in fade-in duration-300 delay-300">
                    {/* Booking & Pricing Section */}
                    <div className="space-y-5">


                        {/* Online Booking Status (Switch) */}
                        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-sm text-zinc-400">
                                    Online Booking
                                </Label>
                                <div className="text-sm text-zinc-500">
                                    {watch("online_booking_status") === "open" ? "Available for online booking" : "Not available online"}
                                </div>
                            </div>
                            <Switch
                                checked={watch("online_booking_status") === "open"}
                                onCheckedChange={(checked) => setValue("online_booking_status", checked ? "open" : "closed", { shouldValidate: true })}
                                className="data-[state=checked]:bg-cyan-500"
                            />
                        </div>
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
                    </div>



                    {/* Notes Section */}
                    <div>

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
            </div>
        </div>
    );
}
