"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Customer } from "@/features/bookings/types";
import { Loader2 } from "lucide-react";

interface QuickAddCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    customerToEdit?: Customer | null;
    onCustomerUpdated?: (customer: Customer) => void;
    onCustomerCreated: (customer: Customer) => void;
}

export function QuickAddCustomerDialog({ isOpen, onOpenChange, onCustomerCreated, customerToEdit, onCustomerUpdated }: QuickAddCustomerDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // Effect: Reset or Populate form when dialog opens or customer changes
    useEffect(() => {
        if (isOpen) {
            if (customerToEdit) {
                setName(customerToEdit.name || "");
                setEmail(customerToEdit.email || "");
                setPhone(customerToEdit.phone || "");
            } else {
                setName("");
                setEmail("");
                setPhone("");
            }
            setError(null);
        }
    }, [isOpen, customerToEdit]);

    const handleSave = async () => {
        // Validation
        if (!name.trim() || !email.trim()) {
            setError("Name and Email are required.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (customerToEdit) {
                // EDIT MODE
                const { data, error: updateError } = await supabase
                    .from('customers')
                    .update({
                        name,
                        email,
                        phone: phone || undefined,
                        // Not updating status or created_at
                    })
                    .eq('id', customerToEdit.id)
                    .select()
                    .single();

                if (updateError) throw updateError;

                if (data) {
                    onCustomerUpdated?.({
                        id: data.id,
                        name: data.name,
                        email: data.email,
                        phone: data.phone || undefined,
                        status: data.status as any // casting to satisfy strict check if needed, or just status if types align
                    });
                    onOpenChange(false);
                }
            } else {
                // CREATE MODE
                const { data, error: insertError } = await supabase
                    .from('customers')
                    .insert({
                        name,
                        email,
                        phone: phone || undefined,
                        status: 'active', // Default to active for new quick adds
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                if (data) {
                    onCustomerCreated({
                        id: data.id,
                        name: data.name,
                        email: data.email,
                        phone: data.phone || undefined, // Ensure phone is mapped if present in type
                        status: data.status as any
                    });
                    onOpenChange(false);
                }
            }
        } catch (err: any) {
            console.error("Error saving customer:", err);
            setError(err.message || "Failed to save customer.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{customerToEdit ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {customerToEdit ? "Update customer details below." : "Quickly add a new customer to the database."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Name */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right text-zinc-400">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3 bg-zinc-900 border-zinc-700 focus-visible:ring-cyan-400"
                            placeholder="John Doe"
                        />
                    </div>

                    {/* Email */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right text-zinc-400">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="col-span-3 bg-zinc-900 border-zinc-700 focus-visible:ring-cyan-400"
                            placeholder="john@example.com"
                        />
                    </div>

                    {/* Phone */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right text-zinc-400">
                            Phone
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="col-span-3 bg-zinc-900 border-zinc-700 focus-visible:ring-cyan-400"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-cyan-600 hover:bg-cyan-400 text-white"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {customerToEdit ? "Update Customer" : "Save Customer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
