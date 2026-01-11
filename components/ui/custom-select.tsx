"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CustomSelectProps {
    value?: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
}

export function CustomSelect({ value, onChange, options, placeholder = "Select..." }: CustomSelectProps) {
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

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-left flex items-center justify-between text-white focus:outline-none focus:border-cyan-500/50 transition-colors group"
            >
                <span className={value ? "text-white" : "text-zinc-500"}>
                    {value || placeholder}
                </span>
                <ChevronDown size={16} className={`text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu - White Background, Black Text */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden"
                    >
                        {options.map((option) => {
                            const isSelected = value === option;
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors
                            ${isSelected ? "bg-cyan-500 text-black font-medium" : "text-zinc-900 hover:bg-cyan-500 hover:text-black"}
                        `}
                                >
                                    <span>{option}</span>
                                    {/* Show Check if selected, usually we might hide it if we highlight the whole row, but let's keep it subtle or remove it if highlight is strong. 
                             If highlighting bg-cyan-500, check mark should be black. */}
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
