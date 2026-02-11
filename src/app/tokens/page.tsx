"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { tokenApi } from "@/lib/api";

export default function TokensPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [tokenInput, setTokenInput] = useState("");
    const [decoding, setDecoding] = useState(false);
    const [result, setResult] = useState<{
        ingredientsCreated: number;
        ingredientsReused: number;
        dishesCreated: number;
        menuCreated: boolean;
        menuName: string;
    } | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isLoading && !user) { router.replace("/"); }
    }, [user, isLoading, router]);

    const handleDecode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setResult(null);
        setDecoding(true);

        try {
            const res = await tokenApi.decode(tokenInput.trim());
            if (res.success && res.data) {
                setResult(res.data);
                setTokenInput("");
            } else {
                setError(res.error || "解码失败");
            }
        } catch {
            setError("网络错误，请稍后重试");
        } finally {
            setDecoding(false);
        }
    };

    if (isLoading || !user) return null;

    return (
        <div>
            <h1>🔐 密语系统</h1>
            <p style={styles.desc}>
                密语是旺财厨房的数据分享功能。你可以在菜单页生成密语，也可以在此导入他人分享的密语。
            </p>

            <div style={styles.card}>
                <h3>📥 导入密语</h3>
                <form onSubmit={handleDecode}>
                    <textarea
                        placeholder="粘贴密语内容（以 WK: 开头）"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        style={styles.textarea}
                        required
                    />
                    {error && <div style={styles.error}>{error}</div>}
                    <button type="submit" style={styles.submitBtn} disabled={decoding}>
                        {decoding ? "解码中..." : "🔓 解码并导入"}
                    </button>
                </form>
            </div>

            {result && (
                <div style={styles.resultCard}>
                    <h3>✅ 导入成功！</h3>
                    <div style={styles.resultGrid}>
                        <div style={styles.resultItem}>
                            <div style={styles.resultNum}>{result.dishesCreated}</div>
                            <div style={styles.resultLabel}>新建菜品</div>
                        </div>
                        <div style={styles.resultItem}>
                            <div style={styles.resultNum}>{result.ingredientsCreated}</div>
                            <div style={styles.resultLabel}>新建食材</div>
                        </div>
                        <div style={styles.resultItem}>
                            <div style={styles.resultNum}>{result.ingredientsReused}</div>
                            <div style={styles.resultLabel}>复用食材</div>
                        </div>
                        {result.menuCreated && (
                            <div style={styles.resultItem}>
                                <div style={styles.resultNum}>1</div>
                                <div style={styles.resultLabel}>新建菜单: {result.menuName}</div>
                            </div>
                        )}
                    </div>
                    <div style={styles.resultActions}>
                        <button style={styles.viewBtn} onClick={() => router.push("/dishes")}>
                            查看菜品 →
                        </button>
                        {result.menuCreated && (
                            <button style={styles.viewBtn} onClick={() => router.push("/menus")}>
                                查看菜单 →
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div style={styles.card}>
                <h3>📤 生成密语</h3>
                <p style={styles.tipText}>
                    前往 <a href="/dishes" style={styles.link}>菜品管理</a> 或{" "}
                    <a href="/menus" style={styles.link}>菜单管理</a> 页面，点击"生成密语"按钮。
                </p>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    desc: { color: "#666", fontSize: 15, marginBottom: 24 },
    card: {
        background: "#fff", borderRadius: 10, padding: 24,
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 20,
    },
    textarea: {
        width: "100%", minHeight: 100, padding: 12, border: "1px solid #ddd",
        borderRadius: 8, fontSize: 13, fontFamily: "monospace", resize: "vertical",
        marginTop: 8,
    },
    error: { color: "#e74c3c", fontSize: 14, marginTop: 8 },
    submitBtn: {
        marginTop: 12, padding: "10px 24px", border: "none", borderRadius: 8,
        backgroundColor: "#1a1a2e", color: "#fff", cursor: "pointer", fontSize: 15,
    },
    resultCard: {
        background: "#f0fdf4", borderRadius: 10, padding: 24,
        border: "1px solid #bbf7d0", marginBottom: 20,
    },
    resultGrid: {
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 12, marginTop: 16,
    },
    resultItem: {
        background: "#fff", borderRadius: 8, padding: 16, textAlign: "center",
    },
    resultNum: { fontSize: 28, fontWeight: 700, color: "#27ae60" },
    resultLabel: { fontSize: 13, color: "#666", marginTop: 4 },
    resultActions: { display: "flex", gap: 10, marginTop: 16 },
    viewBtn: {
        padding: "8px 16px", border: "1px solid #27ae60", borderRadius: 6,
        background: "transparent", color: "#27ae60", cursor: "pointer", fontSize: 14,
    },
    tipText: { color: "#666", fontSize: 14 },
    link: { color: "#3498db" },
};
