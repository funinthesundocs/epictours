"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

export default function DebugClicksPage() {
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
        console.log(msg);
    };

    return (
        <div className="p-10 bg-black min-h-screen text-white space-y-8 font-sans">
            <h1 className="text-2xl font-bold text-red-500">Click Debugger (Port 3001)</h1>

            <div className="grid grid-cols-2 gap-8">
                {/* 1. Native Button */}
                <div className="p-6 border border-white/20 rounded-xl">
                    <h2 className="mb-4 text-cyan-400 font-bold">1. Native HTML Button</h2>
                    <button
                        onClick={() => addLog("Native Button Clicked")}
                        style={{ padding: '10px 20px', background: 'gray', cursor: 'pointer' }}
                    >
                        Click Me
                    </button>
                </div>

                {/* 2. Tailwind Button */}
                <div className="p-6 border border-white/20 rounded-xl">
                    <h2 className="mb-4 text-cyan-400 font-bold">2. Tailwind Button</h2>
                    <button
                        onClick={() => addLog("Tailwind Button Clicked")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors"
                    >
                        Click Me
                    </button>
                </div>

                {/* 3. Icon Button (Replica) */}
                <div className="p-6 border border-white/20 rounded-xl">
                    <h2 className="mb-4 text-cyan-400 font-bold">3. Icon Button (Replica)</h2>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            addLog("Icon Trash Clicked");
                            alert("Click Successful!");
                        }}
                        className="p-1.5 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors z-10 relative border border-red-500/50"
                    >
                        <Trash2 size={24} />
                    </button>
                </div>

                {/* 4. Glass Environment Replica */}
                <div className="p-6 border border-white/20 rounded-xl relative group">
                    <h2 className="mb-4 text-cyan-400 font-bold">4. Glass Environment (Table Row Replica)</h2>
                    <div className="bg-[#0b1115] border border-white/10 rounded-xl overflow-hidden p-4 relative">
                        <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" /> {/* Simulate overlay */}
                        <div className="flex items-center justify-between relative z-10">
                            <span>Test Row Item</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => addLog("Glass Context Delete Clicked")}
                                    className="p-1.5 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 cursor-pointer"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-zinc-900 rounded-xl font-mono text-xs h-64 overflow-y-auto border border-white/10">
                <h3 className="text-zinc-500 mb-2">Event Log:</h3>
                {log.map((l, i) => (
                    <div key={i} className="text-emerald-400">{l}</div>
                ))}
            </div>
        </div>
    );
}
