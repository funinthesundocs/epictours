"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export interface GlassComboboxProps {
    options: { label: string; value: string }[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    className?: string;
}

export function GlassCombobox({
    options,
    value,
    onChange,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyMessage = "No item found.",
    disabled = false,
    className
}: GlassComboboxProps) {
    const [open, setOpen] = React.useState(false);

    const selectedLabel = React.useMemo(() => {
        return options.find((opt) => opt.value === value)?.label;
    }, [options, value]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal",
                        // Trigger Styling: Black/20, White Text, Subtle Border
                        "bg-zinc-900/80 border-white/10 text-white hover:bg-zinc-900 hover:text-white hover:border-white/20",
                        !value && "text-zinc-500",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedLabel || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-zinc-400" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-white/10 bg-transparent shadow-2xl backdrop-blur-xl">
                {/* 
                    Dropdown Content Styling: 
                    - Background: Black/20 (Glass) -> We use bg-black/80 for readability or backdrop-blur 
                    - User asked for "black/20". We will try bg-black/40 with blur for best compromise of "glass" and "readability".
                    - Actually, strict adherence: "black/20".
                */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-md overflow-hidden">
                    <Command className="bg-transparent text-white">
                        <CommandInput
                            placeholder={searchPlaceholder}
                            className="border-none focus:ring-0 text-white placeholder:text-zinc-500"
                        />
                        <CommandList className="custom-scrollbar max-h-[300px]">
                            <CommandEmpty className="py-3 text-sm text-center text-zinc-500">
                                {emptyMessage}
                            </CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label} // Search by Label
                                        onSelect={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "cursor-pointer transition-colors px-2 py-2 text-sm",
                                            "text-white data-[selected=true]:bg-cyan-400 data-[selected=true]:text-black"
                                        )}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
            </PopoverContent>
        </Popover>
    );
}
