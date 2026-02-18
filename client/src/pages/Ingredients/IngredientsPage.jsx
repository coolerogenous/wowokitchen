import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Package, X } from 'lucide-react';
import { ingredientAPI } from '../../services/api';
import { useToastStore } from '../../stores';

export default function IngredientsPage() {
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', unit_price: '', unit_spec: '', unit: 'g' });
    const showToast = useToastStore((s) => s.showToast);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const res = await ingredientAPI.getAll();
            setIngredients(res.data.ingredients);
        } catch (err) {
            showToast('获取食材失败', 'error');
        } finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', unit_price: '', unit_spec: '', unit: 'g' });
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            name: item.name,
            unit_price: item.unit_price,
            unit_spec: item.unit_spec || '',
            unit: item.unit,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name) { showToast('请输入食材名称', 'error'); return; }
        try {
            if (editing) {
                await ingredientAPI.update(editing.id, form);
                showToast('更新成功', 'success');
            } else {
                await ingredientAPI.create(form);
                showToast('创建成功 🎉', 'success');
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || '操作失败', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('确定删除此食材？')) return;
        try {
            await ingredientAPI.delete(id);
            showToast('已删除', 'success');
            fetchData();
        } catch (err) {
            showToast('删除失败', 'error');
        }
    };

    return (
        <>
            <header className="page-header">
                <h1>🥬 食材库</h1>
            </header>

            <div className="page-container">
                {loading ? (
                    <div className="card-list">
                        {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton--card" />)}
                    </div>
                ) : ingredients.length === 0 ? (
                    <div className="empty-state">
                        <Package className="empty-state__icon" size={80} />
                        <div className="empty-state__title">还没有食材</div>
                        <div className="empty-state__text">点击右下角按钮添加你的第一个食材吧</div>
                    </div>
                ) : (
                    <div className="card-list">
                        {ingredients.map((item, index) => (
                            <div
                                key={item.id}
                                className="card animate-card-enter"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="card__body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div className="card__title">{item.name}</div>
                                            <div className="card__meta">
                                                <span className="card__badge card__badge--primary">
                                                    ¥{item.unit_price}/{item.unit_spec || item.unit}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                            <button className="page-header__action" onClick={() => openEdit(item)}>
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                className="page-header__action"
                                                style={{ color: 'var(--color-danger)' }}
                                                onClick={() => handleDelete(item.id)}
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

            {/* FAB */}
            <button className="fab" onClick={openCreate}>
                <Plus size={28} />
            </button>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div className="modal-header">
                            <h2>{editing ? '编辑食材' : '新增食材'}</h2>
                            <button className="page-header__action" onClick={() => setShowModal(false)}>
                                <X size={22} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">名称</label>
                                <input
                                    className="form-input"
                                    placeholder="如：猪肉"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">采购单价 (元)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        step="0.01"
                                        placeholder="15.00"
                                        value={form.unit_price}
                                        onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">基本单位</label>
                                    <input
                                        className="form-input"
                                        placeholder="g / 个 / ml"
                                        value={form.unit}
                                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">采购规格</label>
                                <input
                                    className="form-input"
                                    placeholder="如：500g/包"
                                    value={form.unit_spec}
                                    onChange={(e) => setForm({ ...form, unit_spec: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--primary btn--block" onClick={handleSave}>
                                {editing ? '保存修改' : '创建食材'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
