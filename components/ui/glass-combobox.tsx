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
                        // Trigger Styling: Semantic Glass
                        "bg-muted/80 border-border text-foreground hover:bg-muted hover:text-foreground hover:border-border/80",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedLabel || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-border bg-transparent shadow-2xl backdrop-blur-xl">
                {/* 
                    Dropdown Content Styling: 
                    - Semantic Glass: bg-popover/80 with backdrop blur.
                */}
                <div className="bg-popover/80 backdrop-blur-xl border border-border rounded-md overflow-hidden">
                    <Command className="bg-transparent text-foreground">
                        <CommandInput
                            placeholder={searchPlaceholder}
                            className="border-none focus:ring-0 text-foreground placeholder:text-muted-foreground"
                        />
                        <CommandList className="custom-scrollbar max-h-[300px]">
                            <CommandEmpty className="py-3 text-sm text-center text-muted-foreground">
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
                                            "text-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
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
