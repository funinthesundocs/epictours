"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type NavSection } from "@/config/navigation";
import { useFilteredNavigation } from "@/features/auth/use-filtered-navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, ChevronDown, ChevronLeft, ChevronRight, Settings, X, Shield, Minus, Plus, Sun, Moon, Loader2, LogOut } from "lucide-react";
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
    const { isPlatformAdmin, logout } = useAuth();

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
                className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-background rounded-md text-foreground border border-border shadow-lg"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                <Menu size={20} />
            </button>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-dvh transition-all duration-300 ease-in-out border-r border-border bg-background",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
                style={{ width: "var(--sidebar-width)" }}
            >
                {/* Content Container */}
                <div className="h-full w-full flex flex-col overflow-hidden relative">

                    {/* Header / Logo Area */}
                    <div
                        className="relative flex items-center justify-between px-4 border-b border-border shrink-0"
                        style={{ zoom: zoom / 100, height: `${73}px` }}
                    >
                        {!isCollapsed && (
                            <Link href="/" className="overflow-hidden whitespace-nowrap hover:opacity-80 transition-opacity">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                                    EpicDash<span className="text-primary">.ai</span>
                                </h1>
                                <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Custom OS</p>
                            </Link>
                        )}
                        {/* Collapse Toggle */}
                        <button
                            onClick={toggleCollapse}
                            className={cn(
                                "absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-muted border-l border-y border-border text-primary hover:text-foreground hover:bg-muted/80 transition-colors hidden lg:flex items-center justify-center rounded-l-lg rounded-r-none",
                            )}
                        >
                            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <div
                        className="flex-1 overflow-y-auto py-4 px-3 space-y-2 scrollbar-thin scrollbar-thumb-border bg-background"
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
                                        <div key={section.title} className="mx-2 mb-2 p-1.5 rounded-xl bg-muted/50 border border-border flex flex-col gap-1 items-center">
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

                    {/* Zoom Controls - Now above Log Out */}
                    <div
                        ref={zoomSliderRef}
                        className={cn(
                            "border-t border-border bg-background/80 shrink-0 relative",
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
                                    className="absolute bottom-full left-0 right-0 bg-popover border border-border rounded-t-lg shadow-xl p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-muted-foreground font-bold">50%</span>
                                        <input
                                            type="range"
                                            min="50"
                                            max="150"
                                            step="10"
                                            value={zoom}
                                            onChange={(e) => setZoom(parseInt(e.target.value))}
                                            className="flex-1 h-1 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_6px_color-mix(in_srgb,var(--primary),transparent_50%)] [&::-webkit-slider-thumb]:cursor-pointer"
                                        />
                                        <span className="text-[10px] text-muted-foreground font-bold">150%</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {isCollapsed ? (
                            <>
                                <button
                                    onClick={zoomIn}
                                    disabled={zoom >= 150}
                                    className="py-3 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-b border-border"
                                >
                                    <Plus size={14} />
                                </button>
                                <button
                                    onClick={() => setIsZoomSliderOpen(!isZoomSliderOpen)}
                                    className="py-2 flex items-center justify-center border-b border-border cursor-pointer hover:bg-muted transition-colors"
                                >
                                    <span className="text-xs text-primary font-bold">{zoom}%</span>
                                </button>
                                <button
                                    onClick={zoomOut}
                                    disabled={zoom <= 50}
                                    className="py-3 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Minus size={14} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={zoomOut}
                                    disabled={zoom <= 50}
                                    className="w-1/4 py-3 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-r border-border"
                                >
                                    <Minus size={14} />
                                </button>
                                <button
                                    onClick={() => setIsZoomSliderOpen(!isZoomSliderOpen)}
                                    className="w-1/2 py-3 flex items-center justify-center gap-2 border-r border-border cursor-pointer hover:bg-muted transition-colors"
                                >
                                    <span className="text-sm text-muted-foreground font-medium">Zoom</span>
                                    <span className="text-sm text-primary font-bold">{zoom}%</span>
                                </button>
                                <button
                                    onClick={zoomIn}
                                    disabled={zoom >= 150}
                                    className="w-1/4 py-3 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Plus size={14} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* User Profile Footer */}
                    <div
                        className={cn("p-4 border-t border-border bg-background/80 backdrop-blur-md shrink-0 relative z-30", isCollapsed && "flex flex-col items-center gap-2 p-2")}
                        style={{ zoom: zoom / 100 }}
                    >
                        {isCollapsed ? (
                            <>
                                {/* Collapsed: Profile avatar and icons below */}
                                <div className="w-9 h-9 rounded-full bg-primary ring-2 ring-primary/20 shadow-[0_0_10px_color-mix(in_srgb,var(--primary),transparent_50%)]" />
                                <div className="flex items-center gap-1">
                                    {/* Platform Admin Icon */}
                                    {isPlatformAdmin() && (
                                        <button
                                            onClick={() => { setIsPlatformAdminOpen(!isPlatformAdminOpen); setIsSettingsOpen(false); }}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                isPlatformAdminOpen
                                                    ? "bg-primary/20 text-primary"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                            )}
                                        >
                                            <Shield size={24} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsPlatformAdminOpen(false); }}
                                        className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            isSettingsOpen
                                                ? "bg-primary/20 text-primary"
                                                : "text-primary hover:text-primary/80 hover:bg-muted"
                                        )}
                                    >
                                        <Settings size={24} />
                                    </button>

                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary ring-2 ring-primary/20 shadow-[0_0_10px_color-mix(in_srgb,var(--primary),transparent_50%)] shrink-0" />
                                    <div className="text-base overflow-hidden whitespace-nowrap">
                                        <p className="font-medium text-foreground">Admin</p>
                                        <p className="text-sm text-primary">Online</p>
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
                                                    ? "bg-primary/20 text-primary"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                            )}
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
                                                ? "bg-primary/20 text-primary"
                                                : "text-primary hover:text-primary/80 hover:bg-muted"
                                        )}
                                    >
                                        <Settings size={24} />
                                    </button>


                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logout - Very bottom of sidebar */}
                    <div
                        className={cn(
                            "border-t border-border bg-background/80 shrink-0",
                            isCollapsed ? "flex flex-col items-center p-2" : "p-2"
                        )}
                        style={{ zoom: zoom / 100 }}
                    >
                        <button
                            onClick={() => logout()}
                            className={cn(
                                "flex items-center gap-3 rounded-lg transition-colors w-full group",
                                isCollapsed
                                    ? "justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                                    : "px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted justify-start"
                            )}
                        >
                            <LogOut size={18} className="transition-colors group-hover:text-foreground" />
                            {!isCollapsed && <span className="font-medium text-sm transition-colors group-hover:text-foreground">Log Out</span>}
                        </button>
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
                                    className="absolute top-[73px] bottom-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm"
                                    onClick={() => setIsSettingsOpen(false)}
                                />
                                <motion.div
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    className={cn(
                                        "absolute bottom-[120px] left-0 right-0 z-20 flex flex-col bg-popover rounded-t-xl border-t border-border shadow-[0_-10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.5)] max-h-[calc(100%-190px)]",
                                        isCollapsed && "items-center"
                                    )}
                                    style={{ zoom: zoom / 100 }}
                                >
                                    {/* Settings Header */}
                                    <div className={cn(
                                        "shrink-0 px-4 py-3 bg-muted/20 border-b border-border flex items-center justify-between w-full",
                                        isCollapsed && "justify-center px-2"
                                    )}>
                                        {!isCollapsed && (
                                            <div className="flex items-center gap-2">
                                                <Settings size={18} className="text-primary" />
                                                <h3 className="text-lg font-semibold text-foreground">Settings</h3>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setIsSettingsOpen(false)}
                                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Settings content */}
                                    <div className={cn(
                                        "flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-border",
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
                                    className="absolute top-[73px] bottom-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm"
                                    onClick={() => setIsPlatformAdminOpen(false)}
                                />
                                <motion.div
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    className={cn(
                                        "absolute bottom-[120px] left-0 right-0 z-20 flex flex-col bg-popover rounded-t-xl border-t border-border shadow-[0_-10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.5)] max-h-[calc(100%-190px)]",
                                        isCollapsed && "items-center"
                                    )}
                                    style={{ zoom: zoom / 100 }}
                                >
                                    {/* Platform Admin Header */}
                                    <div className={cn(
                                        "shrink-0 px-4 py-3 bg-muted/20 border-b border-border flex items-center justify-between w-full",
                                        isCollapsed && "justify-center px-2"
                                    )}>
                                        {!isCollapsed && (
                                            <div className="flex items-center gap-2">
                                                <Shield size={18} className="text-primary" />
                                                <h3 className="text-lg font-semibold text-foreground">Platform Admin</h3>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setIsPlatformAdminOpen(false)}
                                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Platform Admin content */}
                                    <div className={cn(
                                        "flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-border",
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
                                    ? "bg-primary/20 text-primary shadow-[0_0_10px_color-mix(in_srgb,var(--primary),transparent_90%)]"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Icon size={20} />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                        <div className="flex flex-col gap-1">
                            <span className="font-medium">{item.title}</span>
                            {hasChildren && (
                                <div className="flex flex-col gap-1 pt-1 border-t border-border mt-1">
                                    {item.children.map((child: any) => (
                                        <Link
                                            key={child.href}
                                            href={child.href}
                                            className={cn(
                                                "text-xs py-1 px-2 rounded hover:bg-muted transition-colors",
                                                pathname === child.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
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
                            ? "text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    style={{ paddingLeft: `${12 + (depth * 12)}px` }}
                >
                    <div className="flex items-center gap-3">
                        <Icon size={18} className={cn("transition-colors", (isActive || isChildActive) ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
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
        <div className="relative group/item">
            <Link
                href={item.href}
                className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition-all duration-200",
                    isActive
                        ? "bg-primary/10 text-primary font-medium shadow-[0_0_15px_color-mix(in_srgb,var(--primary),transparent_85%)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                style={{ paddingLeft: `${12 + (depth * 12)}px` }}
                onClick={() => onMobileItemClick?.()}
            >
                <Icon size={18} className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="truncate">{item.title}</span>
            </Link>

            {/* Special Case: Style Manager Theme Toggle */}
            {item.title === "Style Manager" && !isCollapsed && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <ThemeToggle />
                </div>
            )}
        </div>
    );
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [targetMode, setTargetMode] = useState<'light' | 'dark' | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleThemeSwitch = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // precise sequence
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTargetMode(nextTheme);
        setIsTransitioning(true);
        setShowOverlay(true);

        // 1. Switch Theme (hidden behind overlay) - 100ms delay to ensure overlay is rendered
        setTimeout(() => {
            setTheme(nextTheme);
        }, 100);

        // 2. Start Fade Out - after 1000ms (1s total "loading" time)
        setTimeout(() => {
            setShowOverlay(false);
        }, 1100);

        // 3. Unmount Overlay - after fade finishes (300ms fade)
        setTimeout(() => {
            setIsTransitioning(false);
        }, 1400);
    };

    if (!mounted) return null;

    return (
        <>
            <button
                onClick={handleThemeSwitch}
                disabled={isTransitioning}
                className="p-1.5 rounded-md bg-background border border-border shadow-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            >
                {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
            </button>

            {/* Full Screen Loading Overlay */}
            {isTransitioning && createPortal(
                <div
                    className={cn(
                        "fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center transition-opacity duration-300",
                        showOverlay ? "opacity-100" : "opacity-0"
                    )}
                >
                    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                            <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                                Please wait
                            </h2>
                            <p className="text-sm text-muted-foreground">Switching to {targetMode === 'light' ? 'Light' : 'Dark'} Mode...</p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
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
                    "w-full flex items-center justify-between px-3 py-2 text-sm font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
                    isChildActive ? "text-primary/90" : "text-muted-foreground"
                )}
            >
                <span>{section.title}</span>
                <ChevronDown
                    size={14}
                    className={cn("transition-transform duration-200", isOpen ? "rotate-180 text-primary" : "")}
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
