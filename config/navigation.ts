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
    LayoutTemplate,
    Coins,
    Settings,
    List
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
            {
                title: "All Customers",
                href: "/crm/customers",
                icon: Users
            }
        ]
    },
    {
        title: "Operations",
        items: [

            {
                title: "Availabilities",
                href: "/operations/availability",
                icon: Calendar
            },
            {
                title: "Bookings",
                href: "/operations/bookings",
                icon: CalendarRange
            },
            {
                title: "Transportation",
                href: "/operations/transportation",
                icon: Bus,
                children: [
                    { title: "Vehicles", href: "/operations/transportation/vehicles", icon: Bus },
                    { title: "Vendors", href: "/operations/transportation/vendors", icon: Handshake },
                    { title: "Pickup Points", href: "/operations/transportation/pickup-points", icon: MapPin },
                    { title: "Hotel List", href: "/operations/transportation/hotels", icon: Building2 },
                    { title: "Schedules", href: "/operations/transportation/schedules", icon: CalendarClock }
                ]
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

            {
                title: "Users",
                href: "/settings/users",
                icon: UserCog,
                children: [
                    { title: "Staff", href: "/operations/staff", icon: Users },
                    { title: "Roles", href: "/settings/users/roles", icon: Shield }
                ]
            },
            { title: "Permissions", href: "/settings/permissions", icon: Shield },
            { title: "Experiences", href: "/operations/tours", icon: Map },
            { title: "Custom Fields", href: "/settings/custom-fields", icon: Settings },
            { title: "Booking Options", href: "/settings/booking-options", icon: List },
            { title: "Customer Types", href: "/customers/types", icon: Users },
            { title: "Pricing Schedules", href: "/finance/pricing", icon: Coins },
            { title: "Pricing Variations", href: "/settings/pricing-variations", icon: Layers },
        ]
    }
];
