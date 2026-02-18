import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat } from 'lucide-react';
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
            <div className="auth-logo">
                <span className="auth-logo__emoji">🐕</span>
                旺财厨房
            </div>
            <p className="auth-subtitle">精准采购，轻松组局</p>

            <div className="auth-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">用户名</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="输入用户名"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">密码</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="输入密码"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>

                    {isRegister && (
                        <div className="form-group">
                            <label className="form-label">昵称</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="给自己起个名字"
                                value={form.nickname}
                                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn--primary btn--block btn--lg"
                        disabled={loading}
                    >
                        {loading ? '处理中...' : isRegister ? '注册' : '登录'}
                    </button>
                </form>

                <div className="auth-toggle">
                    {isRegister ? '已有账号？' : '没有账号？'}
                    <a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(!isRegister); }}>
                        {isRegister ? '去登录' : '去注册'}
                    </a>
                </div>
            </div>
        </div>
    );
}
