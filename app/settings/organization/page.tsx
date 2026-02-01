"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Building2, MapPin, Globe, Loader2, Save } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OrganizationPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, setValue } = useForm({
        defaultValues: {
            name: "",
            // Add placeholder fields for now if schema doesn't support them yet
            // address: "", 
            // website: ""
        }
    });

    useEffect(() => {
        const fetchOrg = async () => {
            // Need to wait for auth to load
            if (!user) {
                // If auth is loaded and still no user, or user has no org and we decide to stop loading
                // For now, we rely on page shell auth guard, but handle 'no org id' specifically.
                return;
            }

            if (!user.organizationId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from("organizations")
                    .select("name, status")
                    .eq("id", user.organizationId)
                    .single();

                if (data) {
                    setValue("name", data.name);
                }
            } catch (err) {
                console.error("OrganizationPage: Error updating organization:", JSON.stringify(err, null, 2));
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrg();
    }, [user, user?.organizationId, setValue]);

    const onSubmit = async (data: any) => {
        if (!user?.organizationId) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("organizations")
                .update({ name: data.name })
                .eq("id", user.organizationId);

            if (error) throw error;
            toast.success("Organization profile updated");
        } catch (err) {
            console.error("OrganizationPage: Error updating organization:", JSON.stringify(err, null, 2));
            toast.error("Failed to update organization");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingState message="Loading organization..." size="lg" />
            </div>
        );
    }

    return (
        <PageShell
            title="Organization Profile"
            description="Manage company details and branding."
            stats={[
                { label: "Organization ID", value: user?.organizationId?.slice(0, 8) + "...", icon: Building2 },
                { label: "Status", value: "Active", icon: Globe }, // Placeholder for status
            ]}
        >
            <div className="max-w-2xl mx-auto p-6 bg-card rounded-xl border border-border">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Organization Name</Label>
                        <Input {...register("name", { required: true })} placeholder="Epic Tours LLC" />
                    </div>

                    {/* Placeholder for future fields */}
                    <div className="p-4 bg-muted/30 rounded-lg border border-border text-sm text-muted-foreground">
                        <p>More fields (Logo, Address, Website) coming soon with schema updates.</p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </PageShell>
    );
}
