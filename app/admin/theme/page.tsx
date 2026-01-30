"use client";

import { PageShell } from "@/components/shell/page-shell";
import { PaletteSection } from "@/features/admin/theme/components/palette-section";
import { ComponentSection } from "@/features/admin/theme/components/component-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
// import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar as CalendarIcon, Search, Bell, Check, X, AlertTriangle, Palette, Type, Layers, AlignJustify, Columns, LayoutGrid, Square, LayoutList, ToggleRight, Minus, Plus, Sun, Moon } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { DatePicker } from "@/components/ui/date-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "next-themes";

import { useState, useEffect } from "react";
import { CustomSelect } from "@/components/ui/custom-select";
import { cn } from "@/lib/utils";

const SECONDARY_OPTIONS = [
    { name: "Slate", class: "bg-slate-500", hex: "#64748b", light: "#e2e8f0", dark: "#1e293b" }, // Light: Slate-200, Dark: Slate-800
    { name: "Gray", class: "bg-gray-500", hex: "#6b7280", light: "#e5e7eb", dark: "#1f2937" }, // Light: Gray-200, Dark: Gray-800
    { name: "Zinc", class: "bg-zinc-500", hex: "#71717a", light: "#e4e4e7", dark: "#27272a" }, // Light: Zinc-200, Dark: Zinc-800
    { name: "Neutral", class: "bg-neutral-500", hex: "#737373", light: "#e5e5e5", dark: "#262626" }, // Light: Neutral-200, Dark: Neutral-800
    { name: "Stone", class: "bg-stone-500", hex: "#78716c", light: "#e7e5e4", dark: "#292524" }, // Light: Stone-200, Dark: Stone-800
];

const PRIMARY_OPTIONS = [
    { name: "Red", class: "bg-red-500", hex: "#ef4444" },
    { name: "Orange", class: "bg-orange-500", hex: "#f97316" },
    { name: "Amber", class: "bg-amber-500", hex: "#f59e0b" },
    { name: "Yellow", class: "bg-yellow-500", hex: "#eab308" },
    { name: "Green", class: "bg-green-500", hex: "#22c55e" },
    { name: "Emerald", class: "bg-emerald-500", hex: "#10b981" },
    { name: "Teal", class: "bg-teal-500", hex: "#14b8a6" },
    { name: "Cyan", class: "bg-cyan-500", hex: "#06b6d4" },
    { name: "Sky", class: "bg-sky-500", hex: "#0ea5e9" },
    { name: "Blue", class: "bg-blue-500", hex: "#3b82f6" },
    { name: "Indigo", class: "bg-indigo-500", hex: "#6366f1" },
    { name: "Violet", class: "bg-violet-500", hex: "#8b5cf6" },
    { name: "Purple", class: "bg-purple-500", hex: "#a855f7" },
    { name: "Fuchsia", class: "bg-fuchsia-500", hex: "#d946ef" },
    { name: "Pink", class: "bg-pink-500", hex: "#ec4899" },
    { name: "Rose", class: "bg-rose-500", hex: "#f43f5e" },
];

