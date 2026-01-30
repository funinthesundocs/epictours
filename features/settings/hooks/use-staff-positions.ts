"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface StaffPosition {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    default_role_id: string | null; // Permission Group ID
}

export function useStaffPositions() {
    const [positions, setPositions] = useState<StaffPosition[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPositions = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("staff_positions")
                .select("*")
                .order("name");

            if (error) {
                console.error("Error fetching staff positions:", error);
            } else {
                setPositions(data || []);
            }
            setIsLoading(false);
        };

        fetchPositions();
    }, []);

    return { positions, isLoading };
}
