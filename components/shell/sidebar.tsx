"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation, type NavSection } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, ChevronDown, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function Sidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Accordion State: Default to "Operations" or find the active section
    const [openSection, setOpenSection] = useState<string | null>("Operations");

    const toggleSection = (title: string) => {
        setOpenSection(current => current === title ? null : title);
    };

    return (
        <>
            {/* Mobile Trigger */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 rounded-md text-white border border-white/10"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                <Menu size={20} />
            </button>

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed lg:relative z-40 h-[95vh] w-[280px] my-auto ml-4 transition-all duration-300 ease-in-out",
                "hidden lg:flex flex-col",
                isMobileOpen ? "flex top-4 bottom-4 left-0" : "hidden"
            )}>
                {/* Glass Card */}
                <div className="h-full w-full rounded-2xl glass-card flex flex-col overflow-hidden">

                    {/* Logo Area */}
                    <div className="p-6 pb-4 shrink-0">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            EpicTours<span className="text-cyan-400">.ai</span>
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1 tracking-wider">BUSINESS OS</p>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 overflow-y-auto py-2 px-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
                        {navigation.map((section, idx) => {
                            // If it has a title, it's a Collapsible Section
                            if (section.title) {
                                return (
                                    <CollapsibleSection
                                        key={section.title}
                                        section={section}
                                        isOpen={openSection === section.title}
                                        onToggle={() => toggleSection(section.title!)}
                                        pathname={pathname}
                                    />
                                );
                            }

                            // Otherwise it's a flat list (e.g., Overview, Inbox)
                            return (
                                <div key={idx} className="space-y-1 mb-6">
                                    {section.items.map((item) => (
                                        <NavItem key={item.href} item={item} pathname={pathname} />
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {/* User Profile Footer */}
                    <div className="p-4 border-t border-white/5 bg-black/20 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 ring-2 ring-white/10" />
                            <div className="text-sm">
                                <p className="font-medium text-white">Administrator</p>
                                <p className="text-xs text-cyan-400">Online</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

// Helper: Standard Nav Item (Standard Row)
function NavItem({ item, pathname }: { item: any; pathname: string }) {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                isActive
                    ? "bg-cyan-500/10 text-cyan-400 font-medium shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
        >
            <Icon size={18} className={cn("transition-colors", isActive ? "text-cyan-400" : "text-zinc-500 group-hover:text-zinc-300")} />
            <span>{item.title}</span>
        </Link>
    )
}

// Helper: Collapsible Section (Accordion)
function CollapsibleSection({
    section,
    isOpen,
    onToggle,
    pathname
}: {
    section: NavSection;
    isOpen: boolean;
    onToggle: () => void;
    pathname: string;
}) {
    // Check if any child is active to highlight the section title
    const isChildActive = section.items.some(item => pathname.startsWith(item.href));

    return (
        <div className="mb-2">
            <button
                onClick={onToggle}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-white",
                    isChildActive ? "text-cyan-400/90" : "text-zinc-500"
                )}
            >
                <span>{section.title}</span>
                <ChevronDown
                    size={14}
                    className={cn("transition-transform duration-200", isOpen ? "rotate-180 text-cyan-400" : "")}
                />
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-1 pt-1 pb-2">
                            {section.items.map((item) => (
                                <NavItem key={item.href} item={item} pathname={pathname} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
