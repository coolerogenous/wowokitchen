import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('wk_user') || 'null'),
    token: localStorage.getItem('wk_token') || null,
    isAuthenticated: !!localStorage.getItem('wk_token'),

    login: (user, token) => {
        localStorage.setItem('wk_user', JSON.stringify(user));
        localStorage.setItem('wk_token', token);
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('wk_user');
        localStorage.removeItem('wk_token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    updateUser: (user) => {
        localStorage.setItem('wk_user', JSON.stringify(user));
        set({ user });
    },
}));

export const useToastStore = create((set) => ({
    toast: null,

    showToast: (message, type = 'info') => {
        set({ toast: { message, type } });
        setTimeout(() => set({ toast: null }), 2500);
    },

    hideToast: () => set({ toast: null }),
}));
