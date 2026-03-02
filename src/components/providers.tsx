"use client";

import { AuthProvider } from "@/lib/context/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { ContactButton } from "@/components/features/ContactButton";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
                {children}
                <ContactButton />
            </AuthProvider>
        </ThemeProvider>
    );
}
