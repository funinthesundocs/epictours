"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    Edit,
    Copy,
    Trash2,
    ChevronDown,
    Check,
    Clock,
    LayoutGrid,
    List,
    AlignLeft
} from "lucide-react";

type CalendarView = 'month' | 'week' | 'day';

export function BookingCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 13)); // Jan 13, 2026
    const [view, setView] = useState<CalendarView>('month');
    const [selectedExperience, setSelectedExperience] = useState("Mauna Kea Summit");
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    const experiences = [
        "Mauna Kea Summit",
        "Circle Island Tour",
        "Pearl Harbor Express",
        "Kona Coffee Farm",
        "Manta Ray Night Snorkel"
    ];

    // Cycle View Logic
    const cycleView = () => {
        const views: CalendarView[] = ['month', 'week', 'day'];
        const nextIndex = (views.indexOf(view) + 1) % views.length;
        setView(views[nextIndex]);
    };

    const getViewLabel = () => {
        switch (view) {
            case 'month': return 'Monthly';
            case 'week': return 'Weekly';
            case 'day': return 'Daily';
        }
    };

    const getViewIcon = () => {
        switch (view) {
            case 'month': return CalendarIcon;
            case 'week': return LayoutGrid;
            case 'day': return List;
        }
    };

    // Close picker when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="w-full h-full bg-black p-6 font-sans flex flex-col gap-6">
            {/* TOP COMPONENT: Control Bar */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-6 border-b border-zinc-900">

                {/* LEFT: Title */}
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-black text-white tracking-tighter shrink-0">
                        JAN <span className="text-zinc-800">26</span>
                    </h1>

                    {/* Navigation */}
                    <div className="flex gap-1">
                        <button className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                        <button className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* RIGHT: Selector & Toolbar Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">

                    {/* COMPACT EXPERIENCE SELECTOR */}
                    <div className="relative w-[220px] mr-2" ref={pickerRef}>
                        <div
                            className={cn(
                                "w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white cursor-pointer flex items-center justify-between transition-all hover:bg-zinc-900 hover:border-zinc-700",
                                isPickerOpen && "border-indigo-500/50 bg-zinc-900 ring-1 ring-indigo-500/20"
                            )}
                            onClick={() => setIsPickerOpen(!isPickerOpen)}
                        >
                            <span className="font-semibold text-sm truncate">{selectedExperience}</span>
                            <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform shrink-0 ml-2", isPickerOpen && "rotate-180")} />
                        </div>

                        {/* Dropdown Menu */}
                        {isPickerOpen && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {experiences.map((exp) => (
                                    <div
                                        key={exp}
                                        className={cn(
                                            "px-4 py-3 text-sm cursor-pointer flex items-center justify-between transition-colors border-b border-zinc-900 last:border-0",
                                            selectedExperience === exp
                                                ? "bg-indigo-900/20 text-indigo-400"
                                                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                                        )}
                                        onClick={() => {
                                            setSelectedExperience(exp);
                                            setIsPickerOpen(false);
                                        }}
                                    >
                                        {exp}
                                        {selectedExperience === exp && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* VIEW TOGGLE BUTTON */}
                    <button
                        onClick={cycleView}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border bg-zinc-800 text-white border-zinc-700 shadow-lg hover:bg-zinc-700 min-w-[110px] justify-center"
                    >
                        {React.createElement(getViewIcon(), { className: "w-3.5 h-3.5" })}
                        {getViewLabel()}
                    </button>

                    <div className="w-px h-8 bg-zinc-900 mx-2"></div>

                    <ToolbarButton icon={Plus} label="Create" />
                    <ToolbarButton icon={Edit} label="Edit" />
                    <ToolbarButton icon={Copy} label="Duplicate" />
                    <ToolbarButton icon={Trash2} label="Delete" danger />
                </div>
            </div>

            {/* CALENDAR CONTENT AREA */}
            <div className="flex-1 bg-zinc-900 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl shadow-black relative">
                {view === 'month' && <MonthView selectedExperience={selectedExperience} />}
                {view === 'week' && <WeekView selectedExperience={selectedExperience} />}
                {view === 'day' && <DayView selectedExperience={selectedExperience} />}
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function MonthView({ selectedExperience }: { selectedExperience: string }) {
    // Abbreviation Mapping
    const EXP_ABBR: Record<string, string> = {
        "Mauna Kea Summit": "MKS",
        "Circle Island Tour": "CIT",
        "Pearl Harbor Express": "PHE",
        "Kona Coffee Farm": "KCF",
        "Manta Ray Night Snorkel": "MRNS"
    };

    const abbr = EXP_ABBR[selectedExperience] || "EXP";

    return (
        <div className="h-full grid grid-cols-7 gap-px bg-zinc-900">
            {/* Headers */}
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => (
                <div key={day} className="bg-zinc-950/80 p-4 text-[10px] font-bold text-zinc-400 uppercase text-center backdrop-blur-sm sticky top-0 z-10 border-b border-zinc-900">{day}</div>
            ))}

            {/* Cells */}
            {Array.from({ length: 35 }).map((_, i) => {
                const day = i - 2;
                const isToday = day === 13;

                return (
                    <div key={i} className={cn(
                        "bg-black relative group transition-colors hover:bg-zinc-900/50 p-2 min-h-[100px] flex flex-col pl-3 pt-3", // Added padding
                        isToday && "bg-zinc-900/30"
                    )}>
                        {day > 0 && day <= 31 && (
                            <>
                                <span className={cn(
                                    "text-sm font-bold block mb-2 transition-colors w-8 h-8 flex items-center justify-center rounded-full",
                                    isToday ? "bg-indigo-600 text-white" : "text-zinc-600 group-hover:text-zinc-300" // Adjusted for better vis on black
                                )}>{day}</span>

                                {/* Event Chips (Daily Mock Data) */}
                                <EventChip
                                    color="cyan"
                                    abbr={abbr}
                                    time="14:00"
                                    bookings="10"
                                    cap="10 / 29 Capacity"
                                    note="Need Min of 25"
                                />
                            </>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function WeekView({ selectedExperience }: { selectedExperience: string }) {
    const hours = Array.from({ length: 14 }, (_, i) => i + 6); // 6 AM to 8 PM
    const days = [
        { name: "MON", date: 12 },
        { name: "TUE", date: 13, today: true },
        { name: "WED", date: 14 },
        { name: "THU", date: 15 },
        { name: "FRI", date: 16 },
        { name: "SAT", date: 17 },
        { name: "SUN", date: 18 },
    ];

    return (
        <div className="h-full flex flex-col bg-black overflow-hidden font-sans">
            {/* Week Header */}
            <div className="flex border-b border-zinc-900">
                <div className="w-16 shrink-0 bg-zinc-950 border-r border-zinc-900"></div> {/* Time axis spacer */}
                {days.map(day => (
                    <div key={day.name} className={cn(
                        "flex-1 py-4 text-center border-r border-zinc-900 bg-zinc-950/50 backdrop-blur-sm",
                        day.today && "bg-indigo-900/10"
                    )}>
                        <div className="text-[10px] font-bold text-zinc-500 mb-1">{day.name}</div>
                        <div className={cn(
                            "text-xl font-bold inline-block",
                            day.today ? "text-indigo-500" : "text-white"
                        )}>{day.date}</div>
                    </div>
                ))}
            </div>

            {/* Week Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex">
                {/* Time Axis */}
                <div className="w-16 shrink-0 border-r border-zinc-900 bg-black">
                    {hours.map(hour => (
                        <div key={hour} className="h-20 text-[10px] text-zinc-500 font-bold text-right pr-3 pt-2 border-b border-zinc-900/50">
                            {hour}:00
                        </div>
                    ))}
                </div>

                {/* Columns */}
                {days.map(day => (
                    <div key={day.name} className={cn(
                        "flex-1 border-r border-zinc-900 relative min-w-[100px]",
                        day.today && "bg-zinc-900/20"
                    )}>
                        {hours.map(hour => (
                            <div key={hour} className="h-20 border-b border-zinc-900/50"></div>
                        ))}

                        {/* Mock Events (Absolute positioning simulation) */}
                        {day.today && hourToPx(14, 20) && selectedExperience.includes("Mauna") && (
                            <div className="absolute top-[160px] left-1 right-1 h-[60px] bg-indigo-900/80 border-l-2 border-indigo-500 rounded px-2 py-1 cursor-pointer hover:bg-indigo-800 transition-colors">
                                <div className="text-[10px] font-bold text-indigo-200">MAUNA KEA</div>
                                <div className="text-[9px] text-indigo-400">14:00 - 15:00</div>
                            </div>
                        )}

                        {day.name === "THU" && selectedExperience.includes("Circle") && (
                            <div className="absolute top-[20px] left-1 right-1 h-[140px] bg-emerald-900/80 border-l-2 border-emerald-500 rounded px-2 py-1 cursor-pointer hover:bg-emerald-800 transition-colors">
                                <div className="text-[10px] font-bold text-emerald-200">ISLAND LOOP</div>
                                <div className="text-[9px] text-emerald-400">07:00 - 10:30</div>
                            </div>
                        )}

                        {/* Current Time Indicator (Visual Mock) */}
                        {day.today && (
                            <div className="absolute top-[200px] w-full border-t-2 border-indigo-500 z-10 flex items-center">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full -ml-1"></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

function DayView({ selectedExperience }: { selectedExperience: string }) {
    const timeSlots = [
        { time: "08:00", events: [] },
        { time: "09:00", events: [] },
        { time: "10:00", events: [] },
        { time: "11:00", events: [] },
        { time: "12:00", events: [] },
        { time: "13:00", events: [] },
        { time: "14:00", events: [{ title: "MAUNA KEA SUMMIT", duration: "4h", pax: "12/14", revenue: "$2,400", status: "confirmed" }] },
        { time: "15:00", events: [] },
        { time: "16:00", events: [] },
        { time: "17:00", events: [] },
        { time: "18:00", events: [] },
        { time: "19:00", events: [{ title: "STARGAZE EXPERIENCE", duration: "2h", pax: "06/14", revenue: "$900", status: "pending" }] },
        { time: "20:00", events: [] },
    ];

    return (
        <div className="h-full flex flex-col bg-black">
            {/* Day Header */}
            <div className="p-6 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-sm flex justify-between items-end">
                <div>
                    <div className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-1">Tuesday</div>
                    <div className="text-5xl font-black text-white">13 JAN</div>
                </div>
                <div className="flex gap-8 text-right">
                    <div>
                        <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Availability</div>
                        <div className="text-2xl font-bold text-white">42%</div>
                    </div>
                    <div>
                        <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Revenue</div>
                        <div className="text-2xl font-bold text-emerald-500">$3,300</div>
                    </div>
                </div>
            </div>

            {/* Day Schedule */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {timeSlots.map((slot, i) => (
                        <div key={i} className="flex gap-6 group">
                            <div className="w-16 pt-2 text-right">
                                <span className="text-sm font-bold text-zinc-600 group-hover:text-zinc-400 transition-colors">{slot.time}</span>
                            </div>

                            <div className="flex-1 min-h-[60px] border-l border-zinc-800 pl-6 pb-6 relative">
                                <div className="absolute left-[-5px] top-[10px] w-2.5 h-2.5 rounded-full bg-zinc-900 border-2 border-zinc-700 group-hover:border-zinc-500 transition-colors"></div>

                                {slot.events.length > 0 ? (
                                    slot.events.map((evt, idx) => (
                                        <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:bg-zinc-800/80 transition-all cursor-pointer shadow-lg group/card">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full", evt.status === 'confirmed' ? "bg-indigo-500" : "bg-purple-500")}></div>
                                                    <h3 className="font-bold text-white text-lg tracking-tight">{evt.title}</h3>
                                                </div>
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                                    evt.status === 'confirmed' ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                                )}>{evt.status}</span>
                                            </div>

                                            <div className="flex gap-6 text-xs text-zinc-400 font-medium">
                                                <div className="flex items-center gap-1.5"><Clock size={12} /> {evt.duration}</div>
                                                <div className="flex items-center gap-1.5"><LayoutGrid size={12} /> {evt.pax} PAX</div>
                                                <div className="flex items-center gap-1.5 text-emerald-500"><Check size={12} /> {evt.revenue}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full border-b border-dashed border-zinc-900/50"></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// --- SHARED HELPERS ---

function ToolbarButton({
    icon: Icon,
    label,
    active = false,
    danger = false
}: {
    icon: any,
    label: string,
    active?: boolean,
    danger?: boolean
}) {
    return (
        <button className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
            active
                ? "bg-zinc-800 text-white border-zinc-700 shadow-lg"
                : danger
                    ? "bg-black text-zinc-400 border-zinc-900 hover:bg-red-950/20 hover:text-red-500 hover:border-red-900/50"
                    : "bg-black text-zinc-400 border-zinc-900 hover:bg-zinc-900 hover:text-white hover:border-zinc-800"
        )}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    )
}

function EventChip({
    color,
    abbr,
    time,
    bookings,
    cap,
    note
}: {
    color: string,
    abbr: string,
    time: string,
    bookings: string,
    cap: string,
    note?: string
}) {
    const colorStyles: Record<string, string> = {
        indigo: "bg-indigo-600/90 hover:bg-indigo-500 border-l-[3px] border-indigo-400",
        cyan: "bg-cyan-600/90 hover:bg-cyan-500 border-l-[3px] border-cyan-400",
        purple: "bg-purple-900/80 hover:bg-purple-800 border-l-[3px] border-purple-500",
        emerald: "bg-emerald-900/80 hover:bg-emerald-800 border-l-[3px] border-emerald-500",
    };

    // Fallback if color not found
    const style = colorStyles[color] || colorStyles.indigo;

    return (
        <div className={cn("mb-1 p-2 rounded-sm shadow-sm cursor-pointer transition-colors backdrop-blur-md flex flex-col items-start gap-0.5 min-h-[fit-content]", style)}>
            <span className="font-bold text-white text-xs leading-tight">{abbr}</span>
            <span className="text-white font-bold text-xs leading-tight">Start: {time}</span>
            <span className="text-white font-bold text-xs leading-tight">{bookings} Bookings</span>
            <span className="text-white font-bold text-xs leading-tight">{cap}</span>
            {note && <span className="text-white font-bold italic text-xs leading-tight mt-0.5">{note}</span>}
        </div>
    );
}

// Just a dummy helper to avoid TS errors in the mock WeekView
function hourToPx(start: number, end: number) {
    return true;
}
