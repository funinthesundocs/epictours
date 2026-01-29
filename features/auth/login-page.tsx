"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "./auth-context";
import { Lock, User, AlertCircle, Zap, Eye, EyeOff } from "lucide-react";

export function LoginPage() {
    const { login, devLogin } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const isDev = process.env.NODE_ENV === "development";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        // Simulate slight delay for UX
        await new Promise((resolve) => setTimeout(resolve, 500));

        const success = login(username, password);
        if (!success) {
            setError("Invalid username or password");
        }
        setIsLoading(false);
    };

    const handleDevLogin = () => {
        devLogin();
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-zinc-950 to-purple-950/20" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-md"
            >
                {/* Logo/Branding */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Epic<span className="text-cyan-400">.ai</span>
                    </h1>
                    <p className="text-xs text-zinc-500 uppercase tracking-[0.2em] mt-1">Business OS</p>
                </div>

                {/* Login Card */}
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username Field */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Username / Email
                            </label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-zinc-950/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/20 transition-all"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-zinc-950/50 border border-white/10 rounded-lg pl-10 pr-12 py-3 text-white placeholder:text-zinc-600 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/20 transition-all"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-400 hover:to-cyan-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-cyan-400/20 hover:shadow-cyan-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Dev Login Button - Only visible in development */}
                    {isDev && (
                        <div className="mt-6 pt-6 border-t border-dashed border-yellow-500/30">
                            <div className="text-center mb-3">
                                <span className="inline-flex items-center gap-1.5 text-yellow-500 text-xs font-bold uppercase tracking-wider">
                                    <Zap size={12} />
                                    Development Mode
                                </span>
                            </div>
                            <button
                                onClick={handleDevLogin}
                                className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:text-yellow-300 font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                            >
                                [DEV] Auto-Login as Admin
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-zinc-600 text-sm mt-6">
                    © 2024 EpicTours.ai. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
