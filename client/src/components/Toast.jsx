import { useToastStore } from '../stores';

export default function Toast() {
    const { toast } = useToastStore();
    if (!toast) return null;

    const className = `toast ${toast.type === 'error' ? 'toast--error' : toast.type === 'success' ? 'toast--success' : ''}`;

    return <div className={className}>{toast.message}</div>;
}
