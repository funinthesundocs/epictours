import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { PageLayout } from "@/components/shell/page-layout";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/features/auth/auth-context";
import { ThemeProvider } from "@/components/theme-provider";

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
        <html lang="en" suppressHydrationWarning>
            <body className={cn(outfit.variable, "bg-background min-h-screen antialiased")} suppressHydrationWarning>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <AuthProvider>
                        {/* 
                            PageLayout handles the SidebarProvider, Sidebar, 
                            and the Main Content area with dynamic margins.
                        */}
                        <PageLayout>
                            {children}
                        </PageLayout>
                        <Toaster />
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
