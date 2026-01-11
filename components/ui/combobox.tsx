"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ComboboxOption = { value: string; label: string };

interface ComboboxProps {
    value?: string;
    onChange: (value: string) => void;
    options: (string | ComboboxOption)[];
    placeholder?: string;
}

export function Combobox({ value, onChange, options, placeholder }: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

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
    const filteredOptions = query === ""
        ? normalizedOptions
        : normalizedOptions.filter((opt) =>
            opt.label.toLowerCase().includes(query.toLowerCase())
        );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: ComboboxOption) => {
        onChange(option.value);
        setQuery(option.label);
        setIsOpen(false);
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
                        className="absolute z-50 w-full mt-1 bg-[#1a1f24] border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                    >
                        {filteredOptions.map((option) => {
                            const isSelected = value === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option)}
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
