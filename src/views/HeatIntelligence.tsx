import { useApp } from '@/context/AppContext';
import { Card, Badge, SectionTitle, EmptyState, ProgressBar } from '@/components/ui';
import { normalizeZone, getFreshness } from '@/lib/dataService';
import { Thermometer, Sun, Clock, Activity, Database } from 'lucide-react';

export function HeatIntelligence() {
  const { zones, mode, selectedZoneId, selectZone } = useApp();

  return (
    <div className="space-y-6">
      <SectionTitle title="Heat Intelligence" subtitle="Baseline microclimate data registry" />

      <div className="flex items-center gap-2 mb-2">
        <Badge color={mode === 'LIVE' ? 'var(--accent)' : 'var(--text-muted)'}>
          {mode === 'LIVE' ? 'LIVE — FortyGuard' : 'DEMO — Simulated dataset'}
        </Badge>
        {mode === 'DEMO' && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Not real-time</span>}
      </div>

      <Card>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Zone Registry</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Zone</th>
                <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Air Temp (2m AGL)</th>
                <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Baseline</th>
                <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Anomaly</th>
                <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Persistence</th>
                <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Threshold</th>
                <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Solar Flux</th>
                <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Freshness</th>
                <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => {
                const obs = normalizeZone(zone, mode);
                const anomaly = zone.temperature - zone.baseline;
                const isSel = zone.zoneId === selectedZoneId;
                return (
                  <tr
                    key={zone.zoneId}
                    onClick={() => selectZone(zone.zoneId)}
                    className="cursor-pointer transition-colors"
                    style={{
                      background: isSel ? 'var(--accent-soft)' : 'transparent',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                    onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="py-3 px-2 font-medium" style={{ color: 'var(--text-primary)' }}>{zone.zoneName}</td>
                    <td className="py-3 px-2 text-right font-semibold" style={{ color: zone.temperature > 40 ? 'var(--danger)' : zone.temperature > 37 ? 'var(--warning)' : 'var(--text-primary)' }}>
                      {zone.temperature}°C
                    </td>
                    <td className="py-3 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>{zone.baseline}°C</td>
                    <td className="py-3 px-2 text-right" style={{ color: anomaly > 3 ? 'var(--warning)' : 'var(--text-secondary)' }}>+{anomaly.toFixed(1)}°C</td>
                    <td className="py-3 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>{zone.persistenceHours.toFixed(1)}h</td>
                    <td className="py-3 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>{zone.threshold}°C</td>
                    <td className="py-3 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>{zone.solarFlux} W/m²</td>
                    <td className="py-3 px-2" style={{ color: 'var(--text-secondary)' }}>{getFreshness(zone.timestamp)}</td>
                    <td className="py-3 px-2">
                      <Badge color={mode === 'LIVE' ? 'var(--accent)' : 'var(--text-muted)'}>{obs.source}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {zones.map((zone) => (
          <Card key={zone.zoneId}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{zone.zoneName}</h3>
              <Badge color={mode === 'LIVE' ? 'var(--accent)' : 'var(--text-muted)'}>{mode}</Badge>
            </div>
            <div className="space-y-3">
              <MetricRow icon={<Thermometer size={16} />} label="2m AGL Air Temperature" value={`${zone.temperature}°C`} />
              <MetricRow icon={<Activity size={16} />} label="Baseline" value={`${zone.baseline}°C`} />
              <MetricRow icon={<Thermometer size={16} />} label="Anomaly" value={`+${(zone.temperature - zone.baseline).toFixed(1)}°C`} />
              <MetricRow icon={<Clock size={16} />} label="Persistence >30°C" value={`${zone.persistenceHours.toFixed(1)} hours`} />
              <MetricRow icon={<Sun size={16} />} label="Solar Flux" value={`${zone.solarFlux} W/m²`} />
              <MetricRow icon={<Database size={16} />} label="Data Quality" value={`${(zone.dataQuality * 100).toFixed(0)}%`} />
              <div className="pt-1">
                <ProgressBar value={zone.dataQuality * 100} color="var(--success)" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MetricRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>{icon} {label}</span>
      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}
