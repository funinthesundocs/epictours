"use client";

import { useFormContext } from "react-hook-form";
import { CalendarDays, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomSelect } from "@/components/ui/custom-select";
import { TimePicker } from "@/components/ui/time-picker";
import { format } from "date-fns";

const DAYS_OF_WEEK = [
    { key: "SUN", label: "S" },
    { key: "MON", label: "M" },
    { key: "TUE", label: "T" },
    { key: "WED", label: "W" },
    { key: "THU", label: "T" },
    { key: "FRI", label: "F" },
    { key: "SAT", label: "S" },
];

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 text-cyan-400 border-b border-white/10 pb-2 mb-4 mt-2">
        <Icon size={16} />
        <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
    </div>
);

export function ColumnOne() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();

    const isRepeating = watch("is_repeating");
    const durationType = watch("duration_type");
    const repeatDays = watch("repeat_days");

    // Toggle day in repeat_days array
    const toggleDay = (day: string) => {
        const current = repeatDays || [];
        if (current.includes(day)) {
            setValue("repeat_days", current.filter((d: string) => d !== day));
        } else {
            setValue("repeat_days", [...current, day]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Sticky Header */}
            <div className="shrink-0 bg-white/5 backdrop-blur-md border-b border-white/5 sticky top-0 z-10 w-full animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 px-6 py-4">
                    <CalendarDays size={16} className="text-cyan-500" />
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Schedule</span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8 animate-in fade-in duration-300 delay-100">
                    {/* Schedule Section */}
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Start Date</label>
                            <DatePicker
                                value={watch("start_date") ? new Date(watch("start_date") + "T00:00:00") : undefined}
                                onChange={(date) => setValue("start_date", date ? format(date, "yyyy-MM-dd") : "", { shouldValidate: true })}
                                placeholder="Select start date"
                                className="bg-zinc-900/80"
                            />
                            {errors.start_date && <p className="text-red-400 text-xs mt-1">{errors.start_date?.message as string}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Repeat?</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setValue("is_repeating", false)}
                                    className={cn(
                                        "flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                                        !isRepeating
                                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                                            : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-900"
                                    )}
                                >
                                    Don't Repeat
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setValue("is_repeating", true);
                                        if (!repeatDays || repeatDays.length === 0) {
                                            setValue("repeat_days", DAYS_OF_WEEK.map(d => d.key));
                                        }
                                    }}
                                    className={cn(
                                        "flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                                        isRepeating
                                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                                            : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-900"
                                    )}
                                >
                                    <Repeat size={14} />
                                    Repeat
                                </button>
                            </div>
                        </div>

                        {isRepeating && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Repeat On</label>
                                    <div className="flex gap-1.5">
                                        {DAYS_OF_WEEK.map(day => (
                                            <button
                                                key={day.key}
                                                type="button"
                                                onClick={() => toggleDay(day.key)}
                                                className={cn(
                                                    "w-9 h-9 rounded-lg border text-xs font-bold transition-all",
                                                    repeatDays?.includes(day.key)
                                                        ? "bg-cyan-500 border-cyan-400 text-black shadow-lg shadow-cyan-500/20"
                                                        : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-900"
                                                )}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">End Date</label>
                                    <DatePicker
                                        value={watch("end_date") ? new Date(watch("end_date") + "T00:00:00") : undefined}
                                        onChange={(date) => setValue("end_date", date ? format(date, "yyyy-MM-dd") : "", { shouldValidate: true })}
                                        placeholder="Select end date"
                                        className="bg-zinc-900/80"
                                    />
                                </div>
                            </>
                        )}
                    </div>



                    {/* Duration Section */}
                    <div className="space-y-5">


                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Duration Type</label>
                            <CustomSelect
                                value={durationType}
                                onChange={(val) => setValue("duration_type", val)}
                                options={[
                                    { value: "all_day", label: "All Day" },
                                    { value: "time_range", label: "Time Range" }
                                ]}
                            />
                        </div>

                        {durationType === "time_range" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Start Time</label>
                                    <TimePicker
                                        value={watch("start_time")}
                                        onChange={(time) => setValue("start_time", time)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Hours Long</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        {...register("hours_long")}
                                        className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                                        placeholder="e.g., 2.5"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
