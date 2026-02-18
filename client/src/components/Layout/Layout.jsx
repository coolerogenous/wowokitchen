import { NavLink, Outlet } from 'react-router-dom';
import { Home, Carrot, CookingPot, BookOpen, User } from 'lucide-react';
import Toast from '../Toast';

const navItems = [
    { to: '/', icon: Home, label: '首页' },
    { to: '/ingredients', icon: Carrot, label: '食材' },
    { to: '/dishes', icon: CookingPot, label: '菜品' },
    { to: '/menus', icon: BookOpen, label: '菜单' },
    { to: '/profile', icon: User, label: '我的' },
];

export default function Layout() {
    return (
        <div className="app-layout">
            <main className="main-content">
                <Outlet />
            </main>

            <nav className="bottom-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `bottom-nav__item ${isActive ? 'active' : ''}`
                        }
                        end={item.to === '/'}
                    >
                        <item.icon className="bottom-nav__icon" size={24} />
                        <span className="bottom-nav__label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <Toast />
        </div>
    );
}
