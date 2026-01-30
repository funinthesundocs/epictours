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
    Palette
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
    // If true, only tenant admins can see this
    tenantAdminOnly?: boolean;
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
        title: "Operations",
        requiredModule: "bookings",
        items: [
            {
                title: "Availabilities",
                href: "/operations/availability",
                icon: Calendar,
                requiredModule: "bookings"
            },
            {
                title: "Bookings",
                href: "/operations/bookings",
                icon: CalendarRange,
                requiredModule: "bookings"
            },
            {
                title: "Transportation",
                href: "/operations/transportation",
                icon: Bus,
                requiredModule: "transportation",
                children: [
                    { title: "Vehicles", href: "/operations/transportation/vehicles", icon: Bus, requiredModule: "transportation" },
                    { title: "Vendors", href: "/operations/transportation/vendors", icon: Handshake, requiredModule: "transportation" },
                    { title: "Pickup Points", href: "/operations/transportation/pickup-points", icon: MapPin, requiredModule: "transportation" },
                    { title: "Hotel List", href: "/operations/transportation/hotels", icon: Building2, requiredModule: "transportation" },
                    { title: "Schedules", href: "/operations/transportation/schedules", icon: CalendarClock, requiredModule: "transportation" }
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
            {
                title: "Users",
                href: "/settings/users",
                icon: UserCog,
                tenantAdminOnly: true,
                children: [
                    { title: "Staff", href: "/operations/staff", icon: Users },
                    { title: "Permission Groups", href: "/settings/users/roles", icon: Shield, tenantAdminOnly: true }
                ]
            },

            { title: "Experiences", href: "/operations/tours", icon: Map, requiredModule: "bookings" },
            { title: "Custom Fields", href: "/settings/custom-fields", icon: Settings },
            { title: "Booking Options", href: "/settings/booking-options", icon: List, requiredModule: "bookings" },
            { title: "Customer Types", href: "/customers/types", icon: Users, requiredModule: "crm" },
            { title: "Pricing Schedules", href: "/finance/pricing", icon: Coins, requiredModule: "finance" },
            { title: "Pricing Variations", href: "/settings/pricing-variations", icon: Layers, requiredModule: "finance" },
            { title: "Activity Log", href: "/settings/activity-log", icon: Activity },
        ]
    },
    {
        title: "Platform Admin",
        items: [
            {
                title: "Organizations",
                href: "/admin/tenants",
                icon: Building2,
                platformAdminOnly: true
            },
            {
                title: "Style Manager",
                href: "/admin/theme",
                icon: Palette,
                platformAdminOnly: true
            },
        ]
    }
];

