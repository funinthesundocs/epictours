"use client"

import * as React from "react"
import { Clock, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface TimePickerProps {
    value?: string // HH:mm format
    onChange?: (time: string) => void
    placeholder?: string
    className?: string
}

// Generate hours array (00-23)
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))

// Generate minutes array (00, 15, 30, 45)
const minutes = ['00', '15', '30', '45']

export function TimePicker({
    value,
    onChange,
    placeholder = "Select time",
    className,
}: TimePickerProps) {
    const [open, setOpen] = React.useState(false)

    // Parse current value
    const parseTime = (val?: string) => {
        if (!val) return { h: '', m: '', p: '' }
        // Strip any existing AM/PM suffix
        const cleanVal = val.replace(/\s*(AM|PM)$/i, '').trim()
        const [hStr, mStr] = cleanVal.split(':')
        const h = parseInt(hStr, 10)
        const p = h >= 12 ? 'PM' : 'AM'
        let h12 = h % 12
        if (h12 === 0) h12 = 12
        return { h: h12.toString(), m: mStr, p }
    }

    const { h: currentHour, m: currentMinute, p: currentPeriod } = parseTime(value)

    const handleSelect = (newH: string, newM: string, newP: string) => {
        if (!newH || !newM || !newP) return

        let h24 = parseInt(newH, 10)
        if (newP === 'PM' && h24 !== 12) h24 += 12
        if (newP === 'AM' && h24 === 12) h24 = 0

        const hStr = h24.toString().padStart(2, '0')
        onChange?.(`${hStr}:${newM}`)
        // Keep open to allow changing other parts? Usually close on selection? 
        // With 3 columns, auto-closing is annoying. Let's keep open until outside click or maybe close only if all 3 set?
        // User behavior: usually selects Hour -> Minute -> Period.
        // Let's NOT auto-close on individual clicks to allow full composition.
        // Or auto-close if all parts were already present and user just tweaked one?
        // Let's stick to NO auto-close for now, or minimal annoyance.
        // Actually, previous behavior closed on selection.
        // If I change hour, wait for minute?
        // Let's keep it open.
    }

    const hours12 = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
    const minutes5 = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))
    const periods = ['AM', 'PM']

    // Defaults for composition
    const safeH = currentHour || '12'
    const safeM = currentMinute || '00'
    const safeP = currentPeriod || 'PM'

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "w-full flex items-center justify-between bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-left transition-colors hover:border-white/20 focus:outline-none focus:border-cyan-500/50",
                        !value && "text-zinc-500",
                        value && "text-white",
                        className
                    )}
                >
                    <span>{value ? `${currentHour}:${currentMinute} ${currentPeriod}` : placeholder}</span>
                    <Clock className="h-4 w-4 text-zinc-500" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[260px] p-0 bg-zinc-900 border-white/10"
                align="start"
            >
                <div className="flex divide-x divide-white/10 max-h-[280px] h-[280px]">
                    {/* Hours column */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="bg-zinc-900 z-10 mx-1 mt-1 rounded-md px-3 py-2 text-sm text-zinc-500 font-medium text-center">
                            Hour
                        </div>
                        <div className="flex-1 overflow-y-auto py-1 scrollbar-hide">
                            {hours12.map((h) => (
                                <button
                                    key={h}
                                    onClick={() => handleSelect(h, safeM, safeP)}
                                    className={cn(
                                        "w-full px-3 py-1.5 text-sm text-center hover:bg-white/10 transition-colors rounded-md mx-1 w-[calc(100%-8px)]",
                                        currentHour === h
                                            ? "bg-cyan-500 text-black font-semibold shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                            : "text-zinc-300 hover:text-white"
                                    )}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Minutes column */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="bg-zinc-900 z-10 mx-1 mt-1 rounded-md px-3 py-2 text-sm text-zinc-500 font-medium text-center">
                            Min
                        </div>
                        <div className="flex-1 overflow-y-auto py-1 scrollbar-hide">
                            {minutes5.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => handleSelect(safeH, m, safeP)}
                                    className={cn(
                                        "w-full px-3 py-1.5 text-sm text-center hover:bg-white/10 transition-colors rounded-md mx-1 w-[calc(100%-8px)]",
                                        currentMinute === m
                                            ? "bg-cyan-500 text-black font-semibold shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                            : "text-zinc-300 hover:text-white"
                                    )}
                                >
                                    :{m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AM/PM column */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="bg-zinc-900 z-10 mx-1 mt-1 rounded-md flex items-center justify-end pr-2 h-[36px]">
                            <button
                                onClick={() => setOpen(false)}
                                className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto py-1 scrollbar-hide">
                            {periods.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => handleSelect(safeH, safeM, p)}
                                    className={cn(
                                        "w-full px-3 py-1.5 text-sm text-center hover:bg-white/10 transition-colors rounded-md mx-1 w-[calc(100%-8px)]",
                                        currentPeriod === p
                                            ? "bg-cyan-500 text-black font-semibold shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                            : "text-zinc-300 hover:text-white"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
