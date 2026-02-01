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
                // EDIT MODE - First get customer's user_id, then update user
                const { data: customer } = await supabase
                    .from('customers')
                    .select('user_id')
                    .eq('id', customerToEdit.id)
                    .single();

                if (customer?.user_id) {
                    // Update user identity data
                    await supabase
                        .from('users')
                        .update({
                            name,
                            email,
                            phone_number: phone || null,
                        })
                        .eq('id', customer.user_id);
                }

                // Return the updated customer info
                onCustomerUpdated?.({
                    id: customerToEdit.id,
                    name,
                    email,
                    phone: phone || undefined,
                    status: customerToEdit.status
                });
                onOpenChange(false);
            } else {
                // CREATE MODE - First create user, then create customer with user_id
                // Check for duplicate email
                const { data: existing } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', email)
                    .maybeSingle();

                if (existing) {
                    setError("A user with this email already exists.");
                    setIsLoading(false);
                    return;
                }

                // Create user first
                const { data: newUser, error: userError } = await supabase
                    .from('users')
                    .insert({
                        name,
                        email,
                        phone_number: phone || null,
                    })
                    .select('id')
                    .single();

                if (userError) throw userError;

                // Create customer linked to user
                const { data, error: insertError } = await supabase
                    .from('customers')
                    .insert({
                        user_id: newUser.id,
                        status: 'active',
                        created_at: new Date().toISOString()
                    })
                    .select('id')
                    .single();

                if (insertError) throw insertError;

                if (data) {
                    onCustomerCreated({
                        id: data.id,
                        name,
                        email,
                        phone: phone || undefined,
                        status: 'active' as any
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
            <DialogContent className="bg-background border-border text-foreground sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{customerToEdit ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {customerToEdit ? "Update customer details below." : "Quickly add a new customer to the database."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Name */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right text-muted-foreground">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3 bg-muted/50 border-input focus-visible:ring-ring"
                            placeholder="John Doe"
                        />
                    </div>

                    {/* Email */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right text-muted-foreground">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="col-span-3 bg-muted/50 border-input focus-visible:ring-ring"
                            placeholder="john@example.com"
                        />
                    </div>

                    {/* Phone */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right text-muted-foreground">
                            Phone
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="col-span-3 bg-muted/50 border-input focus-visible:ring-ring"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    {error && (
                        <div className="text-destructive text-sm text-center">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {customerToEdit ? "Update Customer" : "Save Customer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