export default function ThemePage() {
    const { setTheme, resolvedTheme } = useTheme();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [counter, setCounter] = useState(0);

    // Multi Select State
    const [multiSelectSettings, setMultiSelectSettings] = useState({
        multi_select_style: 'vertical',
        multi_select_columns: 2,
        multi_select_visual: 'button',
        binary_mode: false
    });



    const [multiSelectValue, setMultiSelectValue] = useState<any>([]);

    // Theme Interaction State
    const [activePrimary, setActivePrimary] = useState<string | null>(null);
    const [activeSecondary, setActiveSecondary] = useState<string | null>(null);

    // Automatic Secondary Logic
    const handlePrimaryChange = (hex: string) => {
        setActivePrimary(hex);

        const primaryColor = PRIMARY_OPTIONS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
        if (!primaryColor) return;

        const name = primaryColor.name;
        let targetSecondaryName = null;

        // Rules:
        // Stone -> Red, Orange, Amber, Yellow, Rose
        if (['Red', 'Orange', 'Amber', 'Yellow', 'Rose'].includes(name)) {
            targetSecondaryName = "Stone";
        }
        // Neutral -> Green, Emerald, Pink, Fuchsia
        else if (['Green', 'Emerald', 'Pink', 'Fuchsia'].includes(name)) {
            targetSecondaryName = "Neutral";
        }
        // Zinc -> Teal, Cyan, Sky
        else if (['Teal', 'Cyan', 'Sky'].includes(name)) {
            targetSecondaryName = "Zinc";
        }
        // Gray -> Blue, Purple
        else if (['Blue', 'Purple'].includes(name)) {
            targetSecondaryName = "Gray";
        }
        // Slate -> Indigo, Violet (Indego corrected)
        else if (['Indigo', 'Violet'].includes(name)) {
            targetSecondaryName = "Slate";
        }

        if (targetSecondaryName) {
            const secondaryHex = SECONDARY_OPTIONS.find(s => s.name === targetSecondaryName)?.hex;
            if (secondaryHex) {
                setActiveSecondary(secondaryHex);
            }
        }
    };

    // Initialize State from current CSS variables on mount
    useEffect(() => {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);

        // Helper to normalize color strings (handle spaces, cases)
        const normalizeColor = (c: string) => c ? c.trim().toLowerCase() : '';

        // 1. Get Primary
        // Try inline style first (most reliable for custom set), then computed
        const currentPrimary = root.style.getPropertyValue('--primary') || computedStyle.getPropertyValue('--primary');
        if (currentPrimary) {
            // Find match in options
            const match = PRIMARY_OPTIONS.find(c => normalizeColor(c.hex) === normalizeColor(currentPrimary));
            if (match) {
                setActivePrimary(match.hex);
            }
        }

        // 2. Get Secondary
        const currentSecondary = root.style.getPropertyValue('--secondary') || computedStyle.getPropertyValue('--secondary');
        if (currentSecondary) {
            // Secondary in Dark mode might be the "Dark" value (e.g. Slate-800) not the hex (Slate-500)
            // We need to check against hex, light, AND dark values to find the "Option"
            const match = SECONDARY_OPTIONS.find(opt =>
                normalizeColor(opt.hex) === normalizeColor(currentSecondary) ||
                normalizeColor(opt.light) === normalizeColor(currentSecondary) ||
                normalizeColor(opt.dark) === normalizeColor(currentSecondary)
            );

            if (match) {
                setActiveSecondary(match.hex); // Always set active state to the "Metadata Hex" (500 weight)
            }
        }

    }, []); // Run only on mount

    // Apply Theme Changes
    useEffect(() => {
        const root = document.documentElement;

        // 1. Primary Colors
        if (activePrimary) {
            root.style.setProperty('--primary', activePrimary);
        } else {
            root.style.removeProperty('--primary');
        }

        // 2. Secondary & Background Colors
        const bgSource = activeSecondary || activePrimary;
        const activeOption = SECONDARY_OPTIONS.find(opt => opt.hex === activeSecondary);

        if (bgSource) {
            const isDark = resolvedTheme === 'dark';
            // If we have a specific Secondary Option selected, use its mode-specific value for the UI token
            if (activeOption) {
                root.style.setProperty('--secondary', isDark ? activeOption.dark : activeOption.light);
            } else {
                // Fallback (e.g. Primary used as secondary): keep raw source or calculate?
                // For now, if Primary is driving Secondary, we just use the source color logic or standard mix
                // But standard --secondary usually implies a "gray" scale.
                // If using Primary as fallback, let's just leave it as bgSource for now to be safe
                root.style.setProperty('--secondary', bgSource);
            }
        } else {
            root.style.removeProperty('--secondary');
        }

        if (bgSource) {
            const isDark = resolvedTheme === 'dark';
            const mixColor = isDark ? 'black' : 'white';
            const bgContrast = isDark ? '93%' : '95%'; // White background needs to be very light

            // Dark Background (Page Background) -> Mix 7% Color with 93% Black (Matches default #010e0f brightness)
            const darkBg = `color-mix(in srgb, ${bgSource}, ${mixColor} ${bgContrast})`;
            const slightlyLighterBg = `color-mix(in srgb, ${bgSource}, ${mixColor} ${isDark ? '88%' : '90%'})`;
            const borderCol = `color-mix(in srgb, ${bgSource}, ${mixColor} ${isDark ? '80%' : '80%'})`;

            // Override global standard variables
            root.style.setProperty('--background', darkBg);
            root.style.setProperty('--muted', slightlyLighterBg);
            root.style.setProperty('--card', darkBg);
            root.style.setProperty('--border', borderCol);
        } else {
            root.style.removeProperty('--background');
            root.style.removeProperty('--muted');
            root.style.removeProperty('--card');
            root.style.removeProperty('--border');
        }
    }, [activePrimary, activeSecondary, resolvedTheme]);

    const EXAMPLE_OPTIONS = [
        { label: "Option 1", value: "opt1" },
        { label: "Option 2", value: "opt2" },
        { label: "Option 3", value: "opt3" },
        { label: "Option 4", value: "opt4" }
    ];

    return (
        <div
            className="flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
            // We use inline style to override the hardcoded background if a theme is active
            style={{
                height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)'
            }}
        >
            {/* Header */}
            <div className="flex flex-col space-y-4 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Palette size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Style Manager</h1>
                            <p className="text-muted-foreground text-sm">Visual reference for the application's design system and components.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div
                className={cn(
                    "flex-1 min-h-0 rounded-xl border border-border overflow-hidden",
                    // Use standard bg if no theme, else variable
                    (!activeSecondary && !activePrimary) && "bg-background"
                )}
                style={(activeSecondary || activePrimary) ? { backgroundColor: 'var(--background)' } : undefined}
            >
                <div className="grid grid-cols-1 xl:grid-cols-3 h-full divide-y xl:divide-y-0 xl:divide-x divide-border">

                    <div
                        className="flex flex-col min-h-0"
                    >
                        <div className="px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm shrink-0 flex items-center gap-2">
                            <Palette size={16} className="text-primary" />
                            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Colors</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">

                            {/* PRIMARY SECTION */}
                            {/* PRIMARY SECTION */}
                            {/* PRIMARY SECTION */}
                            {/* PRIMARY SECTION */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Mode</h3>
                            </div>
                            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg border border-border w-fit mb-6">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={cn(
                                        "p-1.5 rounded-md transition-all flex items-center gap-2",
                                        resolvedTheme === 'light'
                                            ? "bg-primary/20 text-primary shadow-sm shadow-primary/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <Sun size={16} />
                                    <span className="text-xs font-medium">Light</span>
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={cn(
                                        "p-1.5 rounded-md transition-all flex items-center gap-2",
                                        resolvedTheme === 'dark'
                                            ? "bg-primary/20 text-primary shadow-sm shadow-primary/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <Moon size={16} />
                                    <span className="text-xs font-medium">Dark</span>
                                </button>
                            </div>

                            {/* PRIMARY SECTION */}
                            <PaletteSection
                                title="Primary"
                                colors={PRIMARY_OPTIONS}
                                onColorSelect={handlePrimaryChange}
                                activeHex={activePrimary}
                                alwaysOpen={true}
                                showHex={false}
                                showClass={false}
                            />

                            {/* SECONDARY SECTION */}
                            {/* SECONDARY SECTION */}
                            {/* SECONDARY SECTION */}
                            {/* SECONDARY SECTION (Hidden / Automated) */}

                            <PaletteSection
                                title="Semantic"
                                minimal={true}
                                colors={[
                                    { name: "Red (Destructive)", class: "bg-red-500", hex: "#ef4444" },
                                    { name: "Red (Error Bg)", class: "bg-red-900", hex: "#7f1d1d" },
                                    { name: "Emerald (Success)", class: "bg-emerald-500", hex: "#10b981" },
                                    { name: "Emerald (Success Bg)", class: "bg-emerald-900", hex: "#064e3b" },
                                    { name: "Amber (Warning)", class: "bg-amber-500", hex: "#f59e0b" },
                                ]}
                            />
                        </div>
                    </div>

                    {/* COLUMN 2: TYPOGRAPHY (TEXT) */}
                    <div className="flex flex-col min-h-0">
                        <div className="px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm shrink-0 flex items-center gap-2">
                            <Type size={16} className="text-primary" />
                            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Typography and Display</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                            <div className="space-y-4">
                                <h1 className="text-4xl font-black text-foreground">Heading 1 (4xl)</h1>
                                <h2 className="text-3xl font-bold text-foreground">Heading 2 (3xl Bold)</h2>
                                <h3 className="text-2xl font-bold text-foreground">Heading 3 (2xl Bold)</h3>
                                <h4 className="text-xl font-bold text-foreground">Heading 4 (xl Bold)</h4>
                            </div>
                            <div className="space-y-4 border-t border-border pt-4">
                                <p className="text-base text-foreground">Body Base (text-base) - The quick brown fox jumps over the lazy dog.</p>
                                <p className="text-sm text-muted-foreground">Body Small (text-sm muted-foreground) - Used for descriptions and secondary text.</p>
                                <p className="text-xs text-muted-foreground/80">Caption (text-xs muted-foreground/80) - For metadata and timestamps.</p>
                                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Kicker / Label (Uppercase Tracking Wider)</p>
                            </div>

                            {/* DIALOGS & NOTIFICATIONS */}
                            <ComponentSection title="Dialogs & Notifications" description="Modals and toast notifications (Embedded Mockups).">
                                <div className="flex flex-col gap-6">

                                    {/* Mock Dialog */}
                                    {/* Mock Dialog */}
                                    <div className="w-full bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-full shrink-0 bg-red-500/10 text-red-500">
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-semibold text-foreground leading-none tracking-tight">Delete Item</h3>
                                                <p className="text-sm text-muted-foreground">Are you sure you want to delete this item? This action cannot be undone.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-3 pt-2">
                                            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                                            <button className="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 ring-1 ring-destructive/20">Delete Item</button>
                                        </div>
                                    </div>

                                    {/* Mock Toast */}
                                    {/* Mock Toast */}
                                    <div className="w-full bg-card border border-border rounded-lg shadow-lg p-4 flex items-start gap-4">
                                        <div className="grid gap-1">
                                            <h3 className="text-sm font-semibold text-foreground">Notification</h3>
                                            <p className="text-sm text-muted-foreground">This is how a toast notification appears.</p>
                                        </div>
                                    </div>

                                </div>
                            </ComponentSection>

                            {/* LOADING & FEEDBACK (Moved from Col 3) */}
                            <ComponentSection title="Feedback & Loading" description="Loading states and indicators.">
                                <div className="space-y-6">
                                    <div className="p-4 border border-border rounded-lg bg-muted/50">
                                        <LoadingState message="Standard Component Loading..." />
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                                            <Check size={12} />
                                            Success
                                        </div>
                                        <div className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20 flex items-center gap-1.5">
                                            <AlertTriangle size={12} />
                                            Warning
                                        </div>
                                        <div className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 flex items-center gap-1.5">
                                            <X size={12} />
                                            Error
                                        </div>
                                    </div>
                                </div>
                            </ComponentSection>
                        </div>
                    </div>

                    {/* COLUMN 3: COMPONENTS (ELEMENTS) */}
                    <div className="flex flex-col min-h-0">
                        <div className="px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm shrink-0 flex items-center gap-2">
                            <Layers size={16} className="text-primary" />
                            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Elements and Fields</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                            <div className="flex flex-col gap-8">
                                {/* BUTTONS */}
                                <ComponentSection title="Buttons" description="Primary, Secondary, Ghost, and Destructive variants.">
                                    <div className="flex flex-wrap gap-4 items-center">
                                        <Button>Primary Action</Button>
                                        <Button variant="secondary">Secondary</Button>
                                        <Button variant="outline">Outline</Button>
                                        <Button variant="ghost">Ghost</Button>
                                        <Button variant="destructive">Destructive</Button>
                                        <Button size="sm">Small</Button>
                                        <Button size="icon"><Bell size={16} /></Button>
                                        <Button disabled>Disabled</Button>
                                        <Button disabled><Loader2 className="animate-spin mr-2" size={16} /> Loading</Button>
                                    </div>
                                </ComponentSection>

                                {/* FORM INPUTS */}
                                <ComponentSection title="Inputs" description="Text fields, search, and switches.">
                                    <div className="space-y-4 w-full">
                                        <div className="space-y-2">
                                            <Label>Email Address</Label>
                                            <Input placeholder="Enter your email..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Search Input</Label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                                <Input className="pl-9" placeholder="Search..." />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Counter Input</Label>
                                            <div className="flex items-center w-full bg-muted/80 border border-border rounded-lg overflow-hidden transition-colors focus-within:border-primary/50">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setCounter(prev => prev - 1);
                                                    }}
                                                    className="h-10 w-12 flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border-r border-border active:bg-primary/10 active:text-primary"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <input
                                                    type="number"
                                                    value={counter}
                                                    onChange={(e) => setCounter(parseInt(e.target.value) || 0)}
                                                    className="flex-1 bg-transparent border-none text-center text-foreground h-10 focus:outline-none placeholder:text-muted-foreground appearance-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setCounter(prev => prev + 1);
                                                    }}
                                                    className="h-10 w-12 flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border-l border-border active:bg-primary/10 active:text-primary"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>


                                        <div className="space-y-2">
                                            <Label>Date Picker</Label>
                                            <DatePicker value={date} onChange={setDate} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Custom Select</Label>
                                            <CustomSelect
                                                value="option1"
                                                options={[
                                                    { label: "Option 1", value: "option1" },
                                                    { label: "Option 2", value: "option2" },
                                                    { label: "Option 3", value: "option3" }
                                                ]}
                                                onChange={() => { }}
                                            />
                                        </div>
                                    </div>
                                </ComponentSection>

                                {/* MULTI SELECT */}
                                <ComponentSection title="Multi Select options" description="Interactive Multi-Select / Binary toggle with layout options.">
                                    <div className="space-y-4 w-full">

                                        {/* Toolbar */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Layout Style Toolbar */}
                                            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg border border-border w-fit">
                                                {[
                                                    { value: 'vertical', icon: AlignJustify, label: 'Vertical' },
                                                    { value: 'horizontal', icon: Columns, label: 'Horizontal' },
                                                    { value: 'columns', icon: LayoutGrid, label: 'Columns' }
                                                ].map((layout) => {
                                                    const Icon = layout.icon;
                                                    const isBinary = multiSelectSettings.binary_mode;
                                                    const currentStyle = multiSelectSettings.multi_select_style || 'vertical';
                                                    const isActive = !isBinary && currentStyle === layout.value;

                                                    return (
                                                        <div key={layout.value} className="flex items-center">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setMultiSelectSettings(prev => ({ ...prev, binary_mode: false, multi_select_style: layout.value }));
                                                                            }}
                                                                            className={cn(
                                                                                "p-1.5 rounded-md transition-all",
                                                                                isActive
                                                                                    ? "bg-primary/20 text-primary shadow-sm shadow-primary/10"
                                                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                            )}
                                                                        >
                                                                            <Icon size={16} />
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{layout.label}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>

                                                            {/* Column Selector */}
                                                            {layout.value === 'columns' && currentStyle === 'columns' && (
                                                                <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-border animate-in fade-in zoom-in-50 duration-200">
                                                                    {[2, 3, 4].map((cols) => {
                                                                        const currentCols = Number(multiSelectSettings.multi_select_columns) || 2;
                                                                        return (
                                                                            <button
                                                                                key={cols}
                                                                                type="button"
                                                                                onClick={() => setMultiSelectSettings(prev => ({ ...prev, multi_select_columns: cols }))}
                                                                                className={cn(
                                                                                    "w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold transition-all",
                                                                                    currentCols === cols
                                                                                        ? "bg-primary text-primary-foreground shadow-sm"
                                                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                                )}
                                                                            >
                                                                                {cols}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Binary Mode Toggle */}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setMultiSelectSettings(prev => {
                                                                        const next = !prev.binary_mode;
                                                                        return { ...prev, binary_mode: next, multi_select_style: next ? '' : 'vertical' };
                                                                    });
                                                                }}
                                                                className={cn(
                                                                    "p-1.5 rounded-md transition-all",
                                                                    multiSelectSettings.binary_mode
                                                                        ? "bg-primary/20 text-primary shadow-sm shadow-primary/10"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                )}
                                                            >
                                                                <ToggleRight size={16} />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Binary Mode (Yes/No only)</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>

                                            {/* Visual Style Toolbar */}
                                            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg border border-border w-fit">
                                                {[
                                                    { value: 'button', icon: Square, label: 'Button Style (Default)' },
                                                    { value: 'list', icon: LayoutList, label: 'List Style (Compact)' }
                                                ].map((style) => {
                                                    const Icon = style.icon;
                                                    const currentVisual = multiSelectSettings.multi_select_visual || 'button';
                                                    const isActive = currentVisual === style.value;
                                                    return (
                                                        <TooltipProvider key={style.value}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setMultiSelectSettings(prev => ({ ...prev, multi_select_visual: style.value }))}
                                                                        className={cn(
                                                                            "p-1.5 rounded-md transition-all",
                                                                            isActive
                                                                                ? "bg-primary/20 text-primary shadow-sm shadow-primary/10"
                                                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                        )}
                                                                    >
                                                                        <Icon size={16} />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{style.label}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Live Example */}
                                        <div className={cn(
                                            "pt-2",
                                            (multiSelectSettings.multi_select_visual === 'list' && !multiSelectSettings.binary_mode) ? "border border-border rounded-lg p-3 bg-muted/50" : "",
                                            (multiSelectSettings.multi_select_style === 'horizontal') ? "flex flex-wrap gap-3" :
                                                (multiSelectSettings.multi_select_style === 'columns') ?
                                                    ((Number(multiSelectSettings.multi_select_columns || 2) === 3) ? "grid grid-cols-3 gap-3" :
                                                        (Number(multiSelectSettings.multi_select_columns || 2) === 4) ? "grid grid-cols-4 gap-3" :
                                                            "grid grid-cols-2 gap-3") :
                                                    "space-y-3" // Default Vertical
                                        )}>
                                            {multiSelectSettings.binary_mode ? (
                                                // Binary Mode
                                                (multiSelectSettings.multi_select_visual || 'button') === 'button' ? (
                                                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted hover:border-border/80 transition-colors">
                                                        <span className="text-sm text-foreground/80 font-medium">Binary Choice</span>
                                                        <Switch
                                                            checked={multiSelectValue === 'yes'}
                                                            onCheckedChange={(c) => setMultiSelectValue(c ? 'yes' : 'no')}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between p-0 rounded-lg hover:bg-muted transition-colors">
                                                        <span className="text-sm text-foreground/80 font-medium">Binary Choice</span>
                                                        <Switch
                                                            checked={multiSelectValue === 'yes'}
                                                            onCheckedChange={(c) => setMultiSelectValue(c ? 'yes' : 'no')}
                                                        />
                                                    </div>
                                                )
                                            ) : (
                                                // Options List
                                                EXAMPLE_OPTIONS.map((opt) => {
                                                    const isSelected = (Array.isArray(multiSelectValue) && multiSelectValue.includes(opt.value));
                                                    const isVisualList = multiSelectSettings.multi_select_visual === 'list';

                                                    return (
                                                        <div
                                                            key={opt.value}
                                                            className={cn(
                                                                "flex items-center space-x-3 transition-all cursor-pointer group",
                                                                isVisualList
                                                                    ? "px-1 py-1 border-none hover:bg-muted rounded"
                                                                    : "px-3 py-3 rounded-lg border",
                                                                !isVisualList && isSelected
                                                                    ? "bg-primary/10 border-primary/50"
                                                                    : !isVisualList
                                                                        ? "bg-muted/50 border-border hover:border-border/80"
                                                                        : ""
                                                            )}
                                                            onClick={() => {
                                                                const current = Array.isArray(multiSelectValue) ? multiSelectValue : [];
                                                                if (current.includes(opt.value)) {
                                                                    setMultiSelectValue(current.filter((v: any) => v !== opt.value));
                                                                } else {
                                                                    setMultiSelectValue([...current, opt.value]);
                                                                }
                                                            }}
                                                        >
                                                            <div className={cn(
                                                                "w-5 h-5 flex items-center justify-center border transition-colors",
                                                                "rounded",
                                                                isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-background/50 border-border group-hover:border-primary/50"
                                                            )}>
                                                                {isSelected && <Check size={14} className="stroke-[3]" />}
                                                            </div>
                                                            <span className={cn("text-sm", isSelected ? "text-foreground" : "text-muted-foreground")}>
                                                                {opt.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                    </div>
                                </ComponentSection>


                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}
