"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    value?: Date
    onChange?: (date: Date | undefined) => void
    placeholder?: string
    className?: string
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    className,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "w-full flex items-center justify-between bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-left transition-colors hover:border-white/20 focus:outline-none focus:border-cyan-500/50",
                        !value && "text-zinc-500",
                        value && "text-white",
                        className
                    )}
                >
                    <span>{value ? format(value, "MMM d, yyyy") : placeholder}</span>
                    <CalendarIcon className="h-4 w-4 text-zinc-500" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 bg-zinc-900 border-white/10"
                align="start"
            >
                <div className="relative">
                    {/* Close button */}
                    <button
                        onClick={() => setOpen(false)}
                        className="absolute top-4 right-3 h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors z-10"
                    >
                        <X size={14} />
                    </button>
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={(date) => {
                            onChange?.(date)
                            setOpen(false)
                        }}
                        disabled={{ before: new Date() }}
                        initialFocus
                    />
                </div>
            </PopoverContent>
        </Popover>
    )
}
