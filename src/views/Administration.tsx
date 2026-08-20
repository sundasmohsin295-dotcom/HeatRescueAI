import { useApp } from '@/context/AppContext';
import { Card, SectionTitle, Button, Badge } from '@/components/ui';
import { Settings, Key, Clock, MapPin, Save, Info } from 'lucide-react';
import { useState } from 'react';
import { isLiveConfigured } from '@/lib/fortyguard';

export function Administration() {
  const { adminSettings, saveAdminSettings, mode, setMode, pushToast } = useApp();
  const [pollingFrequency, setPollingFrequency] = useState(adminSettings.pollingFrequency);
  const [spatialResolution, setSpatialResolution] = useState(adminSettings.spatialResolution);

  const handleSave = () => {
    if (pollingFrequency < 5) {
      pushToast('WARNING', 'Polling frequency too aggressive.', 'Minimum is 5 seconds to respect API rate limits.');
      return;
    }
    if (pollingFrequency > 300) {
      pushToast('WARNING', 'Polling frequency too slow.', 'Maximum is 300 seconds (5 minutes).');
      return;
    }
    saveAdminSettings({ pollingFrequency, spatialResolution });
  };

  const liveReady = isLiveConfigured();

  return (
    <div className="space-y-6">
      <SectionTitle title="Administration" subtitle="Platform configuration and API settings" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Key size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>FortyGuard API Configuration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>API Key Status</label>
              <div className="flex items-center gap-2">
                <Badge color={liveReady ? 'var(--success)' : 'var(--text-muted)'}>
                  {liveReady ? 'PROXY AVAILABLE' : 'NO PROXY'}
                </Badge>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {liveReady ? 'Edge function deployed' : 'Deploy fortyguard-proxy edge function for LIVE mode'}
                </span>
              </div>
              <p className="text-xs mt-2 p-2 rounded" style={{ background: 'var(--surface-elevated)', color: 'var(--text-muted)' }}>
                The API key is stored as a server-side secret (FORTYGUARD_API_KEY) in the Supabase Edge Function. It is NEVER exposed in frontend code, localStorage, or the GitHub Pages bundle.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>Data Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('LIVE')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    background: mode === 'LIVE' ? 'var(--accent)' : 'var(--surface-elevated)',
                    color: mode === 'LIVE' ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${mode === 'LIVE' ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  LIVE
                </button>
                <button
                  onClick={() => setMode('DEMO')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    background: mode === 'DEMO' ? 'var(--text-muted)' : 'var(--surface-elevated)',
                    color: mode === 'DEMO' ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${mode === 'DEMO' ? 'var(--text-muted)' : 'var(--border)'}`,
                  }}
                >
                  DEMO
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {mode === 'LIVE' ? 'Real FortyGuard data via secure proxy' : 'Deterministic simulated dataset — not real-time'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Polling Frequency</h3>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Interval (seconds)</label>
              <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{pollingFrequency}s</span>
            </div>
            <input
              type="range"
              min={5}
              max={300}
              step={5}
              value={pollingFrequency}
              onChange={(e) => setPollingFrequency(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--accent)' }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <span>5s (aggressive)</span><span>150s</span><span>300s (conservative)</span>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Estimated API calls: ~{Math.round((3600 / pollingFrequency) * 24 * 30)}/month (if polling continuously)
            </p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Spatial Resolution</h3>
          </div>

          <div className="space-y-2">
            {([60, 80, 100] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSpatialResolution(r)}
                className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
                style={{
                  background: spatialResolution === r ? 'var(--accent-soft)' : 'var(--surface-elevated)',
                  border: `1px solid ${spatialResolution === r ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r}m resolution</span>
                {spatialResolution === r && <Badge color="var(--accent)">SELECTED</Badge>}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Finer resolution (60m) provides more detail but consumes more API credits.
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Info size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>System Information</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Version</span>
              <span style={{ color: 'var(--text-primary)' }}>2.0 Enterprise</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Architecture</span>
              <span style={{ color: 'var(--text-primary)' }}>8-Domain</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Risk Engine</span>
              <span style={{ color: 'var(--text-primary)' }}>Canonical (v1)</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Audit Chain</span>
              <span style={{ color: 'var(--text-primary)' }}>SHA-256 / Web Crypto</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Map Engine</span>
              <span style={{ color: 'var(--text-primary)' }}>Leaflet / OSM</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Backend</span>
              <span style={{ color: 'var(--text-primary)' }}>Supabase Edge Functions</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} variant="primary"><Save size={16} className="inline mr-1" /> Save Settings</Button>
      </div>
    </div>
  );
}
