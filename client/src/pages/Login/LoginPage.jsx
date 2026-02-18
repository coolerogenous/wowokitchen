import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, User } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuthStore, useToastStore } from '../../stores';

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({ username: '', password: '', nickname: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const showToast = useToastStore((s) => s.showToast);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.username || !form.password) {
            showToast('请填写用户名和密码', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = isRegister
                ? await authAPI.register(form)
                : await authAPI.login(form);
            login(res.data.user, res.data.token);
            showToast(isRegister ? '注册成功 🎉' : '登录成功 👋', 'success');
            navigate('/');
        } catch (err) {
            showToast(err.response?.data?.message || '操作失败', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card animate-card-enter">
                <div style={{ marginBottom: 30 }}>
                    <div style={{
                        width: 80, height: 80, background: 'var(--color-primary-light)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', boxShadow: 'var(--shadow-md)', border: '4px solid white'
                    }}>
                        <span style={{ fontSize: '3.5rem' }}>🐶</span>
                    </div>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: 4 }}>旺财厨房</h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>让每一餐都充满期待</p>
                </div>

                <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-light)' }}>
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                        {isRegister ? '创建新账号' : '欢迎回来'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div className="input-wrapper">
                            <User className="input-icon" size={20} />
                            <input
                                className="form-input has-icon"
                                type="text"
                                placeholder="用户名"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-wrapper">
                            <ChefHat className="input-icon" size={20} />
                            <input
                                className="form-input has-icon"
                                type="password"
                                placeholder="密码"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                            />
                        </div>
                    </div>

                    {isRegister && (
                        <div className="form-group animate-slide-up">
                            <div className="input-wrapper">
                                <span className="input-icon" style={{ fontSize: 18, fontWeight: 700 }}>@</span>
                                <input
                                    className="form-input has-icon"
                                    type="text"
                                    placeholder="你的昵称"
                                    value={form.nickname}
                                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: 30 }}>
                        <button
                            type="submit"
                            className="btn btn--primary btn--block"
                            style={{ height: 56, fontSize: '1.1rem', boxShadow: '0 8px 20px rgba(255, 213, 128, 0.6)' }}
                            disabled={loading}
                        >
                            {loading ? '处理中...' : isRegister ? '注册并登录' : '登 录'}
                        </button>
                    </div>
                </form>

                <div style={{ marginTop: 24, fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                    {isRegister ? '已有账号？' : '还没有账号？'}
                    <span
                        style={{ color: 'var(--color-primary-dark)', cursor: 'pointer', fontWeight: 700, marginLeft: 6, textDecoration: 'underline' }}
                        onClick={() => { setIsRegister(!isRegister); setForm({ username: '', password: '', nickname: '' }); }}
                    >
                        {isRegister ? '直接登录' : '免费注册'}
                    </span>
                </div>
            </div>

            <div style={{ position: 'fixed', bottom: 20, color: 'var(--text-tertiary)', fontSize: 12, opacity: 0.6 }}>
                WoWoKitchen v1.0
            </div>
        </div>
    );
}
