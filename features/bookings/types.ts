export interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: 'active' | 'archived';
}

export interface PricingSchedule {
    id: string;
    name: string;
}

export interface PricingTier {
    name: string;
    sort_order: number;
}

export interface PricingRate {
    customer_type_id: string;
    customer_type_name?: string;
    price: number;
    tax_percentage?: number;
    tier: string;
}

export interface BookingOption {
    id: string;
    label: string;
    price: number;
    description?: string;
    // For custom field linking
    field_id?: string;
    required?: boolean;
    is_public?: boolean;
    // Resolved from custom_fields
    type?: string;
    options?: any;
}

export interface BookingOptionSchedule {
    id: string;
    name: string;
    config_retail?: BookingOption[];
    config_online?: BookingOption[];
    config_special?: BookingOption[];
    config_custom?: BookingOption[];
}

export type PaymentStatus = 'paid_full' | 'paid_partial' | 'pay_later' | 'no_payment';
export type PaymentMethod = 'credit_card' | 'cash' | 'crypto';

export interface PaymentState {
    status: PaymentStatus;
    method: PaymentMethod;
    amount: number; // The amount currently being paid (e.g. deposit or full)
    details?: any; // Card token, or generic object
    overrideTotal?: number; // Manual price override
    promoCode?: string; // Applied promo code
}
