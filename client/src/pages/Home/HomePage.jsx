import { useNavigate } from 'react-router-dom';
import { ChefHat, Carrot, CookingPot, BookOpen, Users, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores';

const quickActions = [
    { icon: Carrot, label: '食材管理', desc: '管理你的食材库', to: '/ingredients', color: '#2EC4B6' },
    { icon: CookingPot, label: '菜品管理', desc: '创建菜品配方', to: '/dishes', color: '#FF6B35' },
    { icon: BookOpen, label: '菜单组合', desc: '组合你的菜单', to: '/menus', color: '#FFBF69' },
    { icon: Users, label: '发起饭局', desc: '邀请好友组局', to: '/profile', color: '#E71D36' },
];

export default function HomePage() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    return (
        <>
            <header className="page-header">
                <h1>🐕 旺财厨房</h1>
            </header>

            <div className="page-container">
                {/* 欢迎区域 */}
                <div className="home-welcome animate-card-enter">
                    <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 'var(--space-xs)' }}>
                        你好，{user?.nickname || '主人'} 👋
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        今天想做什么好吃的？
                    </p>
                </div>

                {/* 快捷操作 */}
                <div style={{ marginTop: 'var(--space-lg)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                        快捷操作
                    </h3>
                    <div className="card-list" style={{ gap: 'var(--space-sm)' }}>
                        {quickActions.map((action, index) => (
                            <div
                                key={action.label}
                                className="card animate-card-enter"
                                style={{ animationDelay: `${index * 80}ms`, cursor: 'pointer' }}
                                onClick={() => navigate(action.to)}
                            >
                                <div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                    <div
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 'var(--radius-md)',
                                            background: `${action.color}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <action.icon size={24} color={action.color} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="card__title" style={{ fontSize: 'var(--font-size-base)' }}>{action.label}</div>
                                        <div className="card__subtitle">{action.desc}</div>
                                    </div>
                                    <ArrowRight size={18} color="var(--text-tertiary)" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 密语导入入口 */}
                <div
                    className="card animate-card-enter"
                    style={{
                        marginTop: 'var(--space-lg)',
                        animationDelay: '400ms',
                        background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)',
                        cursor: 'pointer',
                    }}
                    onClick={() => navigate('/profile')}
                >
                    <div className="card__body" style={{ textAlign: 'center', color: 'white', padding: 'var(--space-lg)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>🔑</div>
                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
                            密语导入
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.85 }}>
                            输入好友分享的密语，一键克隆菜品或菜单
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
