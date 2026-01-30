// Master Report Types - Comprehensive

export interface MasterReportRow {
    // Booking fields
    booking_id: string;
    confirmation_number: string | null;
    booking_status: string;
    pax_count: number;
    total_amount: number;
    amount_paid: number;
    balance_due: number; // computed
    payment_status: string;
    voucher_numbers: string | null;
    notes: string | null;
    booking_created_at: string;

    // Customer fields
    customer_id: string;
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    customer_hotel: string | null;
    customer_source: string | null;
    customer_status: string | null;
    customer_total_value: number;
    preferred_messaging_app: string | null;
    dietary_restrictions: string | null;
    accessibility_needs: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;

    // Experience fields
    experience_id: string;
    experience_code: string;
    experience_name: string;

    // Availability fields
    availability_id: string;
    start_date: string;
    start_time: string;
    max_capacity: number;

    // Staff & Resources
    driver_id: string | null;
    driver_name: string | null;
    guide_id: string | null;
    guide_name: string | null;
    vehicle_id: string | null;
    vehicle_name: string | null;
    route_id: string | null;
    route_name: string | null;

    // Pickup info
    pickup_location: string | null;
    pickup_time: string | null;
}

export interface ReportPreset {
    id: string;
    name: string;
    description: string | null;
    config: PresetConfig;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface PresetConfig {
    visibleColumns: string[];
    columnOrder: string[];
    sortConfig: { key: string; direction: "asc" | "desc" } | null;
    filters: ReportFilters;
    searchQuery: string;
}

export interface ReportFilters {
    dateRange: { start: string; end: string } | null;
    dateField: "start_date" | "booking_created_at";
    experiences: string[];
    paymentStatus: string[];
    bookingStatus: string[];
}

export type ColumnConfig = {
    key: string;
    label: string;
    sortKey?: string;
    width?: string;
    align?: "left" | "center" | "right";
    format?: "text" | "date" | "currency" | "phone";
};
