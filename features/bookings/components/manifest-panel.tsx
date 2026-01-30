"use client";

import { SidePanel } from "@/components/ui/side-panel";
import { Availability } from "@/features/availability/components/availability-list-table";
import { Construction, FileText, Map, Clock, Users, Bus } from "lucide-react";

interface ManifestPanelProps {
    isOpen: boolean;
    onClose: () => void;
    availability: Availability | null;
}

export function ManifestPanel({ isOpen, onClose, availability }: ManifestPanelProps) {
    if (!availability) return null;

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title="Transport Manifest"
            description={`${availability.experience_name || 'Experience'} on ${(() => {
                const [y, m, d] = availability.start_date.split('-');
                return `${m}-${d}-${y}`;
            })()}`}
            width="max-w-lg"
        >
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-6">
                    <Construction size={48} className="text-primary" />
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-3">
                    Coming Soon
                </h2>

                <p className="text-muted-foreground text-sm max-w-md mb-8">
                    The Transport Manifest feature is under development.
                    It will show a complete pickup schedule with customer details,
                    hotel pickup times, and vehicle assignments.
                </p>

                {/* Preview of what's coming */}
                <div className="w-full max-w-md space-y-3">
                    <div className="bg-muted/50 rounded-lg p-4 border border-border flex items-center gap-4">
                        <FileText size={20} className="text-primary" />
                        <div className="text-left">
                            <div className="text-foreground font-medium text-sm">Passenger List</div>
                            <div className="text-muted-foreground text-xs">All customers with contact info</div>
                        </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 border border-border flex items-center gap-4">
                        <Map size={20} className="text-primary" />
                        <div className="text-left">
                            <div className="text-foreground font-medium text-sm">Pickup Route</div>
                            <div className="text-muted-foreground text-xs">Hotels in order with times</div>
                        </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 border border-border flex items-center gap-4">
                        <Bus size={20} className="text-primary" />
                        <div className="text-left">
                            <div className="text-foreground font-medium text-sm">Vehicle Info</div>
                            <div className="text-muted-foreground text-xs">Assigned vehicle and driver</div>
                        </div>
                    </div>
                </div>
            </div>
        </SidePanel>
    );
}
