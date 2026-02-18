import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, CookingPot, X, Check } from 'lucide-react';
import { dishAPI, ingredientAPI } from '../../services/api';
import { useToastStore } from '../../stores';

export default function DishesPage() {
    const [dishes, setDishes] = useState([]);
    const [allIngredients, setAllIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', ingredients: [] });
    const showToast = useToastStore((s) => s.showToast);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [dishRes, ingRes] = await Promise.all([dishAPI.getAll(), ingredientAPI.getAll()]);
            setDishes(dishRes.data.dishes);
            setAllIngredients(ingRes.data.ingredients);
        } catch (err) {
            showToast('获取数据失败', 'error');
        } finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', description: '', ingredients: [] });
        setShowModal(true);
    };

    const openEdit = (dish) => {
        setEditing(dish);
        setForm({
            name: dish.name,
            description: dish.description || '',
            ingredients: (dish.dishIngredients || []).map((di) => ({
                ingredient_id: di.ingredient_id,
                quantity: di.quantity,
                unit: di.unit,
                name: di.ingredient?.name || '',
            })),
        });
        setShowModal(true);
    };

    const addIngredientToForm = (ing) => {
        if (form.ingredients.find((i) => i.ingredient_id === ing.id)) return;
        setForm({
            ...form,
            ingredients: [...form.ingredients, {
                ingredient_id: ing.id,
                name: ing.name,
                quantity: '',
                unit: ing.unit,
            }],
        });
    };

    const updateIngQuantity = (idx, quantity) => {
        const updated = [...form.ingredients];
        updated[idx].quantity = quantity;
        setForm({ ...form, ingredients: updated });
    };

    const removeIngFromForm = (idx) => {
        setForm({ ...form, ingredients: form.ingredients.filter((_, i) => i !== idx) });
    };

    const handleSave = async () => {
        if (!form.name) { showToast('请输入菜品名称', 'error'); return; }
        try {
            const payload = {
                name: form.name,
                description: form.description,
                ingredients: form.ingredients.map((i) => ({
                    ingredient_id: i.ingredient_id,
                    quantity: parseFloat(i.quantity) || 0,
                    unit: i.unit,
                })),
            };
            if (editing) {
                await dishAPI.update(editing.id, payload);
                showToast('更新成功', 'success');
            } else {
                await dishAPI.create(payload);
                showToast('菜品创建成功 🎉', 'success');
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || '操作失败', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('确定删除此菜品？')) return;
        try {
            await dishAPI.delete(id);
            showToast('已删除', 'success');
            fetchData();
        } catch (err) {
            showToast('删除失败', 'error');
        }
    };

    // 可选的食材（排除已添加的）
    const availableIngredients = allIngredients.filter(
        (ing) => !form.ingredients.find((fi) => fi.ingredient_id === ing.id)
    );

    return (
        <>
            <header className="page-header">
                <h1>🍳 菜品库</h1>
            </header>

            <div className="page-container">
                {loading ? (
                    <div className="card-list">
                        {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton--card" />)}
                    </div>
                ) : dishes.length === 0 ? (
                    <div className="empty-state">
                        <CookingPot className="empty-state__icon" size={80} />
                        <div className="empty-state__title">还没有菜品</div>
                        <div className="empty-state__text">先添加食材，再来创建你的第一道菜</div>
                    </div>
                ) : (
                    <div className="card-list">
                        {dishes.map((dish, index) => (
                            <div
                                key={dish.id}
                                className="card animate-card-enter"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="card__body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div className="card__title">{dish.name}</div>
                                            {dish.description && <div className="card__subtitle">{dish.description}</div>}
                                            <div className="card__meta">
                                                <span className="card__badge card__badge--primary">
                                                    {(dish.dishIngredients || []).length} 种食材
                                                </span>
                                                <span className="card__price">
                                                    ¥{dish.estimated_cost}<small> 预估</small>
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                            <button className="page-header__action" onClick={() => openEdit(dish)}>
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                className="page-header__action"
                                                style={{ color: 'var(--color-danger)' }}
                                                onClick={() => handleDelete(dish.id)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button className="fab" onClick={openCreate}>
                <Plus size={28} />
            </button>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div className="modal-header">
                            <h2>{editing ? '编辑菜品' : '新增菜品'}</h2>
                            <button className="page-header__action" onClick={() => setShowModal(false)}>
                                <X size={22} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">菜品名称</label>
                                <input
                                    className="form-input"
                                    placeholder="如：青椒肉丝"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">描述 (可选)</label>
                                <input
                                    className="form-input"
                                    placeholder="菜品简介"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>

                            {/* 已添加的食材 */}
                            <div className="form-group">
                                <label className="form-label">食材配方 (BOM)</label>
                                {form.ingredients.length === 0 ? (
                                    <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-sm)' }}>
                                        请从下方选择食材
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                        {form.ingredients.map((fi, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                                                padding: 'var(--space-sm) var(--space-md)',
                                                background: 'var(--bg-input)',
                                                borderRadius: 'var(--radius-sm)',
                                            }}>
                                                <span style={{ flex: 1, fontWeight: 500 }}>{fi.name}</span>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="用量"
                                                    value={fi.quantity}
                                                    onChange={(e) => updateIngQuantity(idx, e.target.value)}
                                                    style={{ width: 80, minHeight: 36, textAlign: 'center' }}
                                                />
                                                <span className="text-sm text-secondary">{fi.unit}</span>
                                                <button
                                                    className="page-header__action"
                                                    style={{ color: 'var(--color-danger)', width: 32, height: 32 }}
                                                    onClick={() => removeIngFromForm(idx)}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 可选食材列表 */}
                                {availableIngredients.length > 0 && (
                                    <div style={{
                                        display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)',
                                        padding: 'var(--space-sm)',
                                        background: 'var(--bg-input)',
                                        borderRadius: 'var(--radius-md)',
                                    }}>
                                        {availableIngredients.map((ing) => (
                                            <button
                                                key={ing.id}
                                                className="btn btn--sm btn--secondary"
                                                style={{ minHeight: 32, padding: '0 12px', fontSize: 'var(--font-size-xs)' }}
                                                onClick={() => addIngredientToForm(ing)}
                                            >
                                                <Plus size={14} /> {ing.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--primary btn--block" onClick={handleSave}>
                                {editing ? '保存修改' : '创建菜品'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
