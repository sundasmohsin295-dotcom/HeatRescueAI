import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl p-5 ${className}`}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
  color?: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: color ?? 'var(--text-primary)' }}>{value}</p>
          {sublabel && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sublabel}</p>}
        </div>
        {icon && <div style={{ color: color ?? 'var(--text-muted)' }}>{icon}</div>}
      </div>
    </Card>
  );
}

export function Badge({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  size = 'md',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost';
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  const variants: Record<string, { bg: string; color: string; border: string }> = {
    primary: { bg: 'var(--accent)', color: '#fff', border: 'var(--accent)' },
    secondary: { bg: 'var(--surface-elevated)', color: 'var(--text-primary)', border: 'var(--border-strong)' },
    danger: { bg: 'var(--danger)', color: '#fff', border: 'var(--danger)' },
    warning: { bg: 'var(--warning)', color: '#000', border: 'var(--warning)' },
    ghost: { bg: 'transparent', color: 'var(--text-secondary)', border: 'var(--border)' },
  };
  const v = variants[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-semibold transition-all ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
      style={{ background: v.bg, color: v.color, border: `1px solid ${v.border}` }}
    >
      {children}
    </button>
  );
}

export function ProgressBar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color ?? 'var(--accent)' }}
      />
    </div>
  );
}

export function EmptyState({ message, detail }: { message: string; detail?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{message}</p>
      {detail && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{detail}</p>}
    </div>
  );
}

export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="spin w-8 h-8 rounded-full border-2 border-transparent" style={{ borderTopColor: 'var(--accent)', borderRightColor: 'var(--accent)', borderBottomColor: 'var(--border)' }} />
      {message && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p>}
    </div>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
    </div>
  );
}
