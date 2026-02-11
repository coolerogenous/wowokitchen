"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { ingredientApi, dishApi, menuApi, partyApi } from "@/lib/api";

export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        ingredients: 0,
        dishes: 0,
        menus: 0,
        parties: 0,
    });

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/");
            return;
        }
        if (user) {
            loadStats();
        }
    }, [user, isLoading, router]);

    const loadStats = async () => {
        const [ing, dish, menu, party] = await Promise.all([
            ingredientApi.list(),
            dishApi.list(),
            menuApi.list(),
            partyApi.list(),
        ]);
        setStats({
            ingredients: ing.data?.length || 0,
            dishes: dish.data?.length || 0,
            menus: menu.data?.length || 0,
            parties: party.data?.length || 0,
        });
    };

    if (isLoading || !user) return null;

    const cards = [
        { label: "食材", count: stats.ingredients, emoji: "🥬", href: "/ingredients", color: "#27ae60" },
        { label: "菜品", count: stats.dishes, emoji: "🍳", href: "/dishes", color: "#e67e22" },
        { label: "菜单", count: stats.menus, emoji: "📋", href: "/menus", color: "#2980b9" },
        { label: "饭局", count: stats.parties, emoji: "🎉", href: "/parties", color: "#8e44ad" },
    ];

    return (
        <div>
            <h1>欢迎, {user.username} 👋</h1>
            <div style={styles.grid}>
                {cards.map((c) => (
                    <div
                        key={c.label}
                        style={{ ...styles.card, borderLeft: `4px solid ${c.color}` }}
                        onClick={() => router.push(c.href)}
                    >
                        <div style={styles.cardEmoji}>{c.emoji}</div>
                        <div style={styles.cardCount}>{c.count}</div>
                        <div style={styles.cardLabel}>{c.label}</div>
                    </div>
                ))}
            </div>

            <div style={styles.quickActions}>
                <h2>快捷操作</h2>
                <div style={styles.actionGrid}>
                    <button style={styles.actionBtn} onClick={() => router.push("/ingredients")}>
                        ➕ 添加食材
                    </button>
                    <button style={styles.actionBtn} onClick={() => router.push("/dishes")}>
                        ➕ 创建菜品
                    </button>
                    <button style={styles.actionBtn} onClick={() => router.push("/menus")}>
                        ➕ 创建菜单
                    </button>
                    <button style={styles.actionBtn} onClick={() => router.push("/parties")}>
                        🎉 发起饭局
                    </button>
                    <button style={styles.actionBtn} onClick={() => router.push("/tokens")}>
                        🔐 导入密语
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16,
        marginTop: 20,
    },
    card: {
        background: "#fff",
        borderRadius: 10,
        padding: "20px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        cursor: "pointer",
        transition: "transform 0.2s",
    },
    cardEmoji: { fontSize: 32 },
    cardCount: { fontSize: 36, fontWeight: 700, margin: "8px 0 4px" },
    cardLabel: { color: "#888", fontSize: 14 },
    quickActions: { marginTop: 40 },
    actionGrid: {
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 12,
    },
    actionBtn: {
        padding: "10px 20px",
        border: "1px solid #ddd",
        borderRadius: 8,
        background: "#fff",
        cursor: "pointer",
        fontSize: 14,
    },
};
