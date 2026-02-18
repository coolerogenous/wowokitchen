import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, BookOpen, ShoppingCart, Share2, X, Download } from 'lucide-react';
import { menuAPI, dishAPI, tokenAPI } from '../../services/api';
import { useToastStore } from '../../stores';

export default function MenusPage() {
    const [menus, setMenus] = useState([]);
    const [allDishes, setAllDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showListModal, setShowListModal] = useState(false);
    const [shoppingList, setShoppingList] = useState(null);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', dishes: [] });
    const showToast = useToastStore((s) => s.showToast);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [menuRes, dishRes] = await Promise.all([menuAPI.getAll(), dishAPI.getAll()]);
            setMenus(menuRes.data.menus);
            setAllDishes(dishRes.data.dishes);
        } catch (err) {
            showToast('获取数据失败', 'error');
        } finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', description: '', dishes: [] });
        setShowModal(true);
    };

    const openEdit = (menu) => {
        setEditing(menu);
        setForm({
            name: menu.name,
            description: menu.description || '',
            dishes: (menu.menuDishes || []).map((md) => ({
                dish_id: md.dish_id,
                servings: md.servings,
                name: md.dish?.name || '',
            })),
        });
        setShowModal(true);
    };

    const addDishToForm = (dish) => {
        if (form.dishes.find((d) => d.dish_id === dish.id)) return;
        setForm({
            ...form,
            dishes: [...form.dishes, { dish_id: dish.id, name: dish.name, servings: 1 }],
        });
    };

    const updateServings = (idx, servings) => {
        const updated = [...form.dishes];
        updated[idx].servings = parseInt(servings) || 1;
        setForm({ ...form, dishes: updated });
    };

    const removeDishFromForm = (idx) => {
        setForm({ ...form, dishes: form.dishes.filter((_, i) => i !== idx) });
    };

    const handleSave = async () => {
        if (!form.name) { showToast('请输入菜单名称', 'error'); return; }
        try {
            const payload = {
                name: form.name,
                description: form.description,
                dishes: form.dishes.map((d) => ({ dish_id: d.dish_id, servings: d.servings })),
            };
            if (editing) {
                await menuAPI.update(editing.id, payload);
                showToast('更新成功', 'success');
            } else {
                await menuAPI.create(payload);
                showToast('菜单创建成功 🎉', 'success');
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || '操作失败', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('确定删除此菜单？')) return;
        try {
            await menuAPI.delete(id);
            showToast('已删除', 'success');
            fetchData();
        } catch (err) { showToast('删除失败', 'error'); }
    };

    const handleViewList = async (menuId) => {
        try {
            const res = await menuAPI.getShoppingList(menuId);
            setShoppingList(res.data);
            setShowListModal(true);
        } catch (err) { showToast('生成清单失败', 'error'); }
    };

    const handleExport = async (menuId) => {
        try {
            const res = await tokenAPI.exportMenu(menuId);
            showToast(`密语：${res.data.code}（已复制）`, 'success');
            navigator.clipboard?.writeText(res.data.code);
        } catch (err) { showToast('导出失败', 'error'); }
    };

    const availableDishes = allDishes.filter(
        (d) => !form.dishes.find((fd) => fd.dish_id === d.id)
    );

    return (
        <>
            <header className="page-header">
                <h1>📋 菜单集</h1>
            </header>

            <div className="page-container">
                {loading ? (
                    <div className="card-list">{[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton--card" />)}</div>
                ) : menus.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen className="empty-state__icon" size={80} />
                        <div className="empty-state__title">还没有菜单</div>
                        <div className="empty-state__text">将多道菜组合为一个菜单</div>
                    </div>
                ) : (
                    <div className="card-list">
                        {menus.map((menu, index) => (
                            <div key={menu.id} className="card animate-card-enter" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="card__body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div className="card__title">{menu.name}</div>
                                            {menu.description && <div className="card__subtitle">{menu.description}</div>}
                                            <div className="card__meta">
                                                <span className="card__badge card__badge--primary">{(menu.menuDishes || []).length} 道菜</span>
                                                <span className="card__price">¥{menu.total_cost}<small> 预估</small></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                                        <button className="btn btn--sm btn--secondary" onClick={() => handleViewList(menu.id)}>
                                            <ShoppingCart size={14} /> 采购清单
                                        </button>
                                        <button className="btn btn--sm btn--secondary" onClick={() => handleExport(menu.id)}>
                                            <Share2 size={14} /> 导出密语
                                        </button>
                                        <button className="btn btn--sm btn--secondary" onClick={() => openEdit(menu)}>
                                            <Pencil size={14} /> 编辑
                                        </button>
                                        <button className="btn btn--sm btn--danger" onClick={() => handleDelete(menu.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button className="fab" onClick={openCreate}><Plus size={28} /></button>

            {/* 创建/编辑弹窗 */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div className="modal-header">
                            <h2>{editing ? '编辑菜单' : '新建菜单'}</h2>
                            <button className="page-header__action" onClick={() => setShowModal(false)}><X size={22} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">菜单名称</label>
                                <input className="form-input" placeholder="如：年夜饭" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">描述</label>
                                <input className="form-input" placeholder="可选" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">菜品列表</label>
                                {form.dishes.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                        {form.dishes.map((fd, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                                                padding: 'var(--space-sm) var(--space-md)',
                                                background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
                                            }}>
                                                <span style={{ flex: 1, fontWeight: 500 }}>{fd.name}</span>
                                                <input
                                                    className="form-input" type="number" min="1" value={fd.servings}
                                                    onChange={(e) => updateServings(idx, e.target.value)}
                                                    style={{ width: 60, minHeight: 36, textAlign: 'center' }}
                                                />
                                                <span className="text-sm text-secondary">份</span>
                                                <button className="page-header__action" style={{ color: 'var(--color-danger)', width: 32, height: 32 }}
                                                    onClick={() => removeDishFromForm(idx)}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {availableDishes.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', padding: 'var(--space-sm)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                                        {availableDishes.map((d) => (
                                            <button key={d.id} className="btn btn--sm btn--secondary" style={{ minHeight: 32, padding: '0 12px', fontSize: 'var(--font-size-xs)' }}
                                                onClick={() => addDishToForm(d)}>
                                                <Plus size={14} /> {d.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--primary btn--block" onClick={handleSave}>
                                {editing ? '保存修改' : '创建菜单'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 采购清单弹窗 */}
            {showListModal && shoppingList && (
                <div className="modal-overlay" onClick={() => setShowListModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div className="modal-header">
                            <h2>📝 采购清单</h2>
                            <button className="page-header__action" onClick={() => setShowListModal(false)}><X size={22} /></button>
                        </div>
                        <div className="modal-body" id="shopping-list-content">
                            <h3 style={{ marginBottom: 'var(--space-sm)' }}>{shoppingList.menu_name}</h3>

                            {/* 菜品列表 */}
                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <div className="form-label">菜品</div>
                                {shoppingList.shopping_list.dishes.map((d, i) => (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', padding: 'var(--space-xs) 0',
                                        borderBottom: '1px solid var(--border-light)',
                                    }}>
                                        <span>{d.name} × {d.servings}</span>
                                        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>¥{d.estimated_cost.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* 食材汇总 */}
                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <div className="form-label">采购清单（合并同类项）</div>
                                {shoppingList.shopping_list.ingredients.map((ing, i) => (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', padding: 'var(--space-xs) 0',
                                        borderBottom: '1px solid var(--border-light)',
                                    }}>
                                        <span>{ing.name}</span>
                                        <span>
                                            <b>{ing.total_quantity}{ing.unit}</b>
                                            <span style={{ color: 'var(--color-primary)', fontWeight: 600, marginLeft: 8 }}>¥{ing.total_price.toFixed(2)}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* 总计 */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', padding: 'var(--space-md)',
                                background: 'var(--color-primary-alpha)', borderRadius: 'var(--radius-md)',
                                fontWeight: 700, fontSize: 'var(--font-size-lg)',
                            }}>
                                <span>总计</span>
                                <span style={{ color: 'var(--color-primary)' }}>¥{shoppingList.shopping_list.grand_total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
