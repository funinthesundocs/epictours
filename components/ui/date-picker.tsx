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
                        "w-full flex items-center justify-between bg-muted/50 border border-input rounded-lg px-4 py-2.5 text-sm text-left transition-colors hover:border-input focus:outline-none focus:border-primary/50",
                        !value && "text-muted-foreground",
                        value && "text-foreground",
                        className
                    )}
                >
                    <span>{value ? format(value, "MMM d, yyyy") : placeholder}</span>
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 bg-popover/95 backdrop-blur-xl border-border"
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
                    className="rounded-md border-border"
                    classNames={{
                        selected: "border-2 border-primary text-primary bg-transparent hover:text-primary focus:text-primary shadow-none font-bold rounded-md",
                        today: "bg-muted text-foreground rounded-md",
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}
