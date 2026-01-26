"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CustomSelectProps {
    value?: string;
    onChange: (value: string) => void;
    // Support both simple strings and object options
    options: (string | { value: string; label: string })[];
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
    const normalizedOptions = options.map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    // Find label for current value
    const selectedLabel = normalizedOptions.find(o => o.value === value)?.label || value;

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 text-left flex items-center justify-between text-white focus:outline-none focus:border-cyan-500/50 transition-colors group ${className || "py-2.5"}`}
            >
                <span className={value ? "text-white" : "text-zinc-500"}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown size={16} className={`text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu - Dark Background to match Combobox */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-50 w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden"
                    >
                        {normalizedOptions.map((option) => {
                            const isSelected = value === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors group
                            ${isSelected ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-300 hover:bg-white/10 hover:text-white"}
                        `}
                                >
                                    <span>{option.label}</span>
                                    {isSelected && <Check size={14} className="text-cyan-400" />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
