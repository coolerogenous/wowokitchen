import { useNavigate } from 'react-router-dom';
import { ChefHat, Carrot, CookingPot, BookOpen, Users, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores';

const quickActions = [
    { icon: Carrot, label: '食材管理', desc: '看看冰箱还有啥', to: '/ingredients', color: '#A8D8B9' },
    { icon: CookingPot, label: '菜品管理', desc: '记录你的拿手菜', to: '/dishes', color: '#FFD580' },
    { icon: BookOpen, label: '菜单组合', desc: '一周吃什么', to: '/menus', color: '#AED9E0' },
    // { icon: Users, label: '发起饭局', desc: '邀请好友组局', to: '/profile', color: '#FFAB91' },
];

export default function HomePage() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    return (
        <>
            <header className="page-header">
                <h1>🐕 旺财厨房</h1>
                <div className="page-header__action" onClick={() => navigate('/profile')}>
                    <Users size={20} />
                </div>
            </header>

            <div className="page-container">
                {/* 欢迎区域 */}
                <div className="animate-card-enter" style={{
                    textAlign: 'center', margin: '20px 0 40px',
                    background: 'white', borderRadius: 30, padding: 30,
                    boxShadow: 'var(--shadow-card)', border: '1px solid rgba(255,255,255,0.8)'
                }}>
                    <div style={{ fontSize: '5rem', marginBottom: 10 }}>🐶</div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                        你好，{user?.nickname || '铲屎官'}!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        今天想给家里做点什么好吃的？
                    </p>
                </div>

                {/* 快捷操作 */}
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 8px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            常用功能
                        </h3>
                    </div>

                    <div className="card-list">
                        {quickActions.map((action, index) => (
                            <div
                                key={action.label}
                                className="card animate-card-enter"
                                style={{
                                    animationDelay: `${index * 80}ms`,
                                    cursor: 'pointer',
                                    background: action.color,
                                    border: 'none',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    minHeight: 120,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                                onClick={() => navigate(action.to)}
                            >
                                <div style={{
                                    position: 'absolute', right: -10, top: -10,
                                    opacity: 0.2, transform: 'rotate(15deg)'
                                }}>
                                    <action.icon size={80} color="white" />
                                </div>

                                <div className="card__body" style={{ position: 'relative', zIndex: 1, padding: 20 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                                    }}>
                                        <action.icon size={20} color={action.color} style={{ filter: 'brightness(0.8)' }} />
                                    </div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>
                                        {action.label}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                                        {action.desc}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 饭局卡片 */}
                <div
                    className="card animate-card-enter"
                    style={{
                        animationDelay: '300ms',
                        background: 'white',
                        cursor: 'pointer',
                        padding: 0,
                        border: '2px dashed var(--color-danger)',
                        background: '#FFF5F5'
                    }}
                    onClick={() => navigate('/party', { state: { create: true } })}
                >
                    <div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 24 }}>
                        <div style={{ fontSize: '3rem' }}>🥘</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                发起新饭局
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                邀请好友点菜，自动生成采购清单
                            </div>
                        </div>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%', background: 'var(--color-danger)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                        }}>
                            <ArrowRight size={20} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
