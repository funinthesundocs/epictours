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
    defaultOpen?: boolean
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    className,
    defaultOpen = false,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(defaultOpen)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "w-full flex items-center justify-between bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-left transition-colors hover:border-white/20 focus:outline-none focus:border-cyan-400/50",
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
                className="w-auto p-0 bg-zinc-900/95 backdrop-blur-xl border-zinc-800"
                align="start"
            >
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(date) => {
                        onChange?.(date)
                        setOpen(false)
                    }}
                    onClose={() => setOpen(false)}
                    disabled={false}
                    initialFocus
                    className="rounded-md border-zinc-800"
                    classNames={{
                        selected: "border-2 border-cyan-400 text-cyan-400 bg-transparent hover:text-cyan-300 focus:text-cyan-300 shadow-none font-bold rounded-md",
                        today: "bg-zinc-800 text-white rounded-md",
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}
