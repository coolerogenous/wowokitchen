"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

const navItems = [
    { href: "/dashboard", label: "📊 仪表盘" },
    { href: "/ingredients", label: "🥬 食材" },
    { href: "/dishes", label: "🍳 菜品" },
    { href: "/menus", label: "📋 菜单" },
    { href: "/tokens", label: "🔐 密语" },
    { href: "/parties", label: "🎉 饭局" },
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    return (
        <nav style={styles.nav}>
            <div style={styles.brand}>🐕 旺财厨房</div>
            <div style={styles.links}>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        style={{
                            ...styles.link,
                            ...(pathname.startsWith(item.href) ? styles.activeLink : {}),
                        }}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
            <div style={styles.userArea}>
                <span style={styles.username}>👤 {user.username}</span>
                <button onClick={logout} style={styles.logoutBtn}>
                    退出
                </button>
            </div>
        </nav>
    );
}

const styles: Record<string, React.CSSProperties> = {
    nav: {
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        height: 56,
        backgroundColor: "#1a1a2e",
        color: "#fff",
        gap: 20,
        position: "sticky",
        top: 0,
        zIndex: 100,
    },
    brand: {
        fontSize: 18,
        fontWeight: 700,
        marginRight: 10,
        whiteSpace: "nowrap",
    },
    links: {
        display: "flex",
        gap: 4,
        flex: 1,
        overflowX: "auto",
    },
    link: {
        color: "#aaa",
        textDecoration: "none",
        padding: "6px 12px",
        borderRadius: 6,
        fontSize: 14,
        whiteSpace: "nowrap",
        transition: "all 0.2s",
    },
    activeLink: {
        color: "#fff",
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    userArea: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginLeft: "auto",
        whiteSpace: "nowrap",
    },
    username: { fontSize: 14, color: "#ccc" },
    logoutBtn: {
        background: "transparent",
        border: "1px solid #555",
        color: "#ccc",
        padding: "4px 12px",
        borderRadius: 4,
        cursor: "pointer",
        fontSize: 13,
    },
};
