"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation, type NavSection } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSidebar } from "@/components/shell/sidebar-context";

export function Sidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { isCollapsed, toggleCollapse } = useSidebar();

    // Accordion State
    const [openSection, setOpenSection] = useState<string | null>(() => {
        // Find which section should be open based on current path
        const activeSection = navigation.find(section =>
            section.title &&
            section.items.some(item =>
                pathname === item.href ||
                pathname.startsWith(item.href + "/") ||
                (item.children && item.children.some(child => pathname.startsWith(child.href)))
            )
        );
        return activeSection?.title || null;
    });

    const toggleSection = (title: string) => {
        if (isCollapsed) return; // Disable accordion when collapsed
        setOpenSection(current => current === title ? null : title);
    };

    return (
        <>
            {/* Mobile Trigger */}
            <button
                className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-zinc-900 rounded-md text-white border border-white/10 shadow-lg"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                <Menu size={20} />
            </button>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out border-r border-white/10 bg-zinc-950",
                isMobileOpen ? "translate-x-0 w-[240px]" : "-translate-x-full lg:translate-x-0",
                isCollapsed ? "lg:w-[80px]" : "lg:w-[240px]"
            )}>
                {/* Content Container */}
                <div className="h-full w-full flex flex-col overflow-hidden">

                    {/* Header / Logo Area */}
                    <div className="relative h-[73px] flex items-center justify-between px-4 border-b border-white/10 shrink-0">
                        {!isCollapsed && (
                            <div className="overflow-hidden whitespace-nowrap">
                                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                    Epic<span className="text-cyan-400">.ai</span>
                                </h1>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Business OS</p>
                            </div>
                        )}
                        {/* Collapse Toggle */}
                        <button
                            onClick={toggleCollapse}
                            className={cn(
                                "absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-white/5 border-l border-y border-white/10 text-cyan-400 hover:text-white hover:bg-white/10 transition-colors hidden lg:flex items-center justify-center rounded-l-lg rounded-r-none",
                            )}
                        >
                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
                        {navigation.map((section, idx) => {
                            // Section Header Logic
                            // Navigation Items
                            if (section.title) {
                                if (isCollapsed) {
                                    // In collapsed mode, wrap the items in a "section tile"
                                    return (
                                        <div key={section.title} className="mx-2 mb-2 p-1.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1 items-center">
                                            {section.items.map((item) => (
                                                <NavItem key={item.href} item={item} pathname={pathname} isCollapsed={true} />
                                            ))}
                                        </div>
                                    );
                                }
                                return (
                                    <CollapsibleSection
                                        key={section.title}
                                        section={section}
                                        isOpen={openSection === section.title}
                                        onToggle={() => toggleSection(section.title!)}
                                        pathname={pathname}
                                        onMobileItemClick={() => setIsMobileOpen(false)}
                                    />
                                );
                            }
                            // Fallback for flat lists (Dashboard etc)
                            return (
                                <div key={idx} className={cn("space-y-1 mb-6", isCollapsed && "mb-2")}>
                                    {section.items.map((item) => (
                                        <NavItem key={item.href} item={item} pathname={pathname} isCollapsed={isCollapsed} onMobileItemClick={() => setIsMobileOpen(false)} />
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {/* User Profile Footer */}
                    <div className={cn("p-4 border-t border-white/10 bg-zinc-900/50 shrink-0", isCollapsed && "flex justify-center p-2")}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-cyan-500 ring-2 ring-white/10 shadow-[0_0_10px_rgba(6,182,212,0.5)] shrink-0" />
                            {!isCollapsed && (
                                <div className="text-sm overflow-hidden whitespace-nowrap">
                                    <p className="font-medium text-white">Admin</p>
                                    <p className="text-xs text-cyan-400">Online</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------

function NavItem({ item, pathname, depth = 0, isCollapsed = false, onMobileItemClick }: { item: any; pathname: string; depth?: number; isCollapsed?: boolean; onMobileItemClick?: () => void }) {
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;
    const isActive = pathname === item.href;
    const isChildActive = hasChildren && item.children.some((child: any) => pathname === child.href);

    const [isOpen, setIsOpen] = useState(isChildActive);

    // Collapsed Mode Rendering (Flat, Icon Only)
    if (isCollapsed) {
        return (
            <Link
                href={item.href}
                className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 group relative",
                    isActive || isChildActive
                        ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                        : "text-zinc-500 hover:text-white hover:bg-white/10"
                )}
                title={item.title} // Tooltip
            >
                <Icon size={20} />
            </Link>
        );
    }

    // Expanded Mode: Recursive with Submenus
    if (hasChildren) {
        return (
            <div className="space-y-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                        (isActive || isChildActive)
                            ? "text-cyan-400 font-medium"
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                    style={{ paddingLeft: `${12 + (depth * 12)}px` }}
                >
                    <div className="flex items-center gap-3">
                        <Icon size={18} className={cn("transition-colors", (isActive || isChildActive) ? "text-cyan-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                        <span className="truncate">{item.title}</span>
                    </div>
                    <ChevronDown size={14} className={cn("transition-transform", isOpen ? "rotate-180" : "")} />
                </button>

                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-1">
                                {item.children.map((child: any) => (
                                    <NavItem key={child.href} item={child} pathname={pathname} depth={depth + 1} isCollapsed={false} onMobileItemClick={onMobileItemClick} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Expanded Mode: Standard Link
    return (
        <Link
            href={item.href}
            className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                isActive
                    ? "bg-cyan-500/10 text-cyan-400 font-medium shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
            style={{ paddingLeft: `${12 + (depth * 12)}px` }}
            onClick={() => onMobileItemClick?.()}
        >
            <Icon size={18} className={cn("transition-colors", isActive ? "text-cyan-400" : "text-zinc-500 group-hover:text-zinc-300")} />
            <span className="truncate">{item.title}</span>
        </Link>
    );
}

// Reused Collapsible Section
function CollapsibleSection({
    section,
    isOpen,
    onToggle,
    pathname,
    onMobileItemClick
}: {
    section: NavSection;
    isOpen: boolean;
    onToggle: () => void;
    pathname: string;
    onMobileItemClick?: () => void;
}) {
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
                                <NavItem key={item.href} item={item} pathname={pathname} onMobileItemClick={onMobileItemClick} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
