"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Save, Loader2, DollarSign, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CompensationSheetProps {
    isOpen: boolean;
    onClose: () => void;
    staffId: string | null;
    staffName: string;
}

export function CompensationSheet({ isOpen, onClose, staffId, staffName }: CompensationSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue
    } = useForm({
        defaultValues: {
            rate_per_hour: null,
            rate_per_day: null,
            rate_per_trip: null,
            rate_per_customer: null,
            percent_gross: null,
            percent_profit: null,
            salary: null
        }
    });

    // Fetch Compensation Data
    useEffect(() => {
        if (isOpen && staffId) {
            const fetchComp = async () => {
                setIsLoading(true);
                const { data } = await supabase
                    .from("staff_compensation" as any)
                    .select("*")
                    .eq("staff_id", staffId)
                    .single();

                if (data) {
                    reset({
                        rate_per_hour: data.rate_per_hour,
                        rate_per_day: data.rate_per_day,
                        rate_per_trip: data.rate_per_trip,
                        rate_per_customer: data.rate_per_customer,
                        percent_gross: data.percent_gross,
                        percent_profit: data.percent_profit,
                        salary: data.salary
                    });
                } else {
                    reset({
                        rate_per_hour: null,
                        rate_per_day: null,
                        rate_per_trip: null,
                        rate_per_customer: null,
                        percent_gross: null,
                        percent_profit: null,
                        salary: null
                    });
                }
                setIsLoading(false);
            };
            fetchComp();
        }
    }, [isOpen, staffId, reset]);

    const onSubmit = async (data: any) => {
        if (!staffId) return;
        setIsSubmitting(true);
        try {
            // Helper to clean empty strings to null
            const clean = (val: any) => (val === "" || val === undefined ? null : Number(val));

            const payload = {
                staff_id: staffId,
                rate_per_hour: clean(data.rate_per_hour),
                rate_per_day: clean(data.rate_per_day),
                rate_per_trip: clean(data.rate_per_trip),
                rate_per_customer: clean(data.rate_per_customer),
                percent_gross: clean(data.percent_gross),
                percent_profit: clean(data.percent_profit),
                salary: clean(data.salary),
                updated_at: new Date().toISOString()
            };

            // Check if exists first to decide update vs insert (technically upsert works too with conflict on id, but staff_id checks are safer manual)
            // Using UPSERT on staff_id if we had a unique constraint, but logic here:
            // Let's use Upsert based on staff_id if possible, but staff_id might not be unique in schema unless defined.
            // Safe bet: Delete existing for this staff_id and Insert new, OR check existence.
            // Query first.
            const { data: existing } = await supabase.from("staff_compensation").select("id").eq("staff_id", staffId).single();

            if (existing) {
                const { error } = await supabase.from("staff_compensation").update(payload).eq("staff_id", staffId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("staff_compensation").insert([payload]);
                if (error) throw error;
            }

            onClose();
        } catch (err) {
            console.error("Error saving compensation:", err);
            alert("Failed to save compensation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 text-primary border-b border-border pb-2 mb-6 mt-2">
            <Icon size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
        </div>
    );

    const CurrencyInput = ({ label, name }: { label: string, name: any }) => (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" step="0.01" {...register(name)} className="pl-6 font-mono" placeholder="0.00" />
            </div>
        </div>
    );

    const PercentInput = ({ label, name }: { label: string, name: any }) => (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                <Input type="number" step="0.01" {...register(name)} className="pr-6 font-mono" placeholder="0.00" />
            </div>
        </div>
    );

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title="Compensation Rates"
            description={`Manage payment structure for ${staffName}.`}
            width="max-w-lg"
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-8">
                        <div>
                            <SectionHeader icon={Wallet} title="Standard Rates" />
                            <div className="grid grid-cols-2 gap-6">
                                <CurrencyInput label="Rate / Hour" name="rate_per_hour" />
                                <CurrencyInput label="Rate / Day" name="rate_per_day" />
                                <CurrencyInput label="Rate / Trip" name="rate_per_trip" />
                                <CurrencyInput label="Rate / Customer" name="rate_per_customer" />
                            </div>
                        </div>

                        <div>
                            <SectionHeader icon={DollarSign} title="Commission & Salary" />
                            <div className="grid grid-cols-2 gap-6">
                                <PercentInput label="% of Gross" name="percent_gross" />
                                <PercentInput label="% of Profit" name="percent_profit" />
                                <div className="col-span-2">
                                    <CurrencyInput label="Base Salary (Annual/Monthly)" name="salary" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-4 py-4 px-6 border-t border-border mt-auto bg-background">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Save Rates
                        </Button>
                    </div>

                </form>
            )}
        </SidePanel>
    );
}
