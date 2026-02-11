"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { authApi } from "@/lib/api";

export default function HomePage() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 已登录则跳转到仪表盘
  if (!isLoading && user) {
    router.replace("/dashboard");
    return null;
  }

  if (isLoading) {
    return <div style={styles.center}>加载中...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const api = isRegister ? authApi.register : authApi.login;
      const res = await api(username, password);

      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        router.push("/dashboard");
      } else {
        setError(res.error || "操作失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🐕 旺财厨房</h1>
        <p style={styles.subtitle}>计算型厨房管理与社交组局工具</p>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isRegister ? {} : styles.activeTab) }}
            onClick={() => { setIsRegister(false); setError(""); }}
          >
            登录
          </button>
          <button
            style={{ ...styles.tab, ...(isRegister ? styles.activeTab : {}) }}
            onClick={() => { setIsRegister(true); setError(""); }}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
            minLength={2}
            maxLength={20}
          />
          <input
            type="password"
            placeholder="密码（至少6位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
            minLength={6}
          />
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "处理中..." : isRegister ? "注册" : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
  },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
    fontSize: 18,
    color: "#888",
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "40px 36px",
    boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
    width: 380,
  },
  title: { fontSize: 28, textAlign: "center", margin: 0 },
  subtitle: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    margin: "8px 0 24px",
  },
  tabs: {
    display: "flex",
    gap: 0,
    marginBottom: 20,
    borderBottom: "2px solid #eee",
  },
  tab: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 15,
    color: "#888",
    borderBottom: "2px solid transparent",
    marginBottom: -2,
  },
  activeTab: {
    color: "#1a1a2e",
    fontWeight: 600,
    borderBottom: "2px solid #1a1a2e",
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  input: {
    padding: "10px 14px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 15,
    outline: "none",
  },
  error: {
    color: "#e74c3c",
    fontSize: 14,
    textAlign: "center",
  },
  submitBtn: {
    padding: "12px",
    border: "none",
    borderRadius: 8,
    backgroundColor: "#1a1a2e",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
    fontWeight: 600,
  },
};
