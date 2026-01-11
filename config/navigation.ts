import {
    LayoutDashboard,
    Inbox,
    Map,
    Calendar,
    Ticket,
    Users,
    Bus,
    Briefcase,
    Phone,
    Bot,
    Headset,
    Layers,
    CloudCog,
    Globe,
    Share2,
    PenTool,
    Receipt,
    Landmark,
    Handshake,
    PieChart,
    Building2,
    UserCog,
    Shield,
    Layout,
    type LucideIcon
} from "lucide-react";

export interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
}

export interface NavSection {
    title?: string; // If present, this is a Collapsible Heading
    items: NavItem[];
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
            { title: "Tours / Events", href: "/operations/tours", icon: Map },
            { title: "Calendars", href: "/operations/calendars", icon: Calendar },
            { title: "Bookings", href: "/operations/bookings", icon: Ticket },
            { title: "Customers", href: "/operations/customers", icon: Users },
            { title: "Transportation", href: "/operations/transportation", icon: Bus },
            { title: "Staff", href: "/operations/staff", icon: Briefcase },
        ]
    },
    {
        title: "Communications",
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
