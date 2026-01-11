import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/shell/sidebar";
import { cn } from "@/lib/utils";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
});

export const metadata: Metadata = {
    title: "EpicTours.ai | Business OS",
    description: "Antigravity Business Operating System",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={cn(outfit.variable, "bg-background min-h-screen flex antialiased overflow-hidden")}>
                {/* Global Sidebar (Registry Driven) */}
                <Sidebar />

                {/* Main Content Area */}
                <main className="flex-1 relative h-screen overflow-y-auto overflow-x-hidden p-4 lg:p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </body>
        </html>
    );
}
