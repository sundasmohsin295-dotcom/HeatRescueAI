import { useApp } from '@/context/AppContext';
import { Card, Badge, SectionTitle, Button, EmptyState } from '@/components/ui';
import { Shield, Zap, RotateCcw, AlertTriangle, Lock, ShieldCheck } from 'lucide-react';
import { RATE_OF_CHANGE_LIMIT, type ToolPermission } from '@/lib/security';

const ALL_PERMISSIONS: { perm: ToolPermission; label: string; highRisk: boolean }[] = [
  { perm: 'READ_TELEMETRY', label: 'Read sensor telemetry', highRisk: false },
  { perm: 'READ_RISK', label: 'Read risk scores', highRisk: false },
  { perm: 'READ_MAP', label: 'Read map data', highRisk: false },
  { perm: 'CREATE_INVESTIGATION', label: 'Create investigation', highRisk: false },
  { perm: 'CREATE_RECOMMENDATION', label: 'Create recommendation', highRisk: false },
  { perm: 'CREATE_DISPATCH_REQUEST', label: 'Create dispatch request', highRisk: false },
  { perm: 'AUTHORIZE_DISPATCH', label: 'Authorize dispatch', highRisk: true },
  { perm: 'SEND_ALERT', label: 'Send public alert', highRisk: true },
  { perm: 'ISOLATE_NODE', label: 'Isolate sensor node', highRisk: true },
  { perm: 'CHANGE_INCIDENT_STATE', label: 'Change incident state', highRisk: true },
];

export function Cybersecurity() {
  const { securityEvents, testAntiSpoof, resetIsolation, pushToast } = useApp();

  return (
    <div className="space-y-6">
      <SectionTitle title="Cybersecurity" subtitle="Climate Infrastructure Security — Zero-Trust telemetry verification" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Anti-Spoof Defense</h3>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Physical rate-of-change anti-spoofing defense. If a telemetry value changes faster than the configured diffusion limit, the sensor is flagged and isolated.
          </p>
          <div className="p-3 rounded-lg mb-4" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Rate-of-Change Limit: <span className="font-bold" style={{ color: 'var(--warning)' }}>{RATE_OF_CHANGE_LIMIT}°C/min</span>
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Any temperature change exceeding this rate is physically implausible and flagged as potential telemetry spoofing.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={testAntiSpoof} variant="warning"><Zap size={16} className="inline mr-1" /> Test Anti-Spoof</Button>
            <Button onClick={resetIsolation} variant="secondary"><RotateCcw size={16} className="inline mr-1" /> Reset Isolation</Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>AI Tool Permissions</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Least-privilege model. High-risk actions require explicit human authorization.</p>
          <div className="space-y-2">
            {ALL_PERMISSIONS.map((p) => (
              <div key={p.perm} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
                {p.highRisk ? (
                  <Badge color="var(--danger)"><Lock size={10} className="inline mr-1" /> HUMAN APPROVAL</Badge>
                ) : (
                  <Badge color="var(--success)">AUTO</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} style={{ color: securityEvents.length > 0 ? 'var(--danger)' : 'var(--success)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Security Events</h3>
          </div>
          {securityEvents.length > 0 && <Button size="sm" variant="ghost" onClick={resetIsolation}>Reset</Button>}
        </div>

        {securityEvents.length === 0 ? (
          <EmptyState message="No security events." detail="All telemetry validated. Click 'Test Anti-Spoof' to simulate an anomaly." />
        ) : (
          <div className="space-y-3">
            {securityEvents.map((e) => (
              <div key={e.id} className="p-4 rounded-lg" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge color="var(--danger)">{e.state}</Badge>
                  {e.isDemo && <Badge color="var(--warning)">DEMO SECURITY EVENT</Badge>}
                  {e.isolated && <Badge color="var(--danger)"><Lock size={10} className="inline mr-1" /> ISOLATED</Badge>}
                </div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{e.description}</p>
                {e.rateOfChange && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                    Rate: {e.rateOfChange.toFixed(1)}°C/min | Sensor: {e.sensorId} | Timestamp: {new Date(e.timestamp).toLocaleString()}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Recommended action: ISOLATE SENSOR. This is a defensive simulation — not a real cyberattack.
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Zero-Trust Telemetry Validation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { check: 'Schema Validation', status: 'ACTIVE' },
            { check: 'Timestamp Validation', status: 'ACTIVE' },
            { check: 'Source Verification', status: 'ACTIVE' },
            { check: 'Geographic Consistency', status: 'ACTIVE' },
            { check: 'Expected Range Check', status: 'ACTIVE' },
            { check: 'Freshness Check', status: 'ACTIVE' },
            { check: 'Sequence Integrity', status: 'ACTIVE' },
            { check: 'Rate-of-Change', status: 'ACTIVE' },
          ].map((c) => (
            <div key={c.check} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.check}</span>
              <Badge color="var(--success)">{c.status}</Badge>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Trust states: TRUSTED → SUSPICIOUS → REJECTED. No telemetry is automatically classified as a cyberattack — anomalies are flagged as "potential data integrity anomalies."
        </p>
      </Card>
    </div>
  );
}
