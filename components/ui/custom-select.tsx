"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CustomSelectOption {
    value: string;
    label: string;
    icon?: ReactNode;
}

interface CustomSelectProps {
    value?: string;
    onChange: (value: string) => void;
    // Support both simple strings and object options with optional icons
    options: (string | CustomSelectOption)[];
    placeholder?: string;
    className?: string; // Trigger button class
}

export function CustomSelect({ value, onChange, options, placeholder = "Select...", className }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    // Normalize options to objects
    const normalizedOptions: CustomSelectOption[] = options.map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    // Find selected option
    const selectedOption = normalizedOptions.find(o => o.value === value);

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-muted/80 border border-input rounded-lg px-4 text-left flex items-center justify-between text-foreground focus:outline-none focus:border-primary/50 transition-colors group ${className || "py-2.5"}`}
            >
                <span className={`flex items-center gap-2 ${value ? "text-foreground" : "text-muted-foreground"}`}>
                    {selectedOption?.icon}
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu - Dark Background to match Combobox */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-[70] w-full mt-1 bg-popover border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden"
                    >
                        {normalizedOptions.map((option) => {
                            const isSelected = value === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors group
                            ${isSelected ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"}
                        `}
                                >
                                    <span className="flex items-center gap-2">
                                        {option.icon}
                                        {option.label}
                                    </span>
                                    {isSelected && <Check size={14} className="text-primary" />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
