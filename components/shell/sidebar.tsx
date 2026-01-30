"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type NavSection } from "@/config/navigation";
import { useFilteredNavigation } from "@/features/auth/use-filtered-navigation";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { Menu, ChevronDown, ChevronLeft, ChevronRight, Settings, X, Shield, Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSidebar } from "@/components/shell/sidebar-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function Sidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { isCollapsed, toggleCollapse, zoom, zoomIn, zoomOut, setZoom } = useSidebar();

    // Auto-open Settings panel if on a settings page
    const [isSettingsOpen, setIsSettingsOpen] = useState(() =>
        pathname.startsWith('/settings')
    );
    // Auto-open Platform Admin panel if on an admin page
    const [isPlatformAdminOpen, setIsPlatformAdminOpen] = useState(() =>
        pathname.startsWith('/admin')
    );
    const [isZoomSliderOpen, setIsZoomSliderOpen] = useState(false);
    const { isPlatformAdmin } = useAuth();

    // Ref for zoom slider click-outside detection
    const zoomSliderRef = useRef<HTMLDivElement>(null);

    // Close zoom slider when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (zoomSliderRef.current && !zoomSliderRef.current.contains(event.target as Node)) {
                setIsZoomSliderOpen(false);
            }
        };
        if (isZoomSliderOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isZoomSliderOpen]);

    // Get filtered navigation based on user permissions
    const navigation = useFilteredNavigation();

    // Get Settings and Platform Admin sections from filtered navigation
    const settingsSection = navigation.find(section => section.title === "Settings");
    const platformAdminSection = navigation.find(section => section.title === "Platform Admin");

    // Accordion State
    const [openSection, setOpenSection] = useState<string | null>(() => {
        // Find which section should be open based on current path
        const activeSection = navigation.find((section: NavSection) =>
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
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-dvh transition-all duration-300 ease-in-out border-r border-white/10 bg-[#010a0a]",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
                style={{ width: "var(--sidebar-width)" }}
            >
                {/* Content Container */}
                <div className="h-full w-full flex flex-col overflow-hidden relative">

                    {/* Header / Logo Area */}
                    <div
                        className="relative flex items-center justify-between px-4 border-b border-white/10 shrink-0"
                        style={{ zoom: zoom / 100, height: `${73}px` }}
                    >
                        {!isCollapsed && (
                            <Link href="/" className="overflow-hidden whitespace-nowrap hover:opacity-80 transition-opacity">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                    EpicDash<span className="text-cyan-400">.ai</span>
                                </h1>
                                <p className="text-xs text-zinc-500 uppercase tracking-[0.2em]">Custom OS</p>
                            </Link>
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
                    <div
                        className="flex-1 overflow-y-auto py-4 px-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800"
                        style={{ zoom: zoom / 100 }}
                    >
                        {navigation.map((section, idx) => {
                            // Skip Settings and Platform Admin sections - they have their own panels
                            if (section.title === "Settings" || section.title === "Platform Admin") return null;

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

                    {/* Zoom Controls */}
                    <div
                        ref={zoomSliderRef}
                        className={cn(
                            "border-t border-white/10 bg-zinc-900/80 shrink-0 relative",
                            isCollapsed ? "flex flex-col" : "flex"
                        )}
                        style={{ zoom: zoom / 100 }}
                    >
                        {/* Slider Popup */}
                        <AnimatePresence>
                            {isZoomSliderOpen && !isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full left-0 right-0 bg-zinc-900 border border-white/10 rounded-t-lg shadow-xl p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-zinc-500 font-bold">50%</span>
                                        <input
                                            type="range"
                                            min="50"
                                            max="150"
                                            step="10"
                                            value={zoom}
                                            onChange={(e) => setZoom(parseInt(e.target.value))}
                                            className="flex-1 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(6,182,212,0.5)] [&::-webkit-slider-thumb]:cursor-pointer"
                                        />
                                        <span className="text-[10px] text-zinc-500 font-bold">150%</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {isCollapsed ? (
                            <>
                                <button
                                    onClick={zoomIn}
                                    disabled={zoom >= 150}
                                    className="py-1.5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-b border-white/10"
                                >
                                    <Plus size={12} />
                                </button>
                                <button
                                    onClick={() => setIsZoomSliderOpen(!isZoomSliderOpen)}
                                    className="py-1 flex items-center justify-center border-b border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <span className="text-[9px] text-cyan-400 font-bold">{zoom}%</span>
                                </button>
                                <button
                                    onClick={zoomOut}
                                    disabled={zoom <= 50}
                                    className="py-1.5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Minus size={12} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={zoomOut}
                                    disabled={zoom <= 50}
                                    className="w-1/4 py-1.5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-r border-white/10"
                                >
                                    <Minus size={12} />
                                </button>
                                <button
                                    onClick={() => setIsZoomSliderOpen(!isZoomSliderOpen)}
                                    className="w-1/2 py-1.5 flex items-center justify-center gap-2 border-r border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <span className="text-xs text-zinc-500 font-medium">Zoom</span>
                                    <span className="text-xs text-cyan-400 font-bold">{zoom}%</span>
                                </button>
                                <button
                                    onClick={zoomIn}
                                    disabled={zoom >= 150}
                                    className="w-1/4 py-1.5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Plus size={12} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* User Profile Footer */}
                    <div
                        className={cn("p-4 border-t border-white/10 bg-zinc-900/80 backdrop-blur-md shrink-0 relative z-30", isCollapsed && "flex flex-col items-center gap-2 p-2")}
                        style={{ zoom: zoom / 100 }}
                    >
                        {isCollapsed ? (
                            <>
                                {/* Collapsed: Profile avatar and icons below */}
                                <div className="w-9 h-9 rounded-full bg-cyan-500 ring-2 ring-white/10 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                                <div className="flex items-center gap-1">
                                    {/* Platform Admin Icon */}
                                    {isPlatformAdmin() && (
                                        <button
                                            onClick={() => { setIsPlatformAdminOpen(!isPlatformAdminOpen); setIsSettingsOpen(false); }}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                isPlatformAdminOpen
                                                    ? "bg-white/20 text-cyan-400"
                                                    : "text-zinc-400 hover:text-white hover:bg-white/10"
                                            )}
                                            title="Platform Admin"
                                        >
                                            <Shield size={24} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsPlatformAdminOpen(false); }}
                                        className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            isSettingsOpen
                                                ? "bg-white/20 text-cyan-400"
                                                : "text-cyan-400 hover:text-cyan-300 hover:bg-white/10"
                                        )}
                                        title="Settings"
                                    >
                                        <Settings size={24} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-cyan-400 ring-2 ring-white/10 shadow-[0_0_10px_rgba(6,182,212,0.5)] shrink-0" />
                                    <div className="text-base overflow-hidden whitespace-nowrap">
                                        <p className="font-medium text-white">Admin</p>
                                        <p className="text-sm text-cyan-400">Online</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {/* Platform Admin Icon */}
                                    {isPlatformAdmin() && (
                                        <button
                                            onClick={() => { setIsPlatformAdminOpen(!isPlatformAdminOpen); setIsSettingsOpen(false); }}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                isPlatformAdminOpen
                                                    ? "bg-white/20 text-cyan-400"
                                                    : "text-zinc-400 hover:text-white hover:bg-white/10"
                                            )}
                                            title="Platform Admin"
                                        >
                                            <Shield size={24} />
                                        </button>
                                    )}
                                    {/* Settings Gear Icon - Always Cyan */}
                                    <button
                                        onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsPlatformAdminOpen(false); }}
                                        className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            isSettingsOpen
                                                ? "bg-white/20 text-cyan-400"
                                                : "text-cyan-400 hover:text-cyan-300 hover:bg-white/10"
                                        )}
                                        title="Settings"
                                    >
                                        <Settings size={24} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Settings Slide-Up Panel */}
                    <AnimatePresence>
                        {isSettingsOpen && (
                            <>
                                {/* Glass backdrop overlay - only covers navigation area */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute top-[73px] bottom-0 left-0 right-0 z-10 bg-zinc-950/10 backdrop-blur-sm"
                                    onClick={() => setIsSettingsOpen(false)}
                                />
                                <motion.div
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    className={cn(
                                        "absolute bottom-[73px] left-0 right-0 z-20 flex flex-col bg-zinc-950 rounded-t-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] max-h-[calc(100%-146px)]",
                                        isCollapsed && "items-center"
                                    )}
                                    style={{ zoom: zoom / 100 }}
                                >
                                    {/* Settings Header */}
                                    <div className={cn(
                                        "shrink-0 px-4 py-3 bg-white/10 border-b border-white/10 flex items-center justify-between w-full",
                                        isCollapsed && "justify-center px-2"
                                    )}>
                                        {!isCollapsed && (
                                            <div className="flex items-center gap-2">
                                                <Settings size={18} className="text-cyan-400" />
                                                <h3 className="text-lg font-semibold text-white">Settings</h3>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setIsSettingsOpen(false)}
                                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Settings content */}
                                    <div className={cn(
                                        "flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800",
                                        isCollapsed && "px-1.5 flex flex-col items-center"
                                    )}>
                                        {settingsSection?.items.map((item) => (
                                            <NavItem
                                                key={item.href}
                                                item={item}
                                                pathname={pathname}
                                                isCollapsed={isCollapsed}
                                                onMobileItemClick={() => {
                                                    // Only close panels on mobile
                                                    if (isMobileOpen) {
                                                        setIsSettingsOpen(false);
                                                        setIsMobileOpen(false);
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Platform Admin Slide-Up Panel */}
                    <AnimatePresence>
                        {isPlatformAdminOpen && (
                            <>
                                {/* Glass backdrop overlay */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute top-[73px] bottom-0 left-0 right-0 z-10 bg-zinc-950/10 backdrop-blur-sm"
                                    onClick={() => setIsPlatformAdminOpen(false)}
                                />
                                <motion.div
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    className={cn(
                                        "absolute bottom-[73px] left-0 right-0 z-20 flex flex-col bg-zinc-950 rounded-t-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] max-h-[calc(100%-146px)]",
                                        isCollapsed && "items-center"
                                    )}
                                    style={{ zoom: zoom / 100 }}
                                >
                                    {/* Platform Admin Header */}
                                    <div className={cn(
                                        "shrink-0 px-4 py-3 bg-white/10 border-b border-white/10 flex items-center justify-between w-full",
                                        isCollapsed && "justify-center px-2"
                                    )}>
                                        {!isCollapsed && (
                                            <div className="flex items-center gap-2">
                                                <Shield size={18} className="text-cyan-400" />
                                                <h3 className="text-lg font-semibold text-white">Platform Admin</h3>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setIsPlatformAdminOpen(false)}
                                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Platform Admin content */}
                                    <div className={cn(
                                        "flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800",
                                        isCollapsed && "px-1.5 flex flex-col items-center"
                                    )}>
                                        {platformAdminSection?.items.map((item) => (
                                            <NavItem
                                                key={item.href}
                                                item={item}
                                                pathname={pathname}
                                                isCollapsed={isCollapsed}
                                                onMobileItemClick={() => {
                                                    // Only close panels on mobile
                                                    if (isMobileOpen) {
                                                        setIsPlatformAdminOpen(false);
                                                        setIsMobileOpen(false);
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
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

    // Collapsed Mode Rendering (Flat, Icon Only with Tooltip)
    if (isCollapsed) {
        return (
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            href={item.href}
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 group relative",
                                isActive || isChildActive
                                    ? "bg-cyan-400/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                                    : "text-zinc-500 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <Icon size={20} />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                        <div className="flex flex-col gap-1">
                            <span className="font-medium">{item.title}</span>
                            {hasChildren && (
                                <div className="flex flex-col gap-1 pt-1 border-t border-white/10 mt-1">
                                    {item.children.map((child: any) => (
                                        <Link
                                            key={child.href}
                                            href={child.href}
                                            className={cn(
                                                "text-xs py-1 px-2 rounded hover:bg-white/10 transition-colors",
                                                pathname === child.href ? "text-cyan-400" : "text-zinc-400 hover:text-white"
                                            )}
                                        >
                                            {child.title}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Expanded Mode: Recursive with Submenus
    if (hasChildren) {
        return (
            <div className="space-y-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full group flex items-center justify-between px-3 py-2.5 rounded-lg text-base transition-all duration-200",
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
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition-all duration-200",
                isActive
                    ? "bg-cyan-400/10 text-cyan-400 font-medium shadow-[0_0_15px_rgba(6,182,212,0.15)]"
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
                    "w-full flex items-center justify-between px-3 py-2 text-sm font-semibold uppercase tracking-wider transition-colors hover:text-white",
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
