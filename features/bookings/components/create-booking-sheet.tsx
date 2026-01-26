"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SidePanel } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import { Loader2, Plus, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const BookingSchema = z.object({
    customer_id: z.string().min(1, "Customer is required"),
    pax_count: z.number().min(1, "At least 1 passenger required"),
    notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof BookingSchema>;

interface CreateBookingSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    availability: Availability | null;
}

export function CreateBookingSheet({ isOpen, onClose, onSuccess, availability }: CreateBookingSheetProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [customers, setCustomers] = useState<{ id: string, name: string, email: string }[]>([]);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isDirty } } = useForm<BookingFormData>({
        resolver: zodResolver(BookingSchema),
        defaultValues: {
            pax_count: 1,
            notes: ""
        }
    });

    // Reset form when availability changes or opens
    useEffect(() => {
        if (isOpen) {
            reset({ pax_count: 1, notes: "" });
        }
    }, [isOpen, reset]);

    // Fetch Customers
    useEffect(() => {
        if (!isOpen) return;
        const fetchCustomers = async () => {
            const { data } = await supabase.from('customers').select('id, name, email').eq('status', 'active').order('name');
            if (data) setCustomers(data);
        };
        fetchCustomers();
    }, [isOpen]);

    const onSubmit = async (data: BookingFormData) => {
        if (!availability) return;
        setIsLoading(true);
        try {
            const { error } = await supabase.from('bookings' as any).insert({
                availability_id: availability.id,
                customer_id: data.customer_id,
                pax_count: data.pax_count,
                notes: data.notes,
                status: 'confirmed'
            });

            if (error) throw error;
            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Failed to create booking");
        } finally {
            setIsLoading(false);
        }
    };

    if (!availability) return null;

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Booking"
            description="Add a booking for this availability slot."
            width="full-content"
            contentClassName="p-0"
        >
            <div className="p-6 h-full flex flex-col bg-transparent">
                <div className="text-sm text-zinc-400 mb-6 p-4 bg-white/5 rounded border border-zinc-800">
                    <div className="font-bold text-white mb-2 text-base flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-cyan-500" />
                        {availability.start_date} @ {availability.start_time ? new Date(`1970-01-01T${availability.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'All Day'}
                    </div>
                    <div className="flex flex-col gap-1 pl-6">
                        <div><span className="text-zinc-500">Vehicle:</span> <span className="text-zinc-300">{availability.vehicle_name || 'Unassigned'}</span></div>
                        <div><span className="text-zinc-500">Route:</span> <span className="text-zinc-300">{availability.route_name || 'Unassigned'}</span></div>
                        <div><span className="text-zinc-500">Capacity:</span> <span className="text-zinc-300">{availability.max_capacity} pax</span></div>
                    </div>
                </div>

                <form className="space-y-6 flex-1 overflow-y-auto">
                    {/* Customer Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white flex items-center gap-2">
                            <User size={16} className="text-cyan-500" />
                            Customer
                        </label>
                        <select
                            {...register("customer_id")}
                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none appearance-none"
                        >
                            <option value="">Select customer...</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                            ))}
                        </select>
                        {errors.customer_id && <p className="text-red-400 text-xs">{errors.customer_id.message}</p>}
                    </div>

                    {/* Pax Count */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white flex items-center gap-2">
                            <Users size={16} className="text-cyan-500" />
                            Passengers
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                {...register("pax_count", { valueAsNumber: true })}
                                className="w-24 bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
                                min={1}
                            />
                            <div className="text-xs text-zinc-500">
                                Total capacity: {availability.max_capacity}
                            </div>
                        </div>
                        {errors.pax_count && <p className="text-red-400 text-xs">{errors.pax_count.message}</p>}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Internal Notes</label>
                        <textarea
                            {...register("notes")}
                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none h-[100px]"
                            placeholder="Internal notes..."
                        />
                    </div>

                </form>

                {/* Footer pinned to bottom */}
                <div className="flex justify-end items-center gap-4 py-4 px-6 border-t border-white/10 mt-auto bg-zinc-950/40 backdrop-blur-md">
                    <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isLoading || !isDirty}
                        className={cn(
                            "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                            isLoading ? "bg-cyan-500/50 text-white cursor-not-allowed" :
                                isDirty ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]" :
                                    "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                        )}
                    >
                        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> :
                            isDirty ? "Create Booking" :
                                "No Changes"}
                    </Button>
                </div>
            </div>
        </SidePanel>
    );
}

function CalendarIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
    )
}
