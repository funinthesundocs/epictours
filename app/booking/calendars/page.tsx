"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Calendar, Clock } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
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
                <LoadingState className="h-[600px]" />
            ) : (
                <div className="h-[800px]">
                    <AvailabilityCalendarWrapper experiences={experiences} />
                </div>
            )}
        </PageShell>
    );
}
