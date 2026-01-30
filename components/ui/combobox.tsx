"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, Check, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";

export type ComboboxOption = { value: string; label: string; icon?: ReactNode };

interface ComboboxProps {
    value?: string;
    onChange: (value: string) => void;
    options: (string | ComboboxOption)[];
    placeholder?: string;
    forceOpen?: boolean;
    className?: string;
    inputClassName?: string;
    disabled?: boolean;
}

export function Combobox({ value, onChange, options, placeholder, forceOpen, className, inputClassName, disabled }: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(forceOpen || false);
    const [query, setQuery] = useState("");
    const [position, setPosition] = useState<'bottom' | 'top'>('bottom');
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync forceOpen
    useEffect(() => {
        if (forceOpen !== undefined) {
            setIsOpen(forceOpen);
        }
    }, [forceOpen]);

    // Normalize options
    const normalizedOptions: ComboboxOption[] = options.map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    // Find selected label for initial state or external updates
    useEffect(() => {
        const selected = normalizedOptions.find(o => o.value === value);
        if (selected) {
            setQuery(selected.label);
        } else if (value && !normalizedOptions.some(o => o.value === value)) {
            // If value is set but not in options (free text scenario or pre-load), show it.
            // But for ID-based selects, this might show the ID if we aren't careful.
            // Assuming if it's not in options, treat as free text? 
            // For Hotels, value is ID. ID won't match label query usually.
            // If no match found, and it looks like a UUID, we probably shouldn't show it as query?
            // But let's trust the parent passes valid values or handles loading.
            // For this specific use case (AddHotel), we rely on looking up via options.
            setQuery(value);
        } else {
            setQuery("");
        }
    }, [value, options]);

    // Filter options based on query
    // Fix: If the query matches the selected value's label exactly, show ALL options (don't filter).
    // This ensures that when editing (and the field is pre-filled), the user sees the full list, not just the selected item.
    const selectedOption = normalizedOptions.find(o => o.value === value);
    const isExactMatch = selectedOption && selectedOption.label === query;

    const filteredOptions = (query === "" || isExactMatch)
        ? normalizedOptions
        : normalizedOptions.filter((opt) =>
            opt.label.toLowerCase().includes(query.toLowerCase())
        );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (forceOpen) return; // Ignore clicks outside if forced open
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [forceOpen]);

    // Calculate position on open
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // If less than 250px below, open upwards
            setPosition(spaceBelow < 250 ? 'top' : 'bottom');
        }
    }, [isOpen]);

    const handleSelect = (option: ComboboxOption) => {
        onChange(option.value);
        setQuery(option.label);
        if (!forceOpen) setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setQuery(newVal);
        // If free text is allowed, we pass it up. 
        // CAUTION: For ID-based fields, this passes the typed text (name) as the ID.
        // The parent form validation should catch if it requires a valid UUID or selection.
        onChange(newVal);
        setIsOpen(true);
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <div className="relative">
                {/* Show selected icon in the input */}
                {selectedOption?.icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {selectedOption.icon}
                    </div>
                )}
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => !disabled && setIsOpen(true)}
                    disabled={disabled}
                    className={cn(
                        "w-full bg-muted/80 border border-input rounded-lg pr-10 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground",
                        selectedOption?.icon ? "pl-10" : "pl-4",
                        inputClassName,
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    placeholder={placeholder}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <ChevronDown size={16} />
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (filteredOptions.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: position === 'bottom' ? 5 : -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: position === 'bottom' ? 5 : -5 }}
                        className={`absolute z-[70] w-full left-0 bg-popover border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto
                            ${position === 'bottom' ? "mt-1 top-full" : "mb-1 bottom-full"}
                        `}
                    >
                        {filteredOptions.map((option) => {
                            const isSelected = value === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors group
                                        ${isSelected ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"}
                                    `}
                                >
                                    <span className="flex items-center gap-2">
                                        {option.icon}
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        option.value === ''
                                            ? <Ban size={14} className="text-primary" />
                                            : <Check size={14} className="text-primary" />
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
