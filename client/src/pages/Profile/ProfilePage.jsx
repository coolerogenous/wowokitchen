import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Key, ChevronRight, User, Users } from 'lucide-react';
import { useAuthStore, useToastStore } from '../../stores';
import { tokenAPI } from '../../services/api';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const showToast = useToastStore((s) => s.showToast);
    const [importCode, setImportCode] = useState('');
    const [showImport, setShowImport] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };

    const handleImport = async () => {
        if (!importCode.trim()) { showToast('请输入密语', 'error'); return; }
        try {
            const res = await tokenAPI.importByCode(importCode.trim());
            showToast(res.data.message + ' 🎉', 'success');
            setImportCode(''); setShowImport(false);
        } catch (err) { showToast(err.response?.data?.message || '导入失败', 'error'); }
    };

    const MenuItem = ({ icon, label, desc, onClick, danger, action }) => (
        <div
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
                padding: '16px 0', borderBottom: '1px solid var(--border-light)'
            }}
        >
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: danger ? '#FFF5F5' : '#F9FAFB',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: danger ? 'var(--color-danger)' : 'var(--text-primary)' }}>{label}</div>
                {desc && <div className="text-sm text-secondary" style={{ marginTop: 2 }}>{desc}</div>}
            </div>
            {action || (!danger && <ChevronRight size={20} color="var(--text-tertiary)" />)}
        </div>
    );

    return (
        <>
            <header className="page-header"><h1>👤 我的</h1></header>

            <div className="page-container">
                {/* Profile Card */}
                <div className="card animate-card-enter" style={{ marginBottom: 'var(--space-md)', padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{
                            width: 70, height: 70, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FFD580, #FFA726)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.5rem', color: 'white', fontWeight: 700,
                            boxShadow: '0 4px 12px rgba(255, 167, 38, 0.3)'
                        }}>
                            {(user?.nickname || '?')[0].toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{user?.nickname}</div>
                            <div className="text-sm text-secondary" style={{ marginTop: 4 }}>@{user?.username}</div>
                        </div>
                    </div>
                </div>

                {/* Menu List */}
                <div className="card animate-card-enter" style={{ animationDelay: '100ms', padding: '0 24px' }}>
                    <MenuItem
                        icon={<Users size={20} color="var(--color-primary)" />}
                        label="我的饭局"
                        desc="查看和管理所有饭局"
                        onClick={() => navigate('/party')}
                    />

                    <MenuItem
                        icon={<Key size={20} color="var(--color-primary)" />}
                        label="密语导入"
                        desc="输入密语克隆菜品或菜单"
                        onClick={() => setShowImport(!showImport)}
                    />

                    {showImport && (
                        <div className="animate-slide-up" style={{ padding: '16px 0', borderBottom: '1px solid var(--border-light)' }}>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <input
                                    className="form-input"
                                    placeholder="输入密语码"
                                    value={importCode}
                                    onChange={(e) => setImportCode(e.target.value)}
                                    style={{ flex: 1, textTransform: 'uppercase', fontFamily: 'monospace' }}
                                />
                                <button className="btn btn--primary btn--sm" onClick={handleImport}>导入</button>
                            </div>
                        </div>
                    )}

                    <MenuItem
                        icon={<LogOut size={20} color="var(--color-danger)" />}
                        label="退出登录"
                        danger
                        onClick={handleLogout}
                    />
                </div>

                <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-tertiary)', fontSize: 12 }}>
                    v1.0.0 · WoWoKitchen 🐶
                </div>
            </div>
        </>
    );
}
