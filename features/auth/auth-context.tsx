"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

// Hardcoded superadmin accounts (will be replaced with proper user management later)
const SUPERADMIN_ACCOUNTS = [
    { username: "funinthesundocs", password: "epictours123!", name: "Admin" },
    { username: "denis@crodesign.com", password: "epictours123!", name: "Denis" },
];

interface User {
    username: string;
    name: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (username: string, password: string) => boolean;
    logout: () => void;
    devLogin: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem("epictours_user");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                setIsAuthenticated(true);
            } catch {
                localStorage.removeItem("epictours_user");
            }
        }
        setIsLoading(false);
    }, []);

    // Redirect logic
    useEffect(() => {
        if (isLoading) return;

        const isLoginPage = pathname === "/login";

        if (!isAuthenticated && !isLoginPage) {
            router.push("/login");
        } else if (isAuthenticated && isLoginPage) {
            router.push("/");
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    const login = (username: string, password: string): boolean => {
        const account = SUPERADMIN_ACCOUNTS.find(
            (acc) => acc.username.toLowerCase() === username.toLowerCase() && acc.password === password
        );

        if (account) {
            const userData = { username: account.username, name: account.name };
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem("epictours_user", JSON.stringify(userData));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("epictours_user");
        router.push("/login");
    };

    const devLogin = () => {
        // Auto-login as first admin in dev mode
        const devAccount = SUPERADMIN_ACCOUNTS[0];
        const userData = { username: devAccount.username, name: "Dev Admin" };
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("epictours_user", JSON.stringify(userData));
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, devLogin, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
