import { useState, useEffect } from 'react';
import { Plus, Lock, Unlock, ShoppingCart, Copy, Users, X } from 'lucide-react';
import { partyAPI, dishAPI } from '../../services/api';
import { useToastStore } from '../../stores';

export default function PartyPage() {
    const [parties, setParties] = useState([]);
    const [allDishes, setAllDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [showList, setShowList] = useState(false);
    const [listData, setListData] = useState(null);
    const [form, setForm] = useState({ name: '' });
    const showToast = useToastStore((s) => s.showToast);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [pRes, dRes] = await Promise.all([partyAPI.getMyParties(), dishAPI.getAll()]);
            setParties(pRes.data.parties);
            setAllDishes(dRes.data.dishes);
        } catch (err) { showToast('获取数据失败', 'error'); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!form.name) { showToast('请输入饭局名称', 'error'); return; }
        try {
            const res = await partyAPI.create(form);
            showToast('饭局创建成功 🎉', 'success');
            setShowCreate(false); setForm({ name: '' }); fetchData();
        } catch (err) { showToast('创建失败', 'error'); }
    };

    const viewDetail = async (code) => {
        try {
            const res = await partyAPI.getByShareCode(code);
            setDetailData(res.data.party); setShowDetail(code);
        } catch (err) { showToast('获取详情失败', 'error'); }
    };

    const handleToggle = async (id) => {
        try {
            await partyAPI.toggleLock(id);
            showToast('状态已切换', 'success'); fetchData();
            if (showDetail) viewDetail(showDetail);
        } catch (err) { showToast('操作失败', 'error'); }
    };

    const handleAddDish = async (code, dishId, dishName) => {
        try {
            await partyAPI.addDish(code, { dish_id: dishId, added_by: '主人' });
            showToast(`已添加 ${dishName}`, 'success');
            viewDetail(code);
        } catch (err) { showToast(err.response?.data?.message || '添加失败', 'error'); }
    };

    const viewShoppingList = async (code) => {
        try {
            const res = await partyAPI.getShoppingList(code);
            setListData(res.data); setShowList(true);
        } catch (err) { showToast('生成清单失败', 'error'); }
    };

    const copyCode = (code) => {
        navigator.clipboard?.writeText(code);
        showToast(`分享码 ${code} 已复制`, 'success');
    };

    return (
        <>
            <header className="page-header">
                <h1>🍻 饭局</h1>
                <button className="page-header__action" onClick={() => setShowCreate(true)}>
                    <Plus size={24} />
                </button>
            </header>
            <div className="page-container">
                {loading ? (
                    <div className="card-list">{[1, 2].map(i => <div key={i} className="skeleton skeleton--card" />)}</div>
                ) : parties.length === 0 ? (
                    <div className="empty-state">
                        <Users className="empty-state__icon" size={80} />
                        <div className="empty-state__title">还没有饭局</div>
                        <div className="empty-state__text">点击右上角发起一个饭局吧</div>
                    </div>
                ) : (
                    <div className="card-list">
                        {parties.map((p, i) => (
                            <div key={p.id} className="card animate-card-enter" style={{ animationDelay: `${i * 60}ms` }}>
                                <div className="card__body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div className="card__title">{p.name}</div>
                                            <div className="card__meta">
                                                <span className={`card__badge ${p.status === 'active' ? 'card__badge--success' : 'card__badge--primary'}`}>
                                                    {p.status === 'active' ? '进行中' : '已锁定'}
                                                </span>
                                                <span className="text-sm text-secondary">{(p.guests || []).length} 人</span>
                                            </div>
                                        </div>
                                        <div className="card__price">¥{p.total_budget}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                                        <button className="btn btn--sm btn--secondary" onClick={() => viewDetail(p.share_code)}>查看</button>
                                        <button className="btn btn--sm btn--secondary" onClick={() => copyCode(p.share_code)}><Copy size={14} /> {p.share_code}</button>
                                        <button className="btn btn--sm btn--secondary" onClick={() => viewShoppingList(p.share_code)}><ShoppingCart size={14} /></button>
                                        <button className="btn btn--sm btn--secondary" onClick={() => handleToggle(p.id)}>
                                            {p.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 创建弹窗 */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div className="modal-header">
                            <h2>发起饭局</h2>
                            <button className="page-header__action" onClick={() => setShowCreate(false)}><X size={22} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">饭局名称</label>
                                <input className="form-input" placeholder="如：周五火锅局" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--primary btn--block" onClick={handleCreate}>创建饭局</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 详情弹窗 */}
            {showDetail && detailData && (
                <div className="modal-overlay" onClick={() => setShowDetail(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div className="modal-header">
                            <h2>{detailData.name}</h2>
                            <button className="page-header__action" onClick={() => setShowDetail(null)}><X size={22} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-label">已点菜品</div>
                            {(detailData.partyDishes || []).map((pd, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-xs) 0', borderBottom: '1px solid var(--border-light)' }}>
                                    <span>{pd.dish?.name} × {pd.servings}</span>
                                    <span className="text-sm text-secondary">by {pd.added_by}</span>
                                </div>
                            ))}
                            {detailData.status === 'active' && (
                                <div style={{ marginTop: 'var(--space-md)' }}>
                                    <div className="form-label">添加菜品</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
                                        {allDishes.map(d => (
                                            <button key={d.id} className="btn btn--sm btn--secondary" onClick={() => handleAddDish(showDetail, d.id, d.name)}>
                                                <Plus size={14} /> {d.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 采购清单弹窗 */}
            {showList && listData && (
                <div className="modal-overlay" onClick={() => setShowList(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div className="modal-header">
                            <h2>📝 {listData.party_name} 采购清单</h2>
                            <button className="page-header__action" onClick={() => setShowList(false)}><X size={22} /></button>
                        </div>
                        <div className="modal-body">
                            {listData.shopping_list.ingredients.map((ing, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-xs) 0', borderBottom: '1px solid var(--border-light)' }}>
                                    <span>{ing.name}</span>
                                    <span><b>{ing.total_quantity}{ing.unit}</b> <span style={{ color: 'var(--color-primary)', fontWeight: 600, marginLeft: 8 }}>¥{ing.total_price.toFixed(2)}</span></span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-md)', background: 'var(--color-primary-alpha)', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 'var(--font-size-lg)', marginTop: 'var(--space-md)' }}>
                                <span>总计</span>
                                <span style={{ color: 'var(--color-primary)' }}>¥{listData.shopping_list.grand_total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
