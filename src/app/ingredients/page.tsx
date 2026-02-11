"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { ingredientApi, Ingredient } from "@/lib/api";

export default function IngredientsPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: "", unitPrice: "", spec: "" });
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isLoading && !user) { router.replace("/"); return; }
        if (user) loadData();
    }, [user, isLoading, router]);

    const loadData = async () => {
        const res = await ingredientApi.list();
        if (res.success && res.data) setIngredients(res.data);
    };

    const resetForm = () => {
        setForm({ name: "", unitPrice: "", spec: "" });
        setEditId(null);
        setShowForm(false);
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const data = { name: form.name, unitPrice: parseFloat(form.unitPrice), spec: form.spec };

        let res;
        if (editId) {
            res = await ingredientApi.update(editId, data);
        } else {
            res = await ingredientApi.create(data);
        }

        if (res.success) {
            resetForm();
            loadData();
        } else {
            setError(res.error || "操作失败");
        }
    };

    const handleEdit = (ing: Ingredient) => {
        setForm({ name: ing.name, unitPrice: String(ing.unitPrice), spec: ing.spec });
        setEditId(ing.id);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("确认删除？")) return;
        const res = await ingredientApi.delete(id);
        if (res.success) {
            loadData();
        } else {
            alert(res.error || "删除失败");
        }
    };

    if (isLoading || !user) return null;

    return (
        <div>
            <div style={styles.header}>
                <h1>🥬 食材管理</h1>
                <button style={styles.addBtn} onClick={() => { resetForm(); setShowForm(true); }}>
                    ➕ 添加食材
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={styles.form}>
                    <h3>{editId ? "编辑食材" : "添加食材"}</h3>
                    <div style={styles.formRow}>
                        <input
                            placeholder="名称（如：猪肉）"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            style={styles.input}
                            required
                        />
                        <input
                            placeholder="单价（元）"
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.unitPrice}
                            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                            style={styles.input}
                            required
                        />
                        <input
                            placeholder="规格（如：500g/包）"
                            value={form.spec}
                            onChange={(e) => setForm({ ...form, spec: e.target.value })}
                            style={styles.input}
                            required
                        />
                    </div>
                    {error && <div style={styles.error}>{error}</div>}
                    <div style={styles.formActions}>
                        <button type="submit" style={styles.submitBtn}>
                            {editId ? "保存" : "添加"}
                        </button>
                        <button type="button" style={styles.cancelBtn} onClick={resetForm}>
                            取消
                        </button>
                    </div>
                </form>
            )}

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>名称</th>
                        <th style={styles.th}>单价</th>
                        <th style={styles.th}>规格</th>
                        <th style={styles.th}>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {ingredients.length === 0 ? (
                        <tr>
                            <td colSpan={4} style={styles.empty}>
                                暂无食材，点击"添加食材"开始录入
                            </td>
                        </tr>
                    ) : (
                        ingredients.map((ing) => (
                            <tr key={ing.id} style={styles.tr}>
                                <td style={styles.td}>{ing.name}</td>
                                <td style={styles.td}>¥{ing.unitPrice.toFixed(2)}</td>
                                <td style={styles.td}>{ing.spec}</td>
                                <td style={styles.td}>
                                    <button style={styles.editBtn} onClick={() => handleEdit(ing)}>
                                        编辑
                                    </button>
                                    <button style={styles.deleteBtn} onClick={() => handleDelete(ing.id)}>
                                        删除
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    addBtn: {
        padding: "8px 18px", border: "none", borderRadius: 8,
        backgroundColor: "#27ae60", color: "#fff", cursor: "pointer", fontSize: 14,
    },
    form: {
        background: "#fff", borderRadius: 10, padding: 20,
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 20,
    },
    formRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 },
    input: {
        flex: 1, minWidth: 150, padding: "8px 12px", border: "1px solid #ddd",
        borderRadius: 6, fontSize: 14,
    },
    error: { color: "#e74c3c", fontSize: 14, marginTop: 8 },
    formActions: { display: "flex", gap: 8, marginTop: 12 },
    submitBtn: {
        padding: "8px 20px", border: "none", borderRadius: 6,
        backgroundColor: "#1a1a2e", color: "#fff", cursor: "pointer",
    },
    cancelBtn: {
        padding: "8px 20px", border: "1px solid #ddd", borderRadius: 6,
        background: "#fff", cursor: "pointer",
    },
    table: {
        width: "100%", borderCollapse: "collapse", background: "#fff",
        borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
    },
    th: {
        textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #eee",
        fontSize: 13, color: "#888", fontWeight: 600,
    },
    tr: { borderBottom: "1px solid #f0f0f0" },
    td: { padding: "12px 16px", fontSize: 14 },
    empty: { padding: 40, textAlign: "center", color: "#aaa" },
    editBtn: {
        padding: "4px 12px", border: "1px solid #3498db", borderRadius: 4,
        background: "transparent", color: "#3498db", cursor: "pointer", marginRight: 6,
    },
    deleteBtn: {
        padding: "4px 12px", border: "1px solid #e74c3c", borderRadius: 4,
        background: "transparent", color: "#e74c3c", cursor: "pointer",
    },
};
