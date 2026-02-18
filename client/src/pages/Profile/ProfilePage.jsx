import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Key, Users, ChevronRight } from 'lucide-react';
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

    const iconBox = (bg, color, Icon) => (
        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={20} color={color} />
        </div>
    );

    const menuItem = (icon, label, desc, onClick, danger) => (
        <div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }} onClick={onClick}>
            {icon}
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: danger ? 'var(--color-danger)' : undefined }}>{label}</div>
                {desc && <div className="text-sm text-secondary">{desc}</div>}
            </div>
            {!danger && <ChevronRight size={18} color="var(--text-tertiary)" />}
        </div>
    );

    return (
        <>
            <header className="page-header"><h1>👤 我的</h1></header>
            <div className="page-container">
                <div className="card animate-card-enter" style={{ marginBottom: 'var(--space-md)' }}>
                    <div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'white', fontWeight: 700 }}>
                            {(user?.nickname || '?')[0].toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{user?.nickname}</div>
                            <div className="text-sm text-secondary">@{user?.username}</div>
                        </div>
                    </div>
                </div>

                <div className="card animate-card-enter" style={{ animationDelay: '100ms' }}>
                    {menuItem(iconBox('rgba(255,107,53,0.1)', 'var(--color-primary)', Key), '密语导入', '输入密语克隆菜品或菜单', () => setShowImport(!showImport))}
                    {showImport && (
                        <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-input)' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <input className="form-input" placeholder="输入密语码" value={importCode} onChange={(e) => setImportCode(e.target.value)} style={{ flex: 1, textTransform: 'uppercase' }} />
                                <button className="btn btn--primary btn--sm" onClick={handleImport}>导入</button>
                            </div>
                        </div>
                    )}
                    {menuItem(iconBox('rgba(46,196,182,0.1)', 'var(--color-secondary)', Users), '我的饭局', '管理和发起饭局', () => navigate('/party'))}
                    {menuItem(iconBox('rgba(231,29,54,0.1)', 'var(--color-danger)', LogOut), '退出登录', null, handleLogout, true)}
                </div>
            </div>
        </>
    );
}
