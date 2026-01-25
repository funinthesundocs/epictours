"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Check, ChevronDown, X } from "lucide-react"
import { DayPicker, useDayPicker } from "react-day-picker"
import { format, setMonth, setYear, startOfMonth } from "date-fns"

import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
    onClose?: () => void
}

function CalendarSelect({
    value,
    onChange,
    options
}: {
    value: string | number,
    onChange: (value: string) => void,
    options: { value: string, label: string }[]
}) {
    const [open, setOpen] = React.useState(false)
    const selectedLabel = options.find(o => o.value === value.toString())?.label || value

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className="h-7 px-2 flex items-center gap-1.5 text-base font-medium text-zinc-200 hover:bg-white/10 rounded transition-colors focus:outline-none"
                    type="button"
                >
                    {selectedLabel}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[140px] p-1 bg-zinc-900 border-white/10 max-h-[200px] overflow-y-auto">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => {
                            onChange(option.value)
                            setOpen(false)
                        }}
                        className={cn(
                            "w-full text-left px-2 py-1.5 text-sm rounded flex items-center justify-between hover:bg-white/10 transition-colors",
                            option.value === value.toString() ? "text-cyan-400" : "text-zinc-300"
                        )}
                    >
                        {option.label}
                        {option.value === value.toString() && <Check className="h-3 w-3" />}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    )
}

function CustomCaption(props: any) {
    const { goToMonth } = useDayPicker()
    const displayMonth = props.calendarMonth.date
    const onClose = (props as any).onClose

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const years = Array.from({ length: 100 }, (_, i) => {
        const year = new Date().getFullYear() - 50 + i
        return { value: year.toString(), label: year.toString() }
    })

    const handleMonthChange = (value: string) => {
        const newMonth = setMonth(displayMonth, parseInt(value))
        goToMonth(newMonth)
    }

    const handleYearChange = (value: string) => {
        const newMonth = setYear(displayMonth, parseInt(value))
        goToMonth(newMonth)
    }

    return (
        <div className="flex items-center justify-between pt-1 px-1 relative">
            <div className="flex items-center gap-1">
                <CalendarSelect
                    value={displayMonth.getMonth().toString()}
                    onChange={handleMonthChange}
                    options={months.map((m, i) => ({ value: i.toString(), label: m }))}
                />
                <CalendarSelect
                    value={displayMonth.getFullYear().toString()}
                    onChange={handleYearChange}
                    options={years}
                />
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    type="button"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    )
}

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    onClose,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                nav: "hidden", // Hide default nav
                button_previous: "hidden",
                button_next: "hidden",
                month_grid: "w-full border-collapse mt-4",
                weekdays: "flex",
                weekday: "text-zinc-500 rounded-md w-9 font-normal text-sm text-center",
                week: "flex w-full mt-2",
                day: "h-9 w-9 text-center text-base p-0 relative flex items-center justify-center",
                day_button: cn(
                    "h-8 w-8 p-0 font-normal hover:bg-zinc-800/80 rounded-md transition-colors text-zinc-300 hover:text-white flex items-center justify-center"
                ),
                selected: "bg-cyan-500 text-black hover:bg-cyan-400 hover:text-black focus:bg-cyan-500 focus:text-black font-semibold shadow-[0_0_10px_rgba(6,182,212,0.5)]",
                today: "bg-zinc-800 text-zinc-50 font-semibold rounded-md",
                outside: "text-zinc-600 opacity-50",
                disabled: "!text-zinc-700 !opacity-30 cursor-not-allowed pointer-events-none",
                range_middle: "bg-zinc-800 text-zinc-50",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                MonthCaption: (captionProps) => <CustomCaption {...captionProps} onClose={onClose} />
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
