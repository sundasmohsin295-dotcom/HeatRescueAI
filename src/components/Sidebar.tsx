import { useApp, type DomainId } from '@/context/AppContext';
import {
  LayoutDashboard,
  Thermometer,
  Brain,
  FlaskConical,
  ShieldAlert,
  Shield,
  ScrollText,
  Settings,
  Flame,
} from 'lucide-react';

const DOMAINS: { id: DomainId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'command', label: 'Command Center', icon: LayoutDashboard },
  { id: 'intelligence', label: 'Heat Intelligence', icon: Thermometer },
  { id: 'ai', label: 'AI Investigator', icon: Brain },
  { id: 'simulation', label: 'Prediction & Simulation', icon: FlaskConical },
  { id: 'response', label: 'Response Operations', icon: ShieldAlert },
  { id: 'cyber', label: 'Cybersecurity', icon: Shield },
  { id: 'audit', label: 'Incidents & Audit', icon: ScrollText },
  { id: 'admin', label: 'Administration', icon: Settings },
];

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { activeDomain, setActiveDomain } = useApp();

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{ background: 'rgba(0,0,0,0.5)' }}
          className="fixed inset-0 z-30 md:hidden"
        />
      )}
      <aside
        className="fixed md:sticky top-0 left-0 h-screen z-40 flex flex-col transition-transform duration-300"
        style={{
          width: '260px',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 40, height: 40, background: 'var(--accent-soft)' }}
          >
            <Flame size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>HeatRescue AI</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Climate Decision Platform</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {DOMAINS.map((d) => {
            const Icon = d.icon;
            const active = activeDomain === d.id;
            return (
              <button
                key={d.id}
                onClick={() => {
                  setActiveDomain(d.id);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors text-left"
                style={{
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{d.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>v2.0 Enterprise</p>
        </div>
      </aside>
    </>
  );
}
