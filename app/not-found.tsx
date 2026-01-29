import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="h-full flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                <AlertTriangle size={32} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Module Not Found</h2>
            <p className="text-zinc-400 max-w-sm text-center">
                The requested sector has not been initialized or is currently offline.
            </p>
            <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-zinc-300 transition-colors mt-4"
            >
                <ArrowLeft size={16} />
                Return to Command Center
            </Link>
        </div>
    );
}
