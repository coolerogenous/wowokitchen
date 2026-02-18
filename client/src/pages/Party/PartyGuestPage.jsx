import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, ShoppingCart, X, Image as ImageIcon, Minus } from 'lucide-react';
import html2canvas from 'html2canvas';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function apiFetch(url, options = {}) {
    const res = await fetch(API_BASE + url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '请求失败');
    return data;
}

export default function PartyGuestPage() {
    const { code } = useParams();
    const [party, setParty] = useState(null);
    const [availableDishes, setAvailableDishes] = useState([]);
    const [error, setError] = useState('');
    const [nickname, setNickname] = useState('');
    const [joined, setJoined] = useState(false);
    const [guestToken, setGuestToken] = useState('');
    const [showList, setShowList] = useState(false);
    const [listData, setListData] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [toast, setToast] = useState('');
    const listRef = useRef(null);

    useEffect(() => {
        if (code) fetchParty();
        const savedToken = localStorage.getItem(`wk_guest_${code}`);
        const savedName = localStorage.getItem(`wk_guest_name_${code}`);
        if (savedToken) {
            setGuestToken(savedToken);
            setNickname(savedName || '游客');
            setJoined(true);
        }
    }, [code]);

    const showToastMsg = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

    const fetchParty = async () => {
        try {
            const data = await apiFetch(`/parties/join/${code}`);
            setParty(data.party);
            setAvailableDishes(data.availableDishes || []);
        } catch (err) { setError(err.message); }
    };

    const handleJoin = async () => {
        if (!nickname.trim()) { showToastMsg('请输入你的昵称'); return; }
        try {
            const data = await apiFetch(`/parties/join/${code}/guest`, {
                method: 'POST', body: JSON.stringify({ nickname: nickname.trim() }),
            });
            setGuestToken(data.guest_token);
            setJoined(true);
            localStorage.setItem(`wk_guest_${code}`, data.guest_token);
            localStorage.setItem(`wk_guest_name_${code}`, nickname.trim());
            showToastMsg('加入成功 🎉');
            fetchParty();
        } catch (err) { showToastMsg(err.message); }
    };

    // 点菜（同一道菜后端会自动累加份数）
    const handleAddDish = async (dishId, dishName) => {
        try {
            await apiFetch(`/parties/join/${code}/add-dish`, {
                method: 'POST',
                body: JSON.stringify({ dish_id: dishId, added_by: nickname || '游客', servings: 1 }),
            });
            showToastMsg(`${dishName} +1`);
            fetchParty();
        } catch (err) { showToastMsg(err.message); }
    };

    // 删除菜品
    const handleRemoveDish = async (partyDishId) => {
        try {
            await apiFetch(`/parties/join/${code}/dish/${partyDishId}`, { method: 'DELETE' });
            showToastMsg('已移除');
            fetchParty();
        } catch (err) { showToastMsg(err.message); }
    };

    // 修改份数
    const handleChangeServings = async (partyDishId, newServings) => {
        if (newServings < 1) {
            handleRemoveDish(partyDishId);
            return;
        }
        try {
            await apiFetch(`/parties/join/${code}/dish/${partyDishId}/servings`, {
                method: 'PUT',
                body: JSON.stringify({ servings: newServings }),
            });
            fetchParty();
        } catch (err) { showToastMsg(err.message); }
    };

    const viewShoppingList = async () => {
        try {
            const data = await apiFetch(`/parties/join/${code}/shopping-list`);
            setListData(data); setShowList(true);
        } catch (err) { showToastMsg('获取清单失败'); }
    };

    const exportImage = async () => {
        if (!listRef.current || exporting) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(listRef.current, { backgroundColor: '#fff', scale: 2 });
            const link = document.createElement('a');
            link.download = `${party?.name || '饭局'}_采购清单.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToastMsg('图片已保存 📷');
        } catch { showToastMsg('导出失败'); }
        setExporting(false);
    };

    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)', padding: 24 }}>
                <div style={{ background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', maxWidth: 360, width: '100%', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>😢</div>
                    <h2 style={{ color: '#333', marginBottom: 8 }}>饭局不存在</h2>
                    <p style={{ color: '#888' }}>{error}</p>
                </div>
            </div>
        );
    }

    if (!party) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)' }}>
                <div style={{ color: 'var(--color-primary)', fontSize: 18, fontWeight: 600 }}>🐶 努力加载中...</div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)' }}>
            {/* 顶部 Banner */}
            <div style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #FFB74D 100%)',
                padding: '36px 20px 60px', color: '#5D4037', textAlign: 'center',
                borderRadius: '0 0 30px 30px', boxShadow: '0 4px 20px rgba(255, 167, 38, 0.3)'
            }}>
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4, fontWeight: 600 }}>🍻 你被邀请加入</div>
                <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, textShadow: '0 1px 2px rgba(255,255,255,0.4)' }}>{party.name}</h1>
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 500, background: 'rgba(255,255,255,0.3)', display: 'inline-block', padding: '4px 12px', borderRadius: 20 }}>
                    {party.status === 'locked' ? '🔒 已锁定' : '🟢 点菜进行中'}
                    {' · '}{(party.guests || []).length} 人参与
                </div>
            </div>

            <div style={{ maxWidth: 500, margin: '-40px auto 0', padding: '0 16px 40px', position: 'relative', zIndex: 1 }}>

                {/* 加入区 */}
                {!joined && party.status === 'active' && (
                    <div className="animate-card-enter" style={{ background: '#fff', borderRadius: 20, padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-card)' }}>
                        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 18, textAlign: 'center' }}>输入昵称加入饭局</div>
                        <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="怎么称呼你？"
                            style={{
                                width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #eee',
                                fontSize: 16, marginBottom: 16, boxSizing: 'border-box', outline: 'none',
                                transition: 'border-color 0.2s', backgroundColor: '#fafafa'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = '#eee'}
                        />
                        <button onClick={handleJoin} style={{
                            width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                            background: 'var(--color-primary)', color: '#5D4037', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(255, 213, 128, 0.4)'
                        }}>加入饭局</button>
                    </div>
                )}

                {/* 已点菜品列表（合并展示） */}
                <div className="animate-card-enter" style={{ animationDelay: '100ms', background: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #eee' }}>
                        <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🍽️</span> 已选菜品 ({(party.partyDishes || []).length})
                        </div>
                        <div style={{ fontWeight: 800, color: '#e74c3c', fontSize: 20 }}>¥{Number(party.total_budget || 0).toFixed(2)}</div>
                    </div>
                    {(party.partyDishes || []).length === 0 ? (
                        <div style={{ padding: '30px 0', textAlign: 'center', color: '#aaa', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>🥘</div>
                            <div>还没有人点菜</div>
                        </div>
                    ) : (
                        (party.partyDishes || []).map(pd => (
                            <div key={pd.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 0', borderBottom: '1px solid #f9f9f9'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#333', marginBottom: 2 }}>{pd.dish?.name}</div>
                                    <div style={{ fontSize: 12, color: '#999', background: '#f0f0f0', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>by {pd.added_by}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {joined && party.status === 'active' ? (
                                        <>
                                            <button onClick={() => handleChangeServings(pd.id, pd.servings - 1)}
                                                style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: '#f0f0f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Minus size={16} color="#888" />
                                            </button>
                                            <span style={{ fontWeight: 700, fontSize: 16, minWidth: 24, textAlign: 'center' }}>{pd.servings}</span>
                                            <button onClick={() => handleChangeServings(pd.id, pd.servings + 1)}
                                                style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: '#FFF3E0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Plus size={16} color="#FF9800" />
                                            </button>
                                            <button onClick={() => handleRemoveDish(pd.id)}
                                                style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: '#FFF5F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
                                                <X size={16} color="#e74c3c" />
                                            </button>
                                        </>
                                    ) : (
                                        <span style={{ fontWeight: 700, fontSize: 16, color: '#555' }}>× {pd.servings}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* 点菜区（只显示可选范围内的菜品 + 需先加入） */}
                {joined && party.status === 'active' && availableDishes.length > 0 && (
                    <div className="animate-card-enter" style={{ animationDelay: '200ms', background: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-card)' }}>
                        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>➕ 点击加菜</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {availableDishes.map(d => (
                                <button key={d.id} onClick={() => handleAddDish(d.id, d.name)} style={{
                                    padding: '10px 16px', borderRadius: 30, border: '1px solid #eee',
                                    background: '#fff', cursor: 'pointer', fontSize: 14,
                                    display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
                                    color: '#555', boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                                }}>
                                    <Plus size={16} color="#FF9800" /> {d.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 查看采购清单 */}
                <button onClick={viewShoppingList} style={{
                    width: '100%', padding: '16px 0', borderRadius: 16, border: 'none',
                    background: '#fff', color: '#5D4037', fontSize: 16, fontWeight: 700,
                    cursor: 'pointer', boxShadow: 'var(--shadow-card)', marginBottom: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                    <ShoppingCart size={20} /> 查看采购清单
                </button>

                <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 20 }}>
                    旺财厨房 WoWoKitchen 🐶
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(50,50,50,0.9)', color: '#fff', padding: '12px 24px', borderRadius: 30,
                    fontSize: 14, zIndex: 9999, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', fontWeight: 600,
                    backdropFilter: 'blur(5px)'
                }}>{toast}</div>
            )}

            {/* 采购清单弹窗 */}
            {showList && listData && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(2px)'
                }} onClick={() => setShowList(false)}>
                    <div className="animate-slide-up" style={{
                        background: '#fff', borderRadius: '24px 24px 0 0', maxWidth: 500, width: '100%',
                        maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '20px 24px', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', zIndex: 1
                        }}>
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>📝 采购清单</h3>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <button onClick={exportImage} disabled={exporting} style={{
                                    padding: '8px 16px', borderRadius: 12, border: 'none',
                                    background: 'var(--color-primary)', color: '#5D4037', fontSize: 13, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700
                                }}><ImageIcon size={16} /> {exporting ? '...' : '存为图片'}</button>
                                <button onClick={() => setShowList(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                    <X size={24} color="#888" />
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: 24 }}>
                            <div ref={listRef} style={{ padding: 20, background: '#fff', borderRadius: 12 }}>
                                <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, marginBottom: 8, color: '#1a1a2e' }}>🛒 {listData.party_name}</div>
                                <div style={{ textAlign: 'center', fontSize: 13, marginBottom: 24, color: '#888', paddingBottom: 16, borderBottom: '2px dashed #eee' }}>采购清单 · {new Date().toLocaleDateString('zh-CN')}</div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f0f2f5', borderRadius: '10px 10px 0 0', fontWeight: 700, fontSize: 13, color: '#555' }}>
                                    <span style={{ flex: 1 }}>食材</span><span style={{ width: 80, textAlign: 'right' }}>数量</span><span style={{ width: 80, textAlign: 'right' }}>预估</span>
                                </div>
                                <div style={{ border: '1px solid #f0f2f5', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                                    {(listData.shopping_list?.ingredients || []).map((ing, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 12px', borderBottom: i === (listData.shopping_list?.ingredients || []).length - 1 ? 'none' : '1px solid #f9f9f9', fontSize: 14 }}>
                                            <span style={{ flex: 1, color: '#333', fontWeight: 600 }}>{ing.name}</span>
                                            <span style={{ width: 80, textAlign: 'right', color: '#666' }}>{ing.total_quantity}{ing.unit}</span>
                                            <span style={{ width: 80, textAlign: 'right', color: '#ff6b6b', fontWeight: 700 }}>¥{Number(ing.total_price).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', padding: '16px 0',
                                    borderTop: '2px solid #333', marginTop: 24,
                                    fontWeight: 800, fontSize: 18, color: '#333'
                                }}><span>总计预算</span><span>¥{Number(listData.shopping_list?.grand_total || 0).toFixed(2)}</span></div>

                                <div style={{ textAlign: 'center', marginTop: 30, fontSize: 12, color: '#bbb' }}>Create with 旺财厨房 WoWoKitchen 🐶</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
