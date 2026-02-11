"use client";

import { AuthProvider } from "@/components/AuthContext";
import Navbar from "@/components/Navbar";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <Navbar />
            <main style={{ maxWidth: 1100, margin: "0 auto", padding: "20px" }}>
                {children}
            </main>
        </AuthProvider>
    );
}
