import {
    LayoutDashboard,
    Inbox,
    Calendar,
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
    LayoutTemplate
} from "lucide-react";

export interface NavigationItem {
    title: string;
    href: string;
    icon: any;
    children?: NavigationItem[];
}

export interface NavSection {
    title?: string; // If present, this is a Collapsible Heading
    items: NavigationItem[];
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
        ]
    },
    {
        title: "Operations",
        items: [
            {
                title: "Bookings",
                href: "/operations/bookings",
                icon: CalendarRange
            },
            {
                title: "Tours & Manifests",
                href: "/operations/tours",
                icon: Map
            },
            {
                title: "Transportation",
                href: "/operations/transportation",
                icon: Bus,
                children: [
                    { title: "Vehicles", href: "/operations/transportation/vehicles", icon: Bus },
                    { title: "Pickup Points", href: "/operations/transportation/pickup-points", icon: MapPin },
                    { title: "Hotel List", href: "/operations/transportation/hotels", icon: Building2 },
                    { title: "Schedules", href: "/operations/transportation/schedules", icon: CalendarClock }
                ]
            },
            {
                title: "Staff & Guides",
                href: "/operations/staff",
                icon: Users
            },
        ]
    },
    {
        title: "Communication", // Changed from "Communications" to "Communication"
        items: [
            { title: "Phone System", href: "/comms/phone", icon: Phone },
            { title: "AI Agents", href: "/comms/ai-agents", icon: Bot },
            { title: "Live Agents", href: "/comms/live-agents", icon: Headset },
            { title: "HighLevel", href: "/comms/highlevel", icon: Layers },
        ]
    },
    {
        title: "Visibility",
        items: [
            { title: "OTA Manager", href: "/visibility/ota", icon: CloudCog },
            { title: "Website Manager", href: "/visibility/website", icon: Globe },
            { title: "Social Media", href: "/visibility/social", icon: Share2 },
            { title: "Blog Manager", href: "/visibility/blog", icon: PenTool },
        ]
    },
    {
        title: "Finance",
        items: [
            { title: "Billing", href: "/finance/billing", icon: Receipt },
            { title: "Bank Accounts", href: "/finance/bank-accounts", icon: Landmark },
            { title: "Partners", href: "/finance/partners", icon: Handshake },
            { title: "Reports", href: "/finance/reports", icon: PieChart },
        ]
    },
    {
        title: "Settings",
        items: [
            { title: "Organization", href: "/settings/organization", icon: Building2 },
            { title: "Users", href: "/settings/users", icon: UserCog },
            { title: "Permissions", href: "/settings/permissions", icon: Shield },
            { title: "Dash Settings", href: "/settings/dash", icon: Layout },
        ]
    }
];
