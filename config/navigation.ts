import {
    LayoutDashboard,
    Inbox,
    Calendar,
    Activity, // Added
    CalendarClock,
    CalendarRange, // Bookings
    Map,           // Tours
    Bus,           // Transportation/Vehicles
    MapPin,        // Pickup Points
    Building2,     // Hotels / Org
    Users,         // Staff
    Phone,
    Bot,
    Headset,
    Layers,        // HighLevel
    CloudCog,      // OTA
    Globe,         // Website
    Share2,        // Social
    PenTool,       // Blog
    Receipt,       // Billing
    Landmark,      // Bank
    Handshake,     // Partners
    PieChart,      // Reports
    UserCog,       // Users Settings
    Shield,        // Permissions
    Layout,        // Dash Settings
    LayoutTemplate,
    Coins,
    Settings,
    List,
    Palette,
    UserCheck      // Check-In Statuses
} from "lucide-react";
import type { ModuleCode, PermissionAction } from "@/features/auth/types";

export interface NavigationItem {
    title: string;
    href: string;
    icon: any;
    children?: NavigationItem[];
    // Permission requirements
    requiredModule?: ModuleCode;
    requiredPermission?: {
        resource: string;
        action: PermissionAction;
    };
    // If true, only platform admins can see this
    platformAdminOnly?: boolean;
    // If true, only organization admins can see this
    organizationAdminOnly?: boolean;
    // If true, this item requires an org context to be visible (for platform admins)
    requiresOrgContext?: boolean;
}

export interface NavSection {
    title?: string; // If present, this is a Collapsible Heading
    items: NavigationItem[];
    // If defined, this entire section requires the module
    requiredModule?: ModuleCode;
}

export const navigation: NavSection[] = [
    {
        items: [ // Top level items (Always visible)
            {
                title: "Overview",
                href: "/",
                icon: LayoutDashboard,
            },
            {
                title: "Inbox",
                href: "/inbox",
                icon: Inbox,
            },
            {
                title: "All Customers",
                href: "/crm/customers",
                icon: Users,
                requiredModule: "crm"
            }
        ]
    },
    {
        title: "Booking Platform",
        requiredModule: "bookings",
        items: [
            {
                title: "Availabilities",
                href: "/booking/availability",
                icon: Calendar,
                requiredModule: "bookings"
            },
            {
                title: "Bookings",
                href: "/booking/bookings",
                icon: CalendarRange,
                requiredModule: "bookings"
            },
            { title: "Experiences", href: "/booking/tours", icon: Map, requiredModule: "bookings", requiresOrgContext: true },
            {
                title: "Transportation",
                href: "/booking/transportation",
                icon: Bus,
                requiredModule: "bookings",
                children: [
                    { title: "Vehicles", href: "/booking/transportation/vehicles", icon: Bus, requiredModule: "bookings" },
                    { title: "Vendors", href: "/booking/transportation/vendors", icon: Handshake, requiredModule: "bookings" },
                    { title: "Pickup Points", href: "/booking/transportation/pickup-points", icon: MapPin, requiredModule: "bookings" },
                    { title: "Hotel List", href: "/booking/transportation/hotels", icon: Building2, requiredModule: "bookings" },
                    { title: "Schedules", href: "/booking/transportation/schedules", icon: CalendarClock, requiredModule: "bookings" }
                ]
            },
            {
                title: "Booking Setup",
                href: "/booking/custom-fields",
                icon: Settings,
                requiredModule: "bookings",
                requiresOrgContext: true,
                children: [
                    { title: "Custom Fields", href: "/booking/custom-fields", icon: Settings, requiredModule: "bookings", requiresOrgContext: true },
                    { title: "Booking Options", href: "/booking/booking-options", icon: List, requiredModule: "bookings", requiresOrgContext: true },
                    { title: "Check-In Statuses", href: "/booking/check-in-statuses", icon: UserCheck, requiredModule: "bookings", requiresOrgContext: true },
                    { title: "Customer Types", href: "/booking/customer-types", icon: Users, requiredModule: "bookings", requiresOrgContext: true },
                    { title: "Pricing Schedules", href: "/booking/pricing", icon: Coins, requiredModule: "bookings", requiresOrgContext: true },
                    { title: "Pricing Variations", href: "/booking/pricing-variations", icon: Layers, requiredModule: "bookings", requiresOrgContext: true },
                ]
            },
        ]
    },
    {
        title: "Communication",
        requiredModule: "communications",
        items: [
            { title: "Phone System", href: "/comms/phone", icon: Phone, requiredModule: "communications" },
            { title: "AI Agents", href: "/comms/ai-agents", icon: Bot, requiredModule: "communications" },
            { title: "Live Agents", href: "/comms/live-agents", icon: Headset, requiredModule: "communications" },
            { title: "HighLevel", href: "/comms/highlevel", icon: Layers, requiredModule: "communications" },
        ]
    },
    {
        title: "Visibility",
        requiredModule: "visibility",
        items: [
            { title: "OTA Manager", href: "/visibility/ota", icon: CloudCog, requiredModule: "visibility" },
            { title: "Website Manager", href: "/visibility/website", icon: Globe, requiredModule: "visibility" },
            { title: "Social Media", href: "/visibility/social", icon: Share2, requiredModule: "visibility" },
            { title: "Blog Manager", href: "/visibility/blog", icon: PenTool, requiredModule: "visibility" },
        ]
    },
    {
        title: "Finance",
        requiredModule: "finance",
        items: [
            { title: "Billing", href: "/finance/billing", icon: Receipt, requiredModule: "finance" },
            { title: "Bank Accounts", href: "/finance/bank-accounts", icon: Landmark, requiredModule: "finance" },
            { title: "Partners", href: "/finance/partners", icon: Handshake, requiredModule: "finance" },
            { title: "Reports", href: "/finance/reports", icon: PieChart, requiredModule: "finance" },
        ]
    },
    {
        title: "Settings",
        requiredModule: "settings",
        items: [
            { title: "Organization Profile", href: "/settings/organization", icon: Building2, organizationAdminOnly: true, requiresOrgContext: true },
            {
                title: "Users",
                href: "/settings/staff",
                icon: UserCog,
                organizationAdminOnly: true,
                requiresOrgContext: true,
                children: [
                    { title: "All Users", href: "/settings/all-users", icon: Users, requiresOrgContext: true },
                    { title: "Staff", href: "/settings/staff", icon: UserCog, requiresOrgContext: true },
                    { title: "Roles & Permissions", href: "/settings/permissions", icon: Shield, organizationAdminOnly: true, requiresOrgContext: true },
                    { title: "Partners & Affiliates", href: "/settings/partners", icon: Handshake, organizationAdminOnly: true, requiresOrgContext: true }
                ]
            },
            { title: "Style Manager", href: "/admin/theme", icon: Palette, requiresOrgContext: true },
            { title: "Activity Log", href: "/settings/activity-log", icon: Activity, requiresOrgContext: true },
        ]
    },
    {
        title: "Platform Admin",
        items: [
            {
                title: "Platform Users",
                href: "/admin/users",
                icon: Users,
                platformAdminOnly: true
            },
            {
                title: "Organizations",
                href: "/admin/organizations",
                icon: Building2,
                platformAdminOnly: true
            },
        ]
    }
];

