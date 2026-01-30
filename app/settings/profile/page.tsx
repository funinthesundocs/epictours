"use client";

import { PageShell } from "@/components/shell/page-shell";
import { User, Mail, Save, Loader2, Key } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UserProfilePage() {
    const { user, refreshUser } = useAuth(); // Assuming refreshUser exists or we just rely on local state update
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, setValue } = useForm({
        defaultValues: {
            name: "",
            email: "",
            phone_number: "",
            // avatar_url: "" // Upload logic separate
        }
    });

    useEffect(() => {
        const fetchUser = async () => {
            if (!user?.id) return;
            setIsLoading(true);
            const { data, error } = await supabase
                .from("users")
                .select("name, email, phone_number")
                .eq("id", user.id)
                .single();

            if (data) {
                setValue("name", data.name);
                setValue("email", data.email);
                setValue("phone_number", data.phone_number || "");
            }
            setIsLoading(false);
        };
        fetchUser();
    }, [user?.id, setValue]);

    const onSubmit = async (data: any) => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("users")
                .update({
                    name: data.name,
                    phone_number: data.phone_number
                    // Email usually requires re-verification, so we might skip it or handle specially
                })
                .eq("id", user.id);

            if (error) throw error;
            toast.success("Profile updated");
            // refreshUser(); // If available
        } catch (err) {
            console.error("Error updating profile:", err);
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <PageShell
            title="My Profile"
            description="Manage your personal account settings."
            stats={[
                { label: "Account Type", value: user?.isPlatformAdmin ? "Platform Admin" : "User", icon: User },
                { label: "Email", value: user?.email || "N/A", icon: Mail },
            ]}
        >
            <div className="max-w-2xl mx-auto p-6 bg-card rounded-xl border border-border">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input {...register("name", { required: true })} placeholder="John Doe" />
                    </div>

                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input {...register("email")} disabled className="bg-muted opacity-70 cursor-not-allowed" />
                        <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input {...register("phone_number")} placeholder="+1 (555) 000-0000" />
                    </div>

                    <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <Key size={16} /> Security
                        </h3>
                        <Button variant="outline" type="button" onClick={() => toast.info("Password reset flow to be implemented")}>
                            Change Password
                        </Button>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border mt-4">
                        <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                            Save Profile
                        </Button>
                    </div>
                </form>
            </div>
        </PageShell>
    );
}
