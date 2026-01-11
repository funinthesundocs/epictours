"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ComboboxProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
}

export function Combobox({ value, onChange, options, placeholder }: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter options based on query
    const filteredOptions = query === ""
        ? options
        : options.filter((opt) =>
            opt.toLowerCase().includes(query.toLowerCase())
        );

    // Sync internal query with external value if needed, 
    // but usually for a combobox we want to allow free typing too?
    // The user asked for "autopopulate", implying selection, but if it's a new hotel, they might need to type it.
    // For now, I'll strictly allow selection from list OR free text if handled by parent.
    // Let's allow free text input by updating `onChange` on input change.

    useEffect(() => {
        // Determine if we should set the input value to the prop value
        // Only if the user isn't currently typing (we can't easily detect that here without complexity)
        // A simple approach: Controlled Input.
        setQuery(value || "");
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        onChange(option);
        setQuery(option);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setQuery(newVal);
        onChange(newVal); // Allow free text
        setIsOpen(true);
    };

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-600"
                    placeholder={placeholder}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <ChevronDown size={16} />
                </div>
            </div>

            <AnimatePresence>
                {isOpen && filteredOptions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                    >
                        {filteredOptions.map((option) => {
                            const isSelected = value === option;
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors group
                                        ${isSelected ? "bg-cyan-500 text-black font-medium" : "text-zinc-900 hover:bg-cyan-500 hover:text-black"}
                                    `}
                                >
                                    <span>{option}</span>
                                    {isSelected && <Check size={14} className="text-black" />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
