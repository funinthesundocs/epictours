"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { AvailabilityCalendarWrapper } from "@/features/availability/components/availability-calendar-wrapper";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CalendarsPage() {
    const [experiences, setExperiences] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const { data } = await supabase.from("experiences").select("id, name, short_code").order("name");
            if (data) setExperiences(data);
            setIsLoading(false);
        }
        load();
    }, []);

    return (
        <PageShell
            title="Calendars"
            description="Master schedule view for all operations."
            stats={[
                { label: "Today's Events", value: "4", icon: Calendar },
                { label: "Pending Approvals", value: "2", icon: Clock, trend: "Urgent" },
            ]}
        >
            {isLoading ? (
                <div className="flex h-[600px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
            ) : (
                <div className="h-[800px]">
                    <AvailabilityCalendarWrapper experiences={experiences} />
                </div>
            )}
        </PageShell>
    );
}
