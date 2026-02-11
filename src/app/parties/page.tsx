"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { partyApi, dishApi, Party, Dish, PartyDetail } from "@/lib/api";

export default function PartiesPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [parties, setParties] = useState<Party[]>([]);
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [partyName, setPartyName] = useState("");
    const [selectedDishIds, setSelectedDishIds] = useState<number[]>([]);
    const [error, setError] = useState("");
    const [viewParty, setViewParty] = useState<PartyDetail | null>(null);
    const [addDishId, setAddDishId] = useState(0);

    useEffect(() => {
        if (!isLoading && !user) { router.replace("/"); return; }
        if (user) loadData();
    }, [user, isLoading, router]);

    const loadData = async () => {
        const [p, d] = await Promise.all([partyApi.list(), dishApi.list()]);
        if (p.success && p.data) setParties(p.data);
        if (d.success && d.data) setDishes(d.data);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const res = await partyApi.create({ name: partyName, dishIds: selectedDishIds });
        if (res.success) {
            setShowForm(false);
            setPartyName("");
            setSelectedDishIds([]);
            loadData();
        } else {
            setError(res.error || "创建失败");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("确认删除饭局？")) return;
        const res = await partyApi.delete(id);
        if (res.success) loadData();
        else alert(res.error || "删除失败");
    };

    const handleViewParty = async (id: number) => {
        const res = await partyApi.get(id);
        if (res.success && res.data) setViewParty(res.data);
    };

    const handleLock = async (id: number, action: "lock" | "unlock") => {
        const res = await partyApi.lock(id, action);
        if (res.success) handleViewParty(id);
        else alert(res.error || "操作失败");
    };

    const handleAddDish = async (partyId: number) => {
        if (!addDishId) return;
        const res = await partyApi.addDish(partyId, { dishId: addDishId });
        if (res.success) {
            setAddDishId(0);
            handleViewParty(partyId);
        } else {
            alert(res.error || "添加失败");
        }
    };

    const handleRemoveDish = async (partyId: number, partyDishId: number) => {
        const res = await partyApi.removeDish(partyId, partyDishId);
        if (res.success) handleViewParty(partyId);
        else alert(res.error || "移除失败");
    };

    const handleExport = async (partyId: number) => {
        const res = await partyApi.export(partyId);
        if (res.success && res.data) {
            // 显示导出结果
            const data = res.data;
            let text = `🎉 ${data.partyName}\n`;
            text += `主持人: ${data.hostName}\n`;
            text += `宾客: ${data.guests.join(", ") || "暂无"}\n\n`;
            text += `📋 菜品列表:\n`;
            data.dishes.forEach((d) => {
                text += `  - ${d.name} (¥${d.cost.toFixed(2)}, ${d.addedBy})\n`;
            });
            text += `\n🛒 采购清单:\n`;
            data.shoppingList.items.forEach((item) => {
                text += `  - ${item.name}: ${item.totalQuantity}${item.unit} ¥${item.totalCost.toFixed(2)}\n`;
            });
            text += `\n💰 总计: ¥${data.shoppingList.totalCost.toFixed(2)}`;

            navigator.clipboard.writeText(text);
            alert("采购清单已复制到剪贴板！");
        }
    };

    const toggleDish = (dishId: number) => {
        setSelectedDishIds((prev) =>
            prev.includes(dishId) ? prev.filter((id) => id !== dishId) : [...prev, dishId]
        );
    };

    if (isLoading || !user) return null;

    return (
        <div>
            <div style={styles.header}>
                <h1>🎉 饭局管理</h1>
                <button style={styles.addBtn} onClick={() => setShowForm(true)}>
                    🎉 发起饭局
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} style={styles.form}>
                    <h3>发起新饭局</h3>
                    <input
                        placeholder="饭局名称"
                        value={partyName}
                        onChange={(e) => setPartyName(e.target.value)}
                        style={{ ...styles.input, width: "100%", marginBottom: 12 }}
                        required
                    />
                    <div style={styles.sectionTitle}>预选菜品（可选）</div>
                    <div style={styles.dishCheckboxes}>
                        {dishes.map((d) => (
                            <label key={d.id} style={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={selectedDishIds.includes(d.id)}
                                    onChange={() => toggleDish(d.id)}
                                />
                                {d.name}
                            </label>
                        ))}
                    </div>
                    {error && <div style={styles.error}>{error}</div>}
                    <div style={styles.formActions}>
                        <button type="submit" style={styles.submitBtn}>创建</button>
                        <button type="button" style={styles.cancelBtn} onClick={() => setShowForm(false)}>
                            取消
                        </button>
                    </div>
                </form>
            )}

            {/* 饭局详情弹窗 */}
            {viewParty && (
                <div style={styles.modal} onClick={() => setViewParty(null)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2>{viewParty.name}</h2>
                            <button style={styles.closeBtn} onClick={() => setViewParty(null)}>✕</button>
                        </div>

                        <div style={styles.infoRow}>
                            <span>状态: {viewParty.status === "LOCKED" ? "🔒 已锁定" : "🟢 进行中"}</span>
                            <span>分享码: <strong>{viewParty.shareCode}</strong></span>
                            <span>总费用: <strong style={{ color: "#e67e22" }}>¥{viewParty.totalCost.toFixed(2)}</strong></span>
                        </div>

                        <div style={styles.actionBar}>
                            {viewParty.status === "ACTIVE" ? (
                                <button style={styles.lockBtn} onClick={() => handleLock(viewParty.id, "lock")}>
                                    🔒 锁定
                                </button>
                            ) : (
                                <button style={styles.unlockBtn} onClick={() => handleLock(viewParty.id, "unlock")}>
                                    🔓 解锁
                                </button>
                            )}
                            <button style={styles.exportBtn} onClick={() => handleExport(viewParty.id)}>
                                📋 导出清单
                            </button>
                        </div>

                        {/* 宾客 */}
                        <h4>👥 宾客 ({viewParty.guests.length})</h4>
                        <div style={styles.guestList}>
                            {viewParty.guests.map((g) => (
                                <span key={g.id} style={styles.guestTag}>{g.nickname}</span>
                            ))}
                            {viewParty.guests.length === 0 && <span style={{ color: "#aaa" }}>暂无宾客</span>}
                        </div>

                        {/* 菜品 */}
                        <h4>🍽️ 菜品 ({viewParty.dishes.length})</h4>
                        {viewParty.status === "ACTIVE" && (
                            <div style={styles.addDishRow}>
                                <select
                                    value={addDishId}
                                    onChange={(e) => setAddDishId(Number(e.target.value))}
                                    style={styles.select}
                                >
                                    <option value={0}>选择菜品加入…</option>
                                    {dishes.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                <button style={styles.miniAddBtn} onClick={() => handleAddDish(viewParty.id)}>
                                    添加
                                </button>
                            </div>
                        )}
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>菜名</th>
                                    <th style={styles.th}>费用</th>
                                    <th style={styles.th}>添加者</th>
                                    <th style={styles.th}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewParty.dishes.map((pd) => (
                                    <tr key={pd.id}>
                                        <td style={styles.td}>{pd.dishName}</td>
                                        <td style={styles.td}>¥{pd.costSnapshot.toFixed(2)}</td>
                                        <td style={styles.td}>{pd.addedByGuest?.nickname || "主持人"}</td>
                                        <td style={styles.td}>
                                            {viewParty.status === "ACTIVE" && (
                                                <button
                                                    style={styles.removeBtn}
                                                    onClick={() => handleRemoveDish(viewParty.id, pd.id)}
                                                >
                                                    移除
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 饭局列表 */}
            <div style={styles.partyGrid}>
                {parties.length === 0 ? (
                    <div style={styles.empty}>暂无饭局</div>
                ) : (
                    parties.map((party) => (
                        <div key={party.id} style={styles.partyCard}>
                            <div style={styles.partyHeader}>
                                <h3 style={{ margin: 0 }}>{party.name}</h3>
                                <span style={{
                                    ...styles.statusBadge,
                                    background: party.status === "LOCKED" ? "#fee2e2" : "#dcfce7",
                                    color: party.status === "LOCKED" ? "#dc2626" : "#16a34a",
                                }}>
                                    {party.status === "LOCKED" ? "🔒 已锁定" : "🟢 进行中"}
                                </span>
                            </div>
                            <div style={styles.partyInfo}>
                                <span>分享码: <strong>{party.shareCode}</strong></span>
                                <span>菜品: {party._count?.dishes || party.dishes.length}</span>
                                <span>宾客: {party._count?.guests || party.guests.length}</span>
                            </div>
                            <div style={styles.cardActions}>
                                <button style={styles.viewBtn} onClick={() => handleViewParty(party.id)}>
                                    查看详情
                                </button>
                                <button style={styles.deleteBtn} onClick={() => handleDelete(party.id)}>
                                    删除
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    addBtn: {
        padding: "8px 18px", border: "none", borderRadius: 8,
        backgroundColor: "#8e44ad", color: "#fff", cursor: "pointer", fontSize: 14,
    },
    form: {
        background: "#fff", borderRadius: 10, padding: 20,
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 20,
    },
    input: { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14 },
    sectionTitle: { fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#555" },
    dishCheckboxes: { display: "flex", flexWrap: "wrap", gap: 12 },
    checkbox: { display: "flex", alignItems: "center", gap: 4, fontSize: 14, cursor: "pointer" },
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
    partyGrid: {
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 16, marginTop: 10,
    },
    partyCard: {
        background: "#fff", borderRadius: 10, padding: 20,
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
    },
    partyHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    statusBadge: {
        padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
    },
    partyInfo: {
        display: "flex", gap: 16, marginTop: 12, fontSize: 14, color: "#666",
    },
    cardActions: { display: "flex", gap: 6, marginTop: 12 },
    viewBtn: {
        padding: "6px 14px", border: "1px solid #8e44ad", borderRadius: 4,
        background: "transparent", color: "#8e44ad", cursor: "pointer", fontSize: 13,
    },
    deleteBtn: {
        padding: "6px 14px", border: "1px solid #e74c3c", borderRadius: 4,
        background: "transparent", color: "#e74c3c", cursor: "pointer", fontSize: 13,
    },
    empty: { padding: 40, textAlign: "center", color: "#aaa", gridColumn: "1 / -1" },
    modal: {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
        alignItems: "center", zIndex: 1000,
    },
    modalContent: {
        background: "#fff", borderRadius: 12, padding: 24, maxWidth: 750,
        width: "90%", maxHeight: "85vh", overflowY: "auto",
    },
    modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    closeBtn: {
        background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#888",
    },
    infoRow: {
        display: "flex", gap: 20, padding: "12px 0", fontSize: 14,
        borderBottom: "1px solid #eee", color: "#555",
    },
    actionBar: { display: "flex", gap: 8, marginTop: 12 },
    lockBtn: {
        padding: "6px 16px", border: "none", borderRadius: 6,
        backgroundColor: "#e74c3c", color: "#fff", cursor: "pointer", fontSize: 13,
    },
    unlockBtn: {
        padding: "6px 16px", border: "none", borderRadius: 6,
        backgroundColor: "#27ae60", color: "#fff", cursor: "pointer", fontSize: 13,
    },
    exportBtn: {
        padding: "6px 16px", border: "1px solid #3498db", borderRadius: 6,
        background: "transparent", color: "#3498db", cursor: "pointer", fontSize: 13,
    },
    guestList: { display: "flex", flexWrap: "wrap", gap: 6 },
    guestTag: {
        background: "#f3e8ff", padding: "4px 12px", borderRadius: 12, fontSize: 13, color: "#8e44ad",
    },
    addDishRow: { display: "flex", gap: 8, marginBottom: 12 },
    select: { flex: 1, padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14 },
    miniAddBtn: {
        padding: "6px 14px", border: "none", borderRadius: 6,
        backgroundColor: "#27ae60", color: "#fff", cursor: "pointer", fontSize: 13,
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
        textAlign: "left", padding: "8px 12px", borderBottom: "2px solid #eee",
        fontSize: 13, color: "#888",
    },
    td: { padding: "8px 12px", fontSize: 14, borderBottom: "1px solid #f0f0f0" },
    removeBtn: {
        padding: "3px 10px", border: "1px solid #e74c3c", borderRadius: 4,
        background: "transparent", color: "#e74c3c", cursor: "pointer", fontSize: 12,
    },
};
