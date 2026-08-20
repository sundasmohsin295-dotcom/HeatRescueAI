import { useApp, type Toast as ToastType } from '@/context/AppContext';
import { CheckCircle, Info, AlertTriangle, XCircle, ShieldAlert, X } from 'lucide-react';

const ICONS: Record<ToastType['type'], typeof CheckCircle> = {
  SUCCESS: CheckCircle,
  INFO: Info,
  WARNING: AlertTriangle,
  ERROR: XCircle,
  SECURITY: ShieldAlert,
};

const COLORS: Record<ToastType['type'], { bg: string; color: string; border: string }> = {
  SUCCESS: { bg: 'var(--success-soft)', color: 'var(--success)', border: 'var(--success)' },
  INFO: { bg: 'var(--info-soft)', color: 'var(--info)', border: 'var(--info)' },
  WARNING: { bg: 'var(--warning-soft)', color: 'var(--warning)', border: 'var(--warning)' },
  ERROR: { bg: 'var(--danger-soft)', color: 'var(--danger)', border: 'var(--danger)' },
  SECURITY: { bg: 'var(--danger-soft)', color: 'var(--danger)', border: 'var(--danger)' },
};

export function ToastDeck() {
  const { toasts, dismissToast } = useApp();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
      role="alert"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type];
        const c = COLORS[toast.type];
        return (
          <div
            key={toast.id}
            className="animate-slide-in flex items-start gap-3 p-4 rounded-lg shadow-lg"
            style={{ background: 'var(--surface)', border: `1px solid ${c.border}`, boxShadow: 'var(--shadow)' }}
          >
            <div style={{ flexShrink: 0 }}>
              <Icon size={20} style={{ color: c.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{toast.message}</p>
              {toast.detail && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{toast.detail}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
