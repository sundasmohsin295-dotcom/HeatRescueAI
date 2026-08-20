import { useApp, type DomainId } from '@/context/AppContext';
import { Sun, Moon, Menu, Play, Zap, Activity, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const DOMAIN_LABELS: Record<DomainId, string> = {
  command: 'Command Center',
  intelligence: 'Heat Intelligence',
  ai: 'AI Investigator',
  simulation: 'Prediction & Simulation',
  response: 'Response Operations',
  cyber: 'Cybersecurity',
  audit: 'Incidents & Audit',
  admin: 'Administration',
};

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme, mode, setMode, launchJudgeDemo, judgeDemoRunning, cancelJudgeDemo, testAntiSpoof, zones, securityEvents, pushToast } = useApp();
  const [modeSwitching, setModeSwitching] = useState(false);

  const maxRisk = zones.reduce((max, z) => Math.max(max, z.temperature), 0);
  const activeIncidents = zones.filter((z) => z.temperature > 37).length;
  const highestZone = zones.find((z) => z.temperature === maxRisk);
  const securityStatus = securityEvents.some((e) => e.isolated) ? 'ALERT' : 'SECURE';

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
      style={{ background: 'var(--topbar-bg)', borderBottom: '1px solid var(--border)' }}
    >
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="Toggle navigation"
      >
        <Menu size={20} />
      </button>

      <div className="hidden lg:flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Activity size={16} style={{ color: maxRisk > 40 ? 'var(--danger)' : maxRisk > 37 ? 'var(--warning)' : 'var(--success)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Max Risk:</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{Math.round(maxRisk * 2.2)}/100</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ color: 'var(--text-muted)' }}>Incidents:</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{activeIncidents}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ color: 'var(--text-muted)' }}>Hotspot:</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{highestZone?.zoneName ?? 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={16} style={{ color: securityStatus === 'SECURE' ? 'var(--success)' : 'var(--danger)' }} />
          <span className="font-semibold" style={{ color: securityStatus === 'SECURE' ? 'var(--success)' : 'var(--danger)' }}>{securityStatus}</span>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--border-strong)' }}
        >
          <button
            onClick={() => {
              if (mode === 'DEMO') {
                setModeSwitching(true);
                setMode('LIVE');
                setTimeout(() => setModeSwitching(false), 500);
                pushToast('INFO', 'LIVE mode enabled.', 'FortyGuard API proxy will be used.');
              }
            }}
            disabled={mode === 'LIVE'}
            className="px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              background: mode === 'LIVE' ? 'var(--accent)' : 'transparent',
              color: mode === 'LIVE' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {modeSwitching ? '...' : 'LIVE'}
          </button>
          <button
            onClick={() => setMode('DEMO')}
            disabled={mode === 'DEMO'}
            className="px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              background: mode === 'DEMO' ? 'var(--text-muted)' : 'transparent',
              color: mode === 'DEMO' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            DEMO
          </button>
        </div>

        <button
          onClick={testAntiSpoof}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: 'var(--warning-soft)', color: 'var(--warning)', border: '1px solid var(--warning)' }}
          title="Simulate an impossible thermal jump and test anti-spoofing defense"
        >
          <Zap size={14} />
          Test Anti-Spoof
        </button>

        <button
          onClick={judgeDemoRunning ? cancelJudgeDemo : launchJudgeDemo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{
            background: judgeDemoRunning ? 'var(--danger-soft)' : 'var(--accent-soft)',
            color: judgeDemoRunning ? 'var(--danger)' : 'var(--accent)',
            border: `1px solid ${judgeDemoRunning ? 'var(--danger)' : 'var(--accent)'}`,
          }}
        >
          <Play size={14} />
          {judgeDemoRunning ? 'Cancel Demo' : 'Launch Judge Demo'}
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          aria-label="Toggle theme"
        >
          {theme === 'theme-dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
